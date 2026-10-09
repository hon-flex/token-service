/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */
package operation_setting

import (
	"fmt"
	"net"
	"net/url"
	"strings"

	"github.com/QuantumNous/new-api/common"
)

// This option is deliberately excluded from the generic options API: it contains
// credentials and signing keys. Only the dedicated RootAuth API may edit it.
const S3OptionKey = "PlaygroundS3Config" // Historical key retained for existing installations.
const StorageTypeS3 = "s3"

type S3Profile struct {
	ID           string `json:"id"`
	Endpoint     string `json:"endpoint"`
	Bucket       string `json:"bucket"`
	Region       string `json:"region"`
	PathStyle    bool   `json:"path_style"`
	AccessKey    string `json:"access_key"`
	SecretKey    string `json:"secret_key"`
	SessionToken string `json:"session_token,omitempty"`
	LinkSecret   string `json:"link_secret"`
}

type S3Config struct {
	// Enabled is legacy persisted state only. OssSetting.Enabled/StorageType control all new uploads.
	Enabled                       bool        `json:"enabled"`
	ActiveProfileID               string      `json:"active_profile_id"`
	Profiles                      []S3Profile `json:"profiles"`
	PublicBaseURL                 string      `json:"public_base_url"`
	ObjectPrefix                  string      `json:"object_prefix"`
	MaxFileSizeMB                 int         `json:"max_file_size_mb"`
	LinkTTLHours                  int         `json:"link_ttl_hours"`
	MaterialMaxFileSizeMB         int         `json:"material_max_file_size_mb"`
	PlaygroundRetentionHours      int         `json:"playground_retention_hours"`
	MaterialPreviewRetentionHours int         `json:"material_preview_retention_hours"`
}

// Independent S3 defaults also support configurations saved before these fields existed.
func (c *S3Config) ApplyPolicyDefaults() {
	if c.MaterialMaxFileSizeMB == 0 {
		c.MaterialMaxFileSizeMB = 10
	}
	if c.PlaygroundRetentionHours == 0 {
		c.PlaygroundRetentionHours = 24
	}
	if c.MaterialPreviewRetentionHours == 0 {
		c.MaterialPreviewRetentionHours = 168
	}
}

func (c S3Config) MaterialUploadLimitMB() int {
	c.ApplyPolicyDefaults()
	return min(c.MaxFileSizeMB, c.MaterialMaxFileSizeMB)
}

// GetMaterialUploadLimitMB is shared by upload validation and the material UI.
func GetMaterialUploadLimitMB() (int, error) {
	if GetOssSetting().StorageType == StorageTypeS3 {
		cfg, err := GetS3Config()
		if err != nil {
			return 0, err
		}
		return cfg.MaterialUploadLimitMB(), nil
	}
	limit := GetSeedanceSetting().MaxImageSizeMB
	if limit <= 0 {
		limit = 10
	}
	return limit, nil
}

func GetS3Config() (S3Config, error) {
	cfg := S3Config{ObjectPrefix: "token-factory/uploads", MaxFileSizeMB: 512, LinkTTLHours: 168}
	common.OptionMapRWMutex.RLock()
	raw := common.OptionMap[S3OptionKey]
	common.OptionMapRWMutex.RUnlock()
	if raw != "" {
		if err := common.UnmarshalJsonStr(raw, &cfg); err != nil {
			return cfg, fmt.Errorf("S3 配置格式错误")
		}
	}
	cfg.ApplyPolicyDefaults()
	return cfg, nil
}

func (c S3Config) Profile(id string) (S3Profile, error) {
	for _, p := range c.Profiles {
		if p.ID == id && id != "" {
			return p, nil
		}
	}
	return S3Profile{}, fmt.Errorf("S3 存储配置不存在")
}

func ValidateS3Profile(p S3Profile) error {
	u, err := url.Parse(p.Endpoint)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Hostname() == "" || u.User != nil || u.RawQuery != "" || u.Fragment != "" || (u.Path != "" && u.Path != "/") {
		return fmt.Errorf("S3 Endpoint 必须是含协议的 API 地址，不含路径或查询参数")
	}
	if len(p.Bucket) < 3 || len(p.Bucket) > 63 || strings.Trim(p.Bucket, "abcdefghijklmnopqrstuvwxyz0123456789.-") != "" || strings.Contains(p.Bucket, "..") || strings.Contains(p.Bucket, ".-") || strings.Contains(p.Bucket, "-.") || strings.ContainsAny(p.Bucket[:1]+p.Bucket[len(p.Bucket)-1:], ".-") || net.ParseIP(p.Bucket) != nil {
		return fmt.Errorf("S3 Bucket 名称无效")
	}
	if p.Region == "" || p.AccessKey == "" || p.SecretKey == "" {
		return fmt.Errorf("请填写 Region、Access Key 和 Secret Key")
	}
	if !p.PathStyle && net.ParseIP(u.Hostname()) != nil {
		return fmt.Errorf("IP Endpoint 请启用 Path-style")
	}
	return nil
}
