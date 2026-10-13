/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */
package controller

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// A single JSON option makes settings changes atomic and retains historical
// profiles. Credential fields are write-only; blank means preserve, not a mask.
type s3StorageSettings struct {
	Enabled                       bool    `json:"enabled"`
	Endpoint                      string  `json:"endpoint"`
	Bucket                        string  `json:"bucket"`
	Region                        string  `json:"region"`
	PathStyle                     bool    `json:"path_style"`
	AccessKey                     string  `json:"access_key,omitempty"`
	SecretKey                     string  `json:"secret_key,omitempty"`
	SessionToken                  *string `json:"session_token,omitempty"`
	CredentialsConfigured         bool    `json:"credentials_configured"`
	PublicBaseURL                 string  `json:"public_base_url"`
	ObjectPrefix                  string  `json:"object_prefix"`
	MaxFileSizeMB                 int     `json:"max_file_size_mb"`
	LinkTTLHours                  int     `json:"link_ttl_hours"`
	MaterialMaxFileSizeMB         *int    `json:"material_max_file_size_mb,omitempty"`
	PlaygroundRetentionHours      *int    `json:"playground_retention_hours,omitempty"`
	MaterialPreviewRetentionHours *int    `json:"material_preview_retention_hours,omitempty"`
}

var s3StorageSettingsMu sync.Mutex

func GetS3StorageSettings(c *gin.Context) {
	cfg, err := operation_setting.GetS3Config()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	p, _ := cfg.Profile(cfg.ActiveProfileID)
	region := p.Region
	if region == "" {
		region = "us-east-1"
	}
	pathStyle := p.PathStyle
	if p.ID == "" {
		pathStyle = true
	}
	common.ApiSuccess(c, s3StorageSettings{Enabled: operation_setting.GetOssSetting().Enabled && operation_setting.GetOssSetting().StorageType == operation_setting.StorageTypeS3, Endpoint: p.Endpoint, Bucket: p.Bucket, Region: region, PathStyle: pathStyle, CredentialsConfigured: p.AccessKey != "" && p.SecretKey != "", PublicBaseURL: cfg.PublicBaseURL, ObjectPrefix: cfg.ObjectPrefix, MaxFileSizeMB: cfg.MaxFileSizeMB, LinkTTLHours: cfg.LinkTTLHours, MaterialMaxFileSizeMB: &cfg.MaterialMaxFileSizeMB, PlaygroundRetentionHours: &cfg.PlaygroundRetentionHours, MaterialPreviewRetentionHours: &cfg.MaterialPreviewRetentionHours})
}

func prepareS3StorageSettings(input s3StorageSettings, cfg operation_setting.S3Config) (operation_setting.S3Config, error) {
	if input.MaxFileSizeMB < 1 || input.MaxFileSizeMB > 1024 || input.LinkTTLHours < 1 || input.LinkTTLHours > 720 {
		return cfg, fmt.Errorf("大小限制须为 1–1024 MB，链接有效期须为 1–720 小时")
	}
	cfg.ApplyPolicyDefaults()
	for _, policy := range []struct {
		input   *int
		target  *int
		maximum int
		name    string
	}{
		{input.MaterialMaxFileSizeMB, &cfg.MaterialMaxFileSizeMB, 1024, "素材库单文件上限"},
		{input.PlaygroundRetentionHours, &cfg.PlaygroundRetentionHours, 8760, "操练场文件保留时间"},
		{input.MaterialPreviewRetentionHours, &cfg.MaterialPreviewRetentionHours, 8760, "素材预览保留时间"},
	} {
		if policy.input != nil {
			if *policy.input < 1 || *policy.input > policy.maximum {
				return cfg, fmt.Errorf("%s须为 1–%d", policy.name, policy.maximum)
			}
			*policy.target = *policy.input
		}
	}
	prefix, err := service.NormalizeLocalUploadPrefix(input.ObjectPrefix)
	if err != nil || prefix == "" {
		return cfg, fmt.Errorf("请填写有效的项目对象前缀")
	}
	base := strings.TrimRight(strings.TrimSpace(input.PublicBaseURL), "/")
	u, err := url.Parse(base)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Hostname() == "" || u.User != nil || u.Path != "" || u.RawQuery != "" || u.Fragment != "" {
		return cfg, fmt.Errorf("平台外部地址须为含协议的根地址，例如 https://gateway.example.com")
	}
	p := operation_setting.S3Profile{Endpoint: strings.TrimRight(strings.TrimSpace(input.Endpoint), "/"), Bucket: strings.TrimSpace(input.Bucket), Region: strings.TrimSpace(input.Region), PathStyle: input.PathStyle}
	index := -1
	for i, old := range cfg.Profiles {
		if old.Endpoint == p.Endpoint && old.Bucket == p.Bucket && old.Region == p.Region && old.PathStyle == p.PathStyle {
			p = old
			index = i
			break
		}
	}
	if input.AccessKey != "" {
		p.AccessKey = strings.TrimSpace(input.AccessKey)
	}
	if input.SecretKey != "" {
		p.SecretKey = input.SecretKey
	}
	if input.SessionToken != nil {
		p.SessionToken = *input.SessionToken
	}
	if err = operation_setting.ValidateS3Profile(p); err != nil {
		return cfg, err
	}
	if p.ID == "" {
		p.ID = uuid.NewString()
		secret := make([]byte, 32)
		if _, err = rand.Read(secret); err != nil {
			return cfg, err
		}
		p.LinkSecret = hex.EncodeToString(secret)
	}
	if index < 0 {
		cfg.Profiles = append(cfg.Profiles, p)
	} else {
		cfg.Profiles[index] = p
	}
	// Legacy enabled is retained for rollback compatibility; global selection owns routing.
	cfg.ActiveProfileID = p.ID
	cfg.PublicBaseURL = base
	cfg.ObjectPrefix = prefix
	cfg.MaxFileSizeMB = input.MaxFileSizeMB
	cfg.LinkTTLHours = input.LinkTTLHours
	return cfg, nil
}

func UpdateS3StorageSettings(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 32*1024)
	var input s3StorageSettings
	if err := common.DecodeJson(c.Request.Body, &input); err != nil {
		common.ApiErrorMsg(c, "无效的存储配置")
		return
	}
	s3StorageSettingsMu.Lock()
	defer s3StorageSettingsMu.Unlock()
	// Read the persisted option to avoid overwriting a change made by another node.
	var old model.Option
	err := model.DB.Where(&model.Option{Key: operation_setting.S3OptionKey}).First(&old).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		common.ApiError(c, err)
		return
	}
	existed := err == nil
	cfg, _ := operation_setting.GetS3Config()
	if existed {
		if err = common.UnmarshalJsonStr(old.Value, &cfg); err != nil {
			common.ApiErrorMsg(c, "现有存储配置损坏，请先恢复配置")
			return
		}
	}
	cfg, err = prepareS3StorageSettings(input, cfg)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	raw, err := common.Marshal(cfg)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	var result *gorm.DB
	if existed {
		result = model.DB.Model(&model.Option{}).Where(&model.Option{Key: old.Key}).Where(clause.Eq{Column: "value", Value: old.Value}).Update("value", string(raw))
	} else {
		result = model.DB.Clauses(clause.OnConflict{DoNothing: true}).Create(&model.Option{Key: operation_setting.S3OptionKey, Value: string(raw)})
	}
	if result.Error != nil {
		common.ApiError(c, result.Error)
		return
	}
	if result.RowsAffected == 0 && old.Value != string(raw) {
		c.JSON(http.StatusConflict, gin.H{"success": false, "message": "配置已被其他管理员修改，请刷新后重试"})
		return
	}
	common.OptionMapRWMutex.Lock()
	if common.OptionMap == nil {
		common.OptionMap = make(map[string]string)
	}
	common.OptionMap[operation_setting.S3OptionKey] = string(raw)
	common.OptionMapRWMutex.Unlock()
	GetS3StorageSettings(c)
}

func TestS3Storage(c *gin.Context) {
	cfg, err := operation_setting.GetS3Config()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	p, err := cfg.Profile(cfg.ActiveProfileID)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if err = service.CheckS3(c.Request.Context(), p); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"bucket_accessible": true})
}

// Refresh is owner-only. Signed read URLs are bearer capabilities for browsers
// and upstream models that cannot send the dashboard's New-Api-User header.
func RefreshS3UploadURL(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		c.Status(http.StatusNotFound)
		return
	}
	rec, err := model.GetUploadObjectByID(id)
	if err != nil || rec.UserID != c.GetInt("id") || rec.StorageType != operation_setting.StorageTypeS3 {
		c.Status(http.StatusNotFound)
		return
	}
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 4096)
	var request struct {
		URL string `json:"url"`
	}
	if err := common.DecodeJson(c.Request.Body, &request); err != nil {
		c.Status(http.StatusBadRequest)
		return
	}
	original, err := url.Parse(request.URL)
	if err != nil || original.Path != fmt.Sprintf("/api/storage/files/%d/content", rec.ID) {
		c.Status(http.StatusNotFound)
		return
	}
	cfg, err := operation_setting.GetS3Config()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	profile, err := cfg.Profile(rec.StorageBase)
	// Verify the original capability even when it is expired. Arbitrary external
	// URLs with a similar path must never be rewritten into a user's local file.
	if err != nil || !service.VerifyS3FileSignature(profile, rec, original.Query().Get("expires"), original.Query().Get("signature"), time.Unix(0, 0)) {
		c.Status(http.StatusNotFound)
		return
	}
	value, err := service.RefreshS3FileURL(cfg, rec)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"file_id": rec.ID, "url": value, "url_expires_at": 0})
}

func StoredS3FileContent(c *gin.Context) {
	c.Header("Cache-Control", "private, no-store")
	c.Header("Referrer-Policy", "no-referrer")
	c.Header("X-Content-Type-Options", "nosniff")
	c.Header("Content-Security-Policy", "default-src 'none'; sandbox")
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		c.Status(http.StatusForbidden)
		return
	}
	rec, err := model.GetUploadObjectByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.Status(http.StatusForbidden)
		} else {
			c.Status(http.StatusServiceUnavailable)
		}
		return
	}
	cfg, err := operation_setting.GetS3Config()
	if err != nil {
		c.Status(http.StatusServiceUnavailable)
		return
	}
	p, err := cfg.Profile(rec.StorageBase)
	if err != nil || rec.StorageType != operation_setting.StorageTypeS3 || !service.VerifyS3FileSignature(p, rec, c.Query("expires"), c.Query("signature"), time.Now()) {
		c.Status(http.StatusForbidden)
		return
	}
	if rec.ExpiresAt > 0 && rec.ExpiresAt <= time.Now().Unix() {
		c.Status(http.StatusGone)
		return
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Minute)
	defer cancel()
	headers := http.Header{}
	if c.Request.Method == http.MethodGet {
		if rangeValue := c.GetHeader("Range"); rangeValue != "" {
			if !strings.HasPrefix(rangeValue, "bytes=") || strings.Contains(rangeValue, ",") {
				c.Header("Content-Range", fmt.Sprintf("bytes */%d", rec.Size))
				c.Status(http.StatusRequestedRangeNotSatisfiable)
				return
			}
			headers.Set("Range", rangeValue)
			if condition := c.GetHeader("If-Range"); condition != "" {
				head, e := service.S3Request(ctx, p, http.MethodHead, rec.ObjectKey, nil, 0, "", nil)
				if e != nil {
					c.Status(http.StatusBadGateway)
					return
				}
				head.Body.Close()
				if head.StatusCode != http.StatusOK || (condition != head.Header.Get("ETag") && condition != head.Header.Get("Last-Modified")) {
					headers.Del("Range")
				}
			}
		}
	}
	resp, err := service.S3Request(ctx, p, c.Request.Method, rec.ObjectKey, nil, 0, "", headers)
	if err != nil {
		c.Status(http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK, http.StatusPartialContent:
		for _, h := range []string{"Content-Length", "Content-Range", "ETag", "Last-Modified"} {
			if v := resp.Header.Get(h); v != "" {
				c.Header(h, v)
			}
		}
		c.Header("Accept-Ranges", "bytes")
		c.Header("Content-Type", rec.MimeType)
		c.Header("Content-Disposition", mime.FormatMediaType("inline", map[string]string{"filename": rec.OriginalName}))
		c.Status(resp.StatusCode)
		if c.Request.Method != http.MethodHead {
			if _, err = io.Copy(c.Writer, resp.Body); err != nil {
				_ = c.Error(err)
			}
		}
	case http.StatusRequestedRangeNotSatisfiable:
		c.Header("Content-Range", fmt.Sprintf("bytes */%d", rec.Size))
		c.Status(http.StatusRequestedRangeNotSatisfiable)
	case http.StatusNotFound:
		c.Status(http.StatusNotFound)
	default:
		c.Status(http.StatusBadGateway) // Never expose XML, credentials or internal endpoint redirects.
	}
}
