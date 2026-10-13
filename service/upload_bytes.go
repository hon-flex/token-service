/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */
package service

import (
	"bytes"
	"fmt"
	"mime/multipart"
	"net/textproto"
)

// UploadBytesByPurpose connects existing in-memory producers to the shared dispatcher.
func UploadBytesByPurpose(data []byte, name, contentType string, userID int, purpose string) (*UploadResult, error) {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	header := textproto.MIMEHeader{}
	header.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename="%s"`, name))
	header.Set("Content-Type", contentType)
	part, err := writer.CreatePart(header)
	if err != nil {
		return nil, err
	}
	if _, err = part.Write(data); err != nil {
		return nil, err
	}
	if err = writer.Close(); err != nil {
		return nil, err
	}
	form, err := multipart.NewReader(&body, writer.Boundary()).ReadForm(int64(len(data)) + 1024)
	if err != nil {
		return nil, err
	}
	defer form.RemoveAll()
	return UploadMultipartFileByPurpose(form.File["file"][0], userID, purpose)
}
