/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */
package sora

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"mime"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting/system_setting"
	"github.com/gin-gonic/gin"
)

type h3ReferenceRequest struct {
	Model       string          `json:"model"`
	Prompt      string          `json:"prompt"`
	Seconds     *string         `json:"seconds,omitempty"`
	Width       *int            `json:"width,omitempty"`
	Height      *int            `json:"height,omitempty"`
	Size        string          `json:"size"`
	AspectRatio string          `json:"aspect_ratio"`
	Steps       *int            `json:"num_inference_steps,omitempty"`
	FlowShift   *float64        `json:"flow_shift,omitempty"`
	References  []string        `json:"input_references"`
	Extra       json.RawMessage `json:"extra_params"`
}

type h3Extra struct {
	Task         string    `json:"task"`
	FrameIndices []int     `json:"frame_indices,omitempty"`
	StartTimes   []float64 `json:"start_time_seconds,omitempty"`
}

type h3FormBody struct {
	*os.File
	size                int64
	originalContentType string
}

func (b *h3FormBody) cleanup() {
	_ = b.File.Close()
	_ = os.Remove(b.File.Name())
}

var h3RatioPattern = regexp.MustCompile(`^[1-9][0-9]*:[1-9][0-9]*$`)

func parseH3ReferenceRequest(fields map[string]interface{}) (*h3ReferenceRequest, string, error) {
	data, err := common.Marshal(fields)
	if err != nil {
		return nil, "", err
	}
	var req h3ReferenceRequest
	if err = common.Unmarshal(data, &req); err != nil {
		return nil, "", fmt.Errorf("invalid H3 request fields")
	}
	if len(req.Extra) > 0 && req.Extra[0] == '"' {
		var value string
		if err = common.Unmarshal(req.Extra, &value); err != nil {
			return nil, "", fmt.Errorf("invalid H3 extra_params")
		}
		req.Extra = json.RawMessage(value)
	}
	var extra h3Extra
	if err = common.Unmarshal(req.Extra, &extra); err != nil {
		return nil, "", fmt.Errorf("invalid H3 extra_params")
	}
	seconds := 0
	if req.Seconds != nil {
		seconds, _ = strconv.Atoi(*req.Seconds)
	}
	if strings.TrimSpace(req.Prompt) == "" || req.Model == "" || seconds <= 0 || req.Width == nil || *req.Width <= 0 || req.Height == nil || *req.Height <= 0 || req.Steps == nil || *req.Steps <= 0 || req.FlowShift == nil || math.IsNaN(*req.FlowShift) || math.IsInf(*req.FlowShift, 0) {
		return nil, "", fmt.Errorf("H3 requires prompt, model, positive seconds/width/height/num_inference_steps and finite flow_shift")
	}
	if req.Size != fmt.Sprintf("%dx%d", *req.Width, *req.Height) || !h3RatioPattern.MatchString(req.AspectRatio) {
		return nil, "", fmt.Errorf("invalid H3 size or aspect_ratio")
	}
	mediaType, err := validateH3Media(extra, len(req.References))
	if err != nil {
		return nil, "", err
	}
	for _, value := range req.References {
		u, err := url.Parse(value)
		if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" || u.User != nil {
			return nil, "", fmt.Errorf("H3 references require HTTP(S) URLs; asset:// is unsupported")
		}
	}
	return &req, mediaType, nil
}

func validateH3Media(extra h3Extra, count int) (string, error) {
	mediaType := "image/"
	switch extra.Task {
	case "t2va":
		if count != 0 || len(extra.FrameIndices) != 0 || extra.StartTimes != nil {
			return "", fmt.Errorf("H3 t2va does not accept references")
		}
	case "fl2va":
		if count < 1 || count > 2 || len(extra.FrameIndices) != count || extra.FrameIndices[0] != 0 || (len(extra.FrameIndices) == 2 && extra.FrameIndices[1] != -1) || extra.StartTimes != nil {
			return "", fmt.Errorf("H3 fl2va requires first/last frames with frame_indices [0] or [0,-1]")
		}
	case "ref2va":
		if len(extra.FrameIndices) != 0 {
			return "", fmt.Errorf("H3 ref2va does not accept frame_indices")
		}
		if extra.StartTimes != nil {
			mediaType = "video/"
			if count != 1 || len(extra.StartTimes) != 1 || extra.StartTimes[0] < 0 || math.IsNaN(extra.StartTimes[0]) || math.IsInf(extra.StartTimes[0], 0) {
				return "", fmt.Errorf("H3 video reference requires one video and a nonnegative start_time_seconds")
			}
		} else if count < 1 || count > 9 {
			return "", fmt.Errorf("H3 image references must contain 1 to 9 images")
		}
	default:
		return "", fmt.Errorf("unsupported H3 task")
	}
	return mediaType, nil
}

// Normalize only the internal task request before pricing; the cached upstream body
// is unchanged. Native multipart files need internal markers, not fake public URLs.
func normalizeH3BillingRequest(c *gin.Context, info *relaycommon.RelayInfo) error {
	var extra h3Extra
	var references []string
	var mediaType string
	contentType := c.GetHeader("Content-Type")
	if strings.HasPrefix(contentType, "application/json") {
		var fields map[string]interface{}
		if err := common.UnmarshalBodyReusable(c, &fields); err != nil {
			return err
		}
		_, hasReferences := fields["input_references"]
		_, hasExtra := fields["extra_params"]
		if !hasReferences && !hasExtra {
			return nil // Preserve the legacy H3 JSON contract.
		}
		req, kind, err := parseH3ReferenceRequest(fields)
		if err != nil {
			return err
		}
		if err = common.Unmarshal(req.Extra, &extra); err != nil {
			return err
		}
		references, mediaType = req.References, kind
	} else if strings.HasPrefix(contentType, "multipart/form-data") {
		form, err := common.ParseMultipartFormReusable(c)
		if err != nil {
			return err
		}
		defer form.RemoveAll()
		values := form.Value["extra_params"]
		files := form.File["input_references"]
		if len(values) == 0 && len(files) == 0 && len(form.Value["input_references"]) == 0 {
			return nil
		}
		if len(values) != 1 || common.UnmarshalJsonStr(values[0], &extra) != nil {
			return fmt.Errorf("invalid H3 extra_params")
		}
		if len(form.Value["input_references"]) > 0 {
			return fmt.Errorf("H3 multipart input_references must contain files")
		}
		mediaType, err = validateH3Media(extra, len(files))
		if err != nil {
			return err
		}
		for _, file := range files {
			kind, _, _ := mime.ParseMediaType(file.Header.Get("Content-Type"))
			if kind != "" && kind != "application/octet-stream" && !strings.HasPrefix(kind, mediaType) {
				return fmt.Errorf("H3 reference file type conflicts with extra_params")
			}
			references = append(references, "h3-upload://reference")
		}
	} else {
		return nil
	}

	req, err := relaycommon.GetTaskRequest(c)
	if err != nil {
		return err
	}
	mode, action := relaycommon.VideoBillingModeTextToVideo, constant.TaskActionTextGenerate
	if extra.Task != "t2va" {
		mode, action = relaycommon.VideoBillingModeImageToVideo, constant.TaskActionGenerate
		if mediaType == "video/" {
			mode, action = relaycommon.VideoBillingModeVideoToVideo, constant.TaskActionReferenceGenerate
		}
	}
	declaredMode := relaycommon.DetectVideoBillingMode(&req)
	if declaredMode != relaycommon.VideoBillingModeTextToVideo && declaredMode != mode {
		return fmt.Errorf("H3 auxiliary media fields conflict with extra_params")
	}
	// Discard optional client billing hints; actual H3 references decide the lane.
	req.Image, req.InputReference, req.FirstFrameURL, req.LastFrameURL = "", "", "", ""
	req.Images = nil
	if req.Metadata == nil {
		req.Metadata = make(map[string]interface{})
	}
	for _, key := range []string{"video_urls", "video_url", "first_frame_url", "last_frame_url"} {
		delete(req.Metadata, key)
	}
	if mode == relaycommon.VideoBillingModeVideoToVideo {
		req.Metadata["video_urls"] = references
	} else if mode == relaycommon.VideoBillingModeImageToVideo {
		// InputReference is used for billing but is not submitted as an image URL
		// to moderation. Actual JSON image URLs remain available for moderation.
		req.InputReference = "h3-upload://image"
		if strings.HasPrefix(contentType, "application/json") {
			req.Images = references
		}
	}
	if relaycommon.DetectVideoBillingMode(&req) != mode {
		return fmt.Errorf("H3 reference media type conflicts with extra_params")
	}
	relaycommon.StoreTaskRequest(c, info, action, req)
	return nil
}

// JSON input_references is the playground URL contract; upstream receives file parts.
func buildH3ReferenceForm(c *gin.Context, fields map[string]interface{}) (io.Reader, error) {
	req, mediaType, err := parseH3ReferenceRequest(fields)
	if err != nil {
		return nil, err
	}
	file, err := os.CreateTemp("", "token-factory-h3-*.multipart")
	if err != nil {
		return nil, fmt.Errorf("cannot prepare H3 upload")
	}
	body := &h3FormBody{File: file, originalContentType: c.Request.Header.Get("Content-Type")}
	success := false
	defer func() {
		if !success {
			body.cleanup()
		}
	}()
	writer := multipart.NewWriter(file)
	values := map[string]string{
		"model": req.Model, "prompt": req.Prompt, "seconds": *req.Seconds,
		"size": req.Size, "width": strconv.Itoa(*req.Width), "height": strconv.Itoa(*req.Height),
		"aspect_ratio": req.AspectRatio, "num_inference_steps": strconv.Itoa(*req.Steps),
		"flow_shift": strconv.FormatFloat(*req.FlowShift, 'f', -1, 64), "extra_params": string(req.Extra),
	}
	for key, value := range values {
		if err = writer.WriteField(key, value); err != nil {
			return nil, err
		}
	}
	for index, value := range req.References {
		if err = writeH3Reference(c.Request.Context(), writer, value, mediaType, index); err != nil {
			return nil, fmt.Errorf("H3 reference %d: %w", index+1, err)
		}
	}
	if err = writer.Close(); err != nil {
		return nil, err
	}
	body.size, err = file.Seek(0, io.SeekCurrent)
	if err != nil {
		return nil, err
	}
	if _, err = file.Seek(0, io.SeekStart); err != nil {
		return nil, err
	}
	c.Request.Header.Set("Content-Type", writer.FormDataContentType())
	success = true
	return body, nil
}

func writeH3Reference(ctx context.Context, writer *multipart.Writer, value, expectedType string, index int) error {
	fetch := system_setting.GetFetchSetting()
	if err := common.ValidateURLWithFetchSetting(value, fetch.EnableSSRFProtection, fetch.AllowPrivateIp, fetch.DomainFilterMode, fetch.IpFilterMode, fetch.DomainList, fetch.IpList, fetch.AllowedPorts, fetch.ApplyIPFilterForDomain); err != nil {
		return fmt.Errorf("media URL blocked by fetch policy")
	}
	ctx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, value, nil)
	if err != nil {
		return fmt.Errorf("invalid media URL")
	}
	// This client checks redirects too. No channel key or browser cookies are forwarded.
	resp, err := service.GetOssHttpClient().Do(req)
	if err != nil {
		return fmt.Errorf("media download failed or was blocked")
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("media download returned HTTP %d", resp.StatusCode)
	}
	limit := int64(constant.MaxFileDownloadMB) * 1024 * 1024
	if limit <= 0 {
		return fmt.Errorf("media download size limit is not configured")
	}
	if resp.ContentLength > limit {
		return fmt.Errorf("media exceeds download size limit")
	}
	reader := bufio.NewReader(resp.Body)
	head, err := reader.Peek(512)
	if err != nil && err != io.EOF {
		return fmt.Errorf("cannot read media")
	}
	contentType, _, _ := mime.ParseMediaType(resp.Header.Get("Content-Type"))
	if contentType == "" || contentType == "application/octet-stream" {
		contentType = http.DetectContentType(head)
	}
	if !strings.HasPrefix(contentType, expectedType) {
		return fmt.Errorf("expected %s media, received %s", strings.TrimSuffix(expectedType, "/"), contentType)
	}
	extension := ""
	switch contentType {
	case "video/mp4":
		extension = ".mp4"
	case "video/quicktime":
		extension = ".mov"
	default:
		extensions, _ := mime.ExtensionsByType(contentType)
		if len(extensions) > 0 {
			extension = extensions[0]
		}
	}
	header := make(textproto.MIMEHeader)
	header.Set("Content-Type", contentType)
	header.Set("Content-Disposition", mime.FormatMediaType("form-data", map[string]string{"name": "input_references", "filename": fmt.Sprintf("reference-%d%s", index+1, extension)}))
	part, err := writer.CreatePart(header)
	if err != nil {
		return err
	}
	n, err := io.Copy(part, io.LimitReader(reader, limit+1))
	if err != nil {
		return fmt.Errorf("cannot read media")
	}
	if n == 0 || n > limit {
		return fmt.Errorf("media is empty or exceeds download size limit")
	}
	return nil
}
