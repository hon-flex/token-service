import React, { useRef, useState } from 'react';
import { Button, Toast } from '@douyinfe/semi-ui';
import { IconDownload } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import {
  getVideoDownloadUrl,
  readVideoDownload,
} from '../../helpers/videoDownload';

export default function VideoDownloadButton({ task, videoUrl }) {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);
  const pending = useRef(false);
  const downloadUrl = getVideoDownloadUrl(task, videoUrl);

  const download = async () => {
    if (pending.current || !downloadUrl) return;
    pending.current = true;
    setDownloading(true);
    try {
      const response = await fetch(downloadUrl, { credentials: 'same-origin' });
      const { blob, extension } = await readVideoDownload(response);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      const taskName = String(task?.taskId || 'video').replace(
        /[^a-zA-Z0-9_-]/g,
        '_',
      );
      link.download = `${taskName}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Let the browser start reading the object URL before releasing it.
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch (error) {
      Toast.error(`${t('下载失败')}：${error.message}`);
    } finally {
      pending.current = false;
      setDownloading(false);
    }
  };

  return (
    <Button
      size='small'
      theme='borderless'
      icon={<IconDownload />}
      loading={downloading}
      disabled={!downloadUrl || downloading}
      onClick={download}
      className='mt-2'
    >
      {t('下载视频')}
    </Button>
  );
}
