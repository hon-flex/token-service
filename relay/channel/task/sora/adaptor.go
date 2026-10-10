package sora

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/relay/channel"
	taskcommon "github.com/QuantumNous/new-api/relay/channel/task/taskcommon"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/service"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
	"github.com/tidwall/sjson"
)

// ============================
// Request / Response structures
// ============================

type ContentItem struct {
	Type     string    `json:"type"`                // "text" or "image_url"
	Text     string    `json:"text,omitempty"`      // for text type
	ImageURL *ImageURL `json:"image_url,omitempty"` // for image_url type
}

type ImageURL struct {
	URL string `json:"url"`
}

type responseTask struct {
	ID                 string `json:"id"`
	TaskID             string `json:"task_id,omitempty"` //兼容旧接口
	Object             string `json:"object"`
	Model              string `json:"model"`
	Status             string `json:"status"`
	Progress           int    `json:"progress"`
	CreatedAt          int64  `json:"created_at"`
	CompletedAt        int64  `json:"completed_at,omitempty"`
	ExpiresAt          int64  `json:"expires_at,omitempty"`
	Seconds            string `json:"seconds,omitempty"`
	Size               string `json:"size,omitempty"`
	RemixedFromVideoID string `json:"remixed_from_video_id,omitempty"`
	Error              *struct {
		Message string          `json:"message"`
		Code    json.RawMessage `json:"code"` // Compatible providers return either a string or a number.
	} `json:"error,omitempty"`
}

// ============================
// Adaptor implementation
// ============================

type TaskAdaptor struct {
	taskcommon.BaseBilling
	ChannelType int
	h3Enabled   bool
	apiKey      string
	baseURL     string
}

func (a *TaskAdaptor) Init(info *relaycommon.RelayInfo) {
	a.ChannelType = info.ChannelType
	a.h3Enabled = info.ChannelSetting.IsSoraH3(info.ChannelType)
	a.baseURL = info.ChannelBaseUrl
	a.apiKey = info.ApiKey
}

func validateRemixRequest(c *gin.Context) *dto.TaskError {
	var req relaycommon.TaskSubmitReq
	if err := common.UnmarshalBodyReusable(c, &req); err != nil {
		return service.TaskErrorWrapperLocal(err, "invalid_request", http.StatusBadRequest)
	}
	if strings.TrimSpace(req.Prompt) == "" {
		return service.TaskErrorWrapperLocal(fmt.Errorf("field prompt is required"), "invalid_request", http.StatusBadRequest)
	}
	// 存储原始请求到 context，与 ValidateMultipartDirect 路径保持一致
	c.Set("task_request", req)
	return nil
}

func (a *TaskAdaptor) ValidateRequestAndSetAction(c *gin.Context, info *relaycommon.RelayInfo) (taskErr *dto.TaskError) {
	if info.Action == constant.TaskActionRemix {
		return validateRemixRequest(c)
	}
	if taskErr = relaycommon.ValidateMultipartDirect(c, info); taskErr != nil {
		return taskErr
	}
	if a.h3Enabled {
		if err := normalizeH3BillingRequest(c, info); err != nil {
			return service.TaskErrorWrapperLocal(err, "invalid_request", http.StatusBadRequest)
		}
	}
	return nil
}

// EstimateBilling 根据用户请求的 seconds 和 size 计算 OtherRatios。
func (a *TaskAdaptor) EstimateBilling(c *gin.Context, info *relaycommon.RelayInfo) map[string]float64 {
	// remix 路径的 OtherRatios 已在 ResolveOriginTask 中设置
	if info.Action == constant.TaskActionRemix {
		return nil
	}

	req, err := relaycommon.GetTaskRequest(c)
	if err != nil {
		return nil
	}

	seconds, _ := strconv.Atoi(req.Seconds)
	if seconds == 0 {
		seconds = req.Duration
	}
	if seconds <= 0 {
		seconds = 4
	}

	size := req.Size
	if size == "" {
		size = "720x1280"
	}

	ratios := map[string]float64{
		"seconds": float64(seconds),
		"size":    1,
	}
	if size == "1792x1024" || size == "1024x1792" {
		ratios["size"] = 1.666667
	}
	return ratios
}

func (a *TaskAdaptor) BuildRequestURL(info *relaycommon.RelayInfo) (string, error) {
	if info.Action == constant.TaskActionRemix {
		return fmt.Sprintf("%s/v1/videos/%s/remix", a.baseURL, info.OriginTaskID), nil
	}
	return fmt.Sprintf("%s/v1/videos", a.baseURL), nil
}

// BuildRequestHeader sets required headers.
func (a *TaskAdaptor) BuildRequestHeader(c *gin.Context, req *http.Request, info *relaycommon.RelayInfo) error {
	req.Header.Set("Authorization", "Bearer "+a.apiKey)
	req.Header.Set("Content-Type", c.Request.Header.Get("Content-Type"))
	return nil
}

func (a *TaskAdaptor) BuildRequestBody(c *gin.Context, info *relaycommon.RelayInfo) (io.Reader, error) {
	storage, err := common.GetBodyStorage(c)
	if err != nil {
		return nil, errors.Wrap(err, "get_request_body_failed")
	}
	cachedBody, err := storage.Bytes()
	if err != nil {
		return nil, errors.Wrap(err, "read_body_bytes_failed")
	}
	contentType := c.GetHeader("Content-Type")

	if strings.HasPrefix(contentType, "application/json") {
		var bodyMap map[string]interface{}
		if err := common.Unmarshal(cachedBody, &bodyMap); err == nil {
			bodyMap["model"] = info.UpstreamModelName
			if a.h3Enabled && info.Action != constant.TaskActionRemix {
				return buildH3Form(c, bodyMap)
			}
			if newBody, err := common.Marshal(bodyMap); err == nil {
				return bytes.NewReader(newBody), nil
			}
		}
		return bytes.NewReader(cachedBody), nil
	}

	if strings.Contains(contentType, "multipart/form-data") {
		formData, err := common.ParseMultipartFormReusable(c)
		if err != nil {
			return bytes.NewReader(cachedBody), nil
		}
		var buf bytes.Buffer
		writer := multipart.NewWriter(&buf)
		writer.WriteField("model", info.UpstreamModelName)
		for key, values := range formData.Value {
			if key == "model" {
				continue
			}
			for _, v := range values {
				writer.WriteField(key, v)
			}
		}
		for fieldName, fileHeaders := range formData.File {
			for _, fh := range fileHeaders {
				f, err := fh.Open()
				if err != nil {
					continue
				}
				ct := fh.Header.Get("Content-Type")
				if ct == "" || ct == "application/octet-stream" {
					buf512 := make([]byte, 512)
					n, _ := io.ReadFull(f, buf512)
					ct = http.DetectContentType(buf512[:n])
					// Re-open after sniffing so the full content is copied below
					f.Close()
					f, err = fh.Open()
					if err != nil {
						continue
					}
				}
				h := make(textproto.MIMEHeader)
				h.Set("Content-Disposition", fmt.Sprintf(`form-data; name="%s"; filename="%s"`, fieldName, fh.Filename))
				h.Set("Content-Type", ct)
				part, err := writer.CreatePart(h)
				if err != nil {
					f.Close()
					continue
				}
				io.Copy(part, f)
				f.Close()
			}
		}
		writer.Close()
		c.Request.Header.Set("Content-Type", writer.FormDataContentType())
		return &buf, nil
	}

	return common.ReaderOnly(storage), nil
}

// DoRequest delegates to common helper.
func (a *TaskAdaptor) DoRequest(c *gin.Context, info *relaycommon.RelayInfo, requestBody io.Reader) (*http.Response, error) {
	if body, ok := requestBody.(*h3FormBody); ok {
		defer body.cleanup()
		defer c.Request.Header.Set("Content-Type", body.originalContentType)
		requestURL, err := a.BuildRequestURL(info)
		if err != nil {
			return nil, err
		}
		req, err := http.NewRequestWithContext(c.Request.Context(), http.MethodPost, requestURL, io.NewSectionReader(body.File, 0, body.size))
		if err != nil {
			return nil, err
		}
		req.ContentLength = body.size
		req.GetBody = func() (io.ReadCloser, error) {
			return io.NopCloser(io.NewSectionReader(body.File, 0, body.size)), nil
		}
		if err = a.BuildRequestHeader(c, req, info); err != nil {
			return nil, err
		}
		return channel.DoRequest(c, req, info)
	}
	return channel.DoTaskApiRequest(a, c, info, requestBody)
}

// DoResponse handles upstream response, returns taskID etc.
func (a *TaskAdaptor) DoResponse(c *gin.Context, resp *http.Response, info *relaycommon.RelayInfo) (taskID string, taskData []byte, taskErr *dto.TaskError) {
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		taskErr = service.TaskErrorWrapper(err, "read_response_body_failed", http.StatusInternalServerError)
		return
	}
	_ = resp.Body.Close()

	// Try to decode base64 if response is a JSON string
	decodedBody := taskcommon.DecodeBase64Response(responseBody)

	// Parse Sora response
	var dResp responseTask
	if err := common.Unmarshal(decodedBody, &dResp); err != nil {
		taskErr = service.TaskErrorWrapper(errors.Wrapf(err, "body: %s", responseBody), "unmarshal_response_body_failed", http.StatusInternalServerError)
		return
	}

	upstreamID := dResp.ID
	if upstreamID == "" {
		upstreamID = dResp.TaskID
	}
	if upstreamID == "" {
		taskErr = service.TaskErrorWrapper(fmt.Errorf("task_id is empty"), "invalid_response", http.StatusInternalServerError)
		return
	}

	// 使用公开 task_xxxx ID 返回给客户端
	dResp.ID = info.PublicTaskID
	dResp.TaskID = info.PublicTaskID

	c.JSON(http.StatusOK, dResp)
	return upstreamID, responseBody, nil
}

// FetchTask fetch task status
func (a *TaskAdaptor) FetchTask(baseUrl, key string, body map[string]any, proxy string) (*http.Response, error) {
	taskID, ok := body["task_id"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid task_id")
	}

	uri := fmt.Sprintf("%s/v1/videos/%s", baseUrl, taskID)

	req, err := http.NewRequest(http.MethodGet, uri, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+key)

	client, err := service.GetHttpClientWithProxy(proxy)
	if err != nil {
		return nil, fmt.Errorf("new proxy http client failed: %w", err)
	}
	return client.Do(req)
}

func (a *TaskAdaptor) GetModelList() []string {
	return ModelList
}

func (a *TaskAdaptor) GetChannelName() string {
	return ChannelName
}

// buildH3Form translates the playground's JSON video parameters to the self-hosted H3 form API.
func buildH3Form(c *gin.Context, fields map[string]interface{}) (io.Reader, error) {
	if _, exists := fields["input_references"]; exists {
		return buildH3ReferenceForm(c, fields)
	}
	// H3 expects JSON-encoded image_reference objects in the multipart form;
	// the playground's generic image fields are not recognized by the upstream.
	// Preserve an explicitly supplied native field (including JSON strings).
	if _, exists := fields["image_reference"]; !exists {
		var images struct {
			Images        []string `json:"images"`
			FirstFrameURL string   `json:"first_frame_url"`
			LastFrameURL  string   `json:"last_frame_url"`
			Metadata      struct {
				FirstFrameURL string `json:"first_frame_url"`
				LastFrameURL  string `json:"last_frame_url"`
			} `json:"metadata"`
		}
		data, err := common.Marshal(fields)
		if err != nil {
			return nil, err
		}
		if err := common.Unmarshal(data, &images); err != nil {
			return nil, errors.Wrap(err, "invalid H3 image parameters")
		}
		first, last := strings.TrimSpace(images.FirstFrameURL), strings.TrimSpace(images.LastFrameURL)
		if first == "" {
			first = strings.TrimSpace(images.Metadata.FirstFrameURL)
		}
		if last == "" {
			last = strings.TrimSpace(images.Metadata.LastFrameURL)
		}
		urls := images.Images
		// Frame mode and reference-image mode are mutually exclusive in the
		// playground. Preserve first/last ordering when frame URLs are supplied.
		if first != "" || last != "" {
			urls = []string{first, last}
		}
		references := make([]map[string]string, 0, len(urls))
		for _, raw := range urls {
			if url := strings.TrimSpace(raw); url != "" {
				references = append(references, map[string]string{"image_url": url})
			}
		}
		if len(references) > 0 {
			fields["image_reference"] = references
		}
	}
	if _, exists := fields["seconds"]; !exists {
		if duration, ok := fields["duration"]; ok {
			fields["seconds"] = duration
		}
	}
	if _, exists := fields["aspect_ratio"]; !exists {
		if metadata, ok := fields["metadata"].(map[string]interface{}); ok {
			if ratio, ok := metadata["ratio"].(string); ok && ratio != "" && ratio != "adaptive" && ratio != "auto" {
				fields["aspect_ratio"] = ratio
			}
		}
	}
	if _, exists := fields["aspect_ratio"]; !exists {
		var width, height int
		if size, ok := fields["size"].(string); ok {
			if _, err := fmt.Sscanf(size, "%dx%d", &width, &height); err == nil && width > 0 && height > 0 {
				a, b := width, height
				for b != 0 {
					a, b = b, a%b
				}
				fields["aspect_ratio"] = fmt.Sprintf("%d:%d", width/a, height/a)
			}
		}
	}
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	for key, value := range fields {
		if value == nil {
			continue
		}
		var text string
		if str, ok := value.(string); ok {
			text = str
		} else {
			encoded, err := common.Marshal(value)
			if err != nil {
				return nil, err
			}
			text = string(encoded)
		}
		if err := writer.WriteField(key, text); err != nil {
			return nil, err
		}
	}
	if err := writer.Close(); err != nil {
		return nil, err
	}
	c.Request.Header.Set("Content-Type", writer.FormDataContentType())
	return bytes.NewReader(body.Bytes()), nil
}

func (a *TaskAdaptor) ParseTaskResult(respBody []byte) (*relaycommon.TaskInfo, error) {
	resTask := responseTask{}
	if err := common.Unmarshal(respBody, &resTask); err != nil {
		return nil, errors.Wrap(err, "unmarshal task result failed")
	}

	taskResult := relaycommon.TaskInfo{
		Code: 0,
	}

	switch resTask.Status {
	case "queued", "pending":
		taskResult.Status = model.TaskStatusQueued
	case "processing", "in_progress":
		taskResult.Status = model.TaskStatusInProgress
	case "completed":
		taskResult.Status = model.TaskStatusSuccess
		// Url intentionally left empty — the caller constructs the proxy URL using the public task ID
	case "failed", "cancelled":
		taskResult.Status = model.TaskStatusFailure
		if resTask.Error != nil {
			taskResult.Reason = resTask.Error.Message
		} else {
			taskResult.Reason = "task failed"
		}
	default:
	}
	if resTask.Progress > 0 && resTask.Progress < 100 {
		taskResult.Progress = fmt.Sprintf("%d%%", resTask.Progress)
	}

	return &taskResult, nil
}

func (a *TaskAdaptor) ConvertToOpenAIVideo(task *model.Task) ([]byte, error) {
	data := task.Data
	var err error
	if data, err = sjson.SetBytes(data, "id", task.TaskID); err != nil {
		return nil, errors.Wrap(err, "set id failed")
	}
	// 状态以 task.Status 为准，避免 task.Data 过期导致下游状态不一致
	if status := task.Status.ToVideoStatus(); status != "" {
		if data, err = sjson.SetBytes(data, "status", status); err != nil {
			return nil, errors.Wrap(err, "set status failed")
		}
	}
	return data, nil
}
