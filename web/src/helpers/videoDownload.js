export function getVideoDownloadUrl(task, fallbackUrl = '') {
  const taskId = String(task?.taskId || '').trim();
  return taskId
    ? `/v1/videos/${encodeURIComponent(taskId)}/content`
    : fallbackUrl;
}

// Validate before creating a download: an API error must never become an MP4 file.
export async function readVideoDownload(response) {
  const contentType = (response.headers.get('content-type') || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (
    !response.ok ||
    (!contentType.startsWith('video/') &&
      contentType !== 'application/octet-stream')
  ) {
    let detail = '';
    try {
      const data = await response.json();
      const message = data?.error?.message || data?.message;
      if (typeof message === 'string') detail = message;
    } catch (_) {
      // Do not display an HTML error page as a download error.
    }
    throw new Error(
      detail ||
        `HTTP ${response.status} (${contentType || 'unknown content type'})`,
    );
  }
  const blob = await response.blob();
  if (blob.size === 0) throw new Error('Empty video response');
  const extensions = {
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'video/x-matroska': 'mkv',
  };
  return { blob, extension: extensions[contentType] || 'mp4' };
}
