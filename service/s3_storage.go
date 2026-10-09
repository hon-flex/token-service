/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */
package service

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"net"
	"net/http"
	"net/url"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"gorm.io/gorm"
)

// Dedicated transport: internal S3 traffic must not inherit model proxy settings
// or forward signed requests across redirects. Each operation has a deadline.
var s3HTTP = &http.Client{
	Transport:     &http.Transport{DialContext: (&net.Dialer{Timeout: 10 * time.Second, KeepAlive: 30 * time.Second}).DialContext, TLSHandshakeTimeout: 10 * time.Second, ResponseHeaderTimeout: 30 * time.Second, IdleConnTimeout: 90 * time.Second, MaxIdleConns: 32, MaxIdleConnsPerHost: 8},
	CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse },
}

func S3Request(ctx context.Context, p operation_setting.S3Profile, method, key string, body io.Reader, size int64, payloadHash string, headers http.Header) (*http.Response, error) {
	if err := operation_setting.ValidateS3Profile(p); err != nil {
		return nil, err
	}
	u, _ := url.Parse(p.Endpoint)
	if p.PathStyle {
		u.Path = "/" + p.Bucket
	} else {
		u.Host = p.Bucket + "." + u.Host
		u.Path = ""
	}
	if key != "" {
		u.Path += "/" + key
	}
	req, err := http.NewRequestWithContext(ctx, method, u.String(), body)
	if err != nil {
		return nil, err
	}
	req.ContentLength = size
	req.Header = headers.Clone()
	if req.Header == nil {
		req.Header = make(http.Header)
	}
	if payloadHash == "" {
		sum := sha256.Sum256(nil)
		payloadHash = hex.EncodeToString(sum[:])
	}
	req.Header.Set("X-Amz-Content-Sha256", payloadHash)
	err = v4.NewSigner(func(o *v4.SignerOptions) { o.DisableURIPathEscaping = true }).SignHTTP(ctx, aws.Credentials{AccessKeyID: p.AccessKey, SecretAccessKey: p.SecretKey, SessionToken: p.SessionToken}, req, payloadHash, "s3", p.Region, time.Now())
	if err != nil {
		return nil, fmt.Errorf("S3 请求签名失败")
	}
	resp, err := s3HTTP.Do(req)
	if err != nil {
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}
		return nil, fmt.Errorf("S3 连接失败，请检查网络与证书")
	}
	return resp, nil
}

func CheckS3(ctx context.Context, p operation_setting.S3Profile) error {
	ctx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()
	resp, err := S3Request(ctx, p, http.MethodHead, "", nil, 0, "", nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("S3 Bucket 检查失败（HTTP %d）", resp.StatusCode)
	}
	return nil
}

// Single PUT is intentionally bounded to 1 GiB. Hashing and transfer read the
// seekable multipart spool in fixed-size buffers, never io.ReadAll(video).
func UploadS3Media(ctx context.Context, file *multipart.FileHeader, userID int, cfg operation_setting.S3Config) (*UploadResult, error) {
	return UploadS3ByPurpose(ctx, file, userID, cfg, UploadPurposePlayground)
}

func UploadS3ByPurpose(ctx context.Context, file *multipart.FileHeader, userID int, cfg operation_setting.S3Config, rawPurpose string) (*UploadResult, error) {
	cfg.ApplyPolicyDefaults()
	purpose, spec, err := resolveUploadPurpose(rawPurpose)
	if err != nil {
		return nil, err
	}

	if cfg.MaxFileSizeMB < 1 || cfg.MaxFileSizeMB > 1024 || file.Size <= 0 || file.Size > int64(cfg.MaxFileSizeMB)*1024*1024 {
		return nil, fmt.Errorf("文件为空或超过 S3 大小限制（最大 %d MB）", cfg.MaxFileSizeMB)
	}
	if purpose == UploadPurposeMaterial && file.Size > int64(cfg.MaterialUploadLimitMB())*1024*1024 {
		return nil, fmt.Errorf("素材文件超过 S3 大小限制（最大 %d MB）", cfg.MaterialUploadLimitMB())
	}
	p, err := cfg.Profile(cfg.ActiveProfileID)
	if err != nil {
		return nil, err
	}
	if err = operation_setting.ValidateS3Profile(p); err != nil {
		return nil, err
	}
	if _, err = s3FileURL(cfg, p, &model.TemporaryUpload{ID: 1, UserID: userID}); err != nil {
		return nil, err
	}
	src, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()
	head := make([]byte, 512)
	n, err := io.ReadFull(src, head)
	if err != nil && err != io.EOF && err != io.ErrUnexpectedEOF {
		return nil, err
	}
	mimeType := http.DetectContentType(head[:n])
	if extensionType := mime.TypeByExtension(uploadFileExt(file.Filename)); extensionType != "" {
		mimeType = extensionType
	}

	if _, err = src.Seek(0, io.SeekStart); err != nil {
		return nil, err
	}
	ctx, cancel := context.WithTimeout(ctx, 15*time.Minute)
	defer cancel()
	hash := sha256.New()
	written, err := io.Copy(hash, &contextReader{ctx: ctx, reader: io.LimitReader(src, int64(cfg.MaxFileSizeMB)*1024*1024+1)})
	if err != nil {
		return nil, err
	}
	if written != file.Size {
		return nil, fmt.Errorf("文件大小校验失败")
	}
	if _, err = src.Seek(0, io.SeekStart); err != nil {
		return nil, err
	}
	prefix, err := NormalizeLocalUploadPrefix(cfg.ObjectPrefix)
	if err != nil {
		return nil, err
	}
	key := BuildUploadObjectPath(path.Join(prefix, spec.directory), uploadFileExt(file.Filename))
	resp, err := S3Request(ctx, p, http.MethodPut, key, src, file.Size, hex.EncodeToString(hash.Sum(nil)), http.Header{"Content-Type": {mimeType}})
	if err != nil {
		return nil, err
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("S3 上传失败（HTTP %d）", resp.StatusCode)
	}
	rec := &model.TemporaryUpload{UserID: userID, Purpose: purpose, OriginalName: uploadOriginalName(file.Filename), MimeType: mimeType, Size: file.Size, StorageType: operation_setting.StorageTypeS3, StorageBase: p.ID, Endpoint: p.Endpoint, Bucket: p.Bucket, ObjectKey: key}
	// Use the existing purpose retention policy for new uploads. Historical rows
	// keep their original expiry; changing the backend does not migrate them.
	if spec.temporary {
		rec.ExpiresAt = time.Now().Add(playgroundUploadRetention(cfg.PlaygroundRetentionHours)).Unix()
	}
	if purpose == UploadPurposeMaterial {
		rec.ExpiresAt = time.Now().Add(time.Duration(cfg.MaterialPreviewRetentionHours) * time.Hour).Unix()
	}
	storageHash := uploadStorageKeyHash(rec.StorageType, key, p.ID, p.Endpoint, p.Bucket)
	rec.StorageKeyHash = &storageHash
	err = model.DB.Transaction(func(tx *gorm.DB) error {
		if e := tx.Create(rec).Error; e != nil {
			return e
		}
		rec.URL, err = s3FileURL(cfg, p, rec)
		if err != nil {
			return err
		}
		return tx.Model(rec).Update("url", rec.URL).Error
	})
	if err != nil {
		rollbackCtx, stop := context.WithTimeout(context.Background(), 30*time.Second)
		defer stop()
		if cleanupErr := deleteS3Object(rollbackCtx, p, key); cleanupErr != nil {
			return nil, fmt.Errorf("文件索引保存失败且 S3 回滚失败，请管理员回收对象 %s: %w", key, cleanupErr)
		}
		return nil, fmt.Errorf("文件索引保存失败: %w", err)
	}
	return &UploadResult{FileID: rec.ID, Purpose: rec.Purpose, OriginalName: rec.OriginalName, MimeType: rec.MimeType, Size: rec.Size, URL: rec.URL, StorageType: rec.StorageType, StorageBase: rec.StorageBase, ObjectKey: key, Endpoint: p.Endpoint, Bucket: p.Bucket, ExpiresAt: rec.ExpiresAt}, nil
}

type contextReader struct {
	ctx    context.Context
	reader io.Reader
}

func (r *contextReader) Read(b []byte) (int, error) {
	if err := r.ctx.Err(); err != nil {
		return 0, err
	}
	return r.reader.Read(b)
}

func s3FileSignature(p operation_setting.S3Profile, rec *model.TemporaryUpload, expires int64) string {
	mac := hmac.New(sha256.New, []byte(p.LinkSecret))
	fmt.Fprintf(mac, "%d\n%d\n%s\n%d", rec.ID, rec.UserID, rec.ObjectKey, expires)
	return hex.EncodeToString(mac.Sum(nil))
}

func s3FileURL(cfg operation_setting.S3Config, p operation_setting.S3Profile, rec *model.TemporaryUpload) (string, error) {
	u, err := url.Parse(cfg.PublicBaseURL)
	if err != nil || (u.Scheme != "https" && u.Scheme != "http") || u.Host == "" || u.User != nil || u.RawQuery != "" || u.Fragment != "" || (u.Path != "" && u.Path != "/") || len(p.LinkSecret) < 32 {
		return "", fmt.Errorf("请配置模型和浏览器可访问的平台外部地址")
	}
	// Stable capability URL: the existing file expiry controls access, so callers
	// do not need storage-specific preview or submission logic.
	expires := int64(0)
	return fmt.Sprintf("%s/api/storage/files/%d/content?expires=%d&signature=%s", strings.TrimRight(cfg.PublicBaseURL, "/"), rec.ID, expires, s3FileSignature(p, rec, expires)), nil
}

func VerifyS3FileSignature(p operation_setting.S3Profile, rec *model.TemporaryUpload, expiresRaw, signature string, now time.Time) bool {
	expires, err := strconv.ParseInt(expiresRaw, 10, 64)
	if err != nil || expires < 0 || (expires > 0 && expires <= now.Unix()) || len(p.LinkSecret) < 32 {
		return false
	}
	expected := s3FileSignature(p, rec, expires)
	return hmac.Equal([]byte(expected), []byte(signature))
}

func RefreshS3FileURL(cfg operation_setting.S3Config, rec *model.TemporaryUpload) (string, error) {
	p, err := cfg.Profile(rec.StorageBase)
	if err != nil {
		return "", err
	}
	return s3FileURL(cfg, p, rec)
}

func deleteS3Object(ctx context.Context, p operation_setting.S3Profile, key string) error {
	resp, err := S3Request(ctx, p, http.MethodDelete, key, nil, 0, "", nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNotFound {
		return fmt.Errorf("S3 删除失败（HTTP %d）", resp.StatusCode)
	}
	return nil
}

// S3UploadFromURL validates the bearer capability, including historical hosts.
// A matching path alone must never authorize deleting an indexed object.
func S3UploadFromURL(value string) (*model.TemporaryUpload, error) {
	u, err := url.Parse(value)
	if err != nil {
		return nil, fmt.Errorf("无效的文件地址")
	}
	var id int64
	if _, err = fmt.Sscanf(u.Path, "/api/storage/files/%d/content", &id); err != nil || u.Path != fmt.Sprintf("/api/storage/files/%d/content", id) {
		return nil, fmt.Errorf("非 S3 文件地址")
	}
	rec, err := model.GetUploadObjectByID(id)
	if err != nil {
		return nil, err
	}
	cfg, err := operation_setting.GetS3Config()
	if err != nil {
		return nil, err
	}
	p, err := cfg.Profile(rec.StorageBase)
	if err != nil || rec.StorageType != operation_setting.StorageTypeS3 || !VerifyS3FileSignature(p, rec, u.Query().Get("expires"), u.Query().Get("signature"), time.Unix(0, 0)) {
		return nil, fmt.Errorf("无效的 S3 文件链接")
	}
	return rec, nil
}
