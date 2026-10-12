/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */
package sora

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"syscall"
	"time"

	"github.com/QuantumNous/new-api/logger"
)

// Only H3 reference downloads use this wrapper. Copy the client to observe its
// existing redirect policy without changing the shared client, transport or limits.
func doH3MediaRequest(req *http.Request, client *http.Client, index int) (*http.Response, error) {
	downloadClient := *client
	redirectRejected := false
	if check := client.CheckRedirect; check != nil {
		downloadClient.CheckRedirect = func(next *http.Request, via []*http.Request) error {
			err := check(next, via)
			if err != nil && !errors.Is(err, http.ErrUseLastResponse) {
				redirectRejected = true
			}
			return err
		}
	}
	started := time.Now()
	resp, err := downloadClient.Do(req)
	if err == nil {
		return resp, nil
	}

	reason := h3MediaFailureReason(err)
	if redirectRejected {
		reason = "redirect_rejected"
	}
	proxyState := h3MediaInitialProxyState(req, client)
	// Emit only allowlisted categories, never err.Error(), URLs, addresses,
	// headers or response bodies. The logger adds the request ID from context.
	logger.LogError(req.Context(), fmt.Sprintf("H3 reference %d download failed: reason=%s initial_proxy=%s elapsed_ms=%d", index+1, reason, proxyState, time.Since(started).Milliseconds()))
	// Preserve the existing prefix and expose the same safe categories in usage logs.
	// Do not wrap the original error: downstream logging must not reveal signed URLs.
	return nil, fmt.Errorf("media download failed or was blocked (reason=%s, initial_proxy=%s)", reason, proxyState)
}

func h3MediaFailureReason(err error) string {
	switch {
	case errors.Is(err, context.Canceled):
		return "request_canceled"
	case errors.Is(err, context.DeadlineExceeded):
		return "timeout"
	}
	var dnsErr *net.DNSError
	if errors.As(err, &dnsErr) {
		if dnsErr.IsTimeout {
			return "dns_timeout"
		}
		return "dns_failed"
	}
	var netErr net.Error
	if errors.As(err, &netErr) && netErr.Timeout() {
		return "timeout"
	}
	var opErr *net.OpError
	if errors.As(err, &opErr) && opErr.Op == "proxyconnect" {
		return "proxy_connect_failed"
	}
	switch {
	case errors.Is(err, syscall.ECONNREFUSED):
		return "connection_refused"
	case errors.Is(err, syscall.ECONNRESET):
		return "connection_reset"
	case errors.Is(err, syscall.ENETUNREACH), errors.Is(err, syscall.EHOSTUNREACH):
		return "network_unreachable"
	case errors.Is(err, io.EOF), errors.Is(err, io.ErrUnexpectedEOF):
		return "connection_closed"
	}
	var certErr *tls.CertificateVerificationError
	var unknownAuthority x509.UnknownAuthorityError
	var hostnameErr x509.HostnameError
	var invalidCert x509.CertificateInvalidError
	if errors.As(err, &certErr) || errors.As(err, &unknownAuthority) || errors.As(err, &hostnameErr) || errors.As(err, &invalidCert) {
		return "tls_certificate_error"
	}
	var tlsHeaderErr tls.RecordHeaderError
	if errors.As(err, &tlsHeaderErr) {
		return "tls_handshake_error"
	}
	if errors.As(err, &opErr) {
		return "network_error"
	}
	return "transport_error"
}

// Inspect the initial request's proxy selection only after failure. The shared
// OSS transport uses ProxyFromEnvironment; never expose the proxy URL or credentials.
// A redirect may use a different proxy, so this is explicitly "initial_proxy".
func h3MediaInitialProxyState(req *http.Request, client *http.Client) string {
	transport := client.Transport
	if transport == nil {
		transport = http.DefaultTransport
	}
	httpTransport, ok := transport.(*http.Transport)
	if !ok {
		return "unknown"
	}
	if httpTransport.Proxy == nil {
		return "disabled"
	}
	proxyURL, err := httpTransport.Proxy(req)
	if err != nil {
		return "configuration_error"
	}
	if proxyURL != nil {
		return "enabled"
	}
	return "disabled"
}
