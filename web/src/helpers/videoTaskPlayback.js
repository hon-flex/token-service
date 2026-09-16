// The content route supports the dashboard session and checks task ownership.
export function getVideoTaskPlaybackUrl(task) {
  if (task?.playableUrl) return task.playableUrl;
  if (
    !['completed', 'success', 'succeeded'].includes(
      String(task?.status || '').toLowerCase(),
    )
  )
    return '';
  const taskId = String(task?.taskId || '').trim();
  return taskId ? `/v1/videos/${encodeURIComponent(taskId)}/content` : '';
}
