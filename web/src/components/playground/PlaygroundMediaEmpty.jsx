/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */

import React from 'react';
import { ImageOff, VideoOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PlaygroundMediaEmpty({
  kind = 'image',
  compact = false,
}) {
  const { t } = useTranslation();
  const Icon = kind === 'video' ? VideoOff : ImageOff;
  const message =
    kind === 'video'
      ? t('视频已过期，请清空后重新上传。')
      : t('图片已过期，请清空后重新上传。');
  return (
    <div
      role='status'
      className='flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--semi-color-border)] bg-[var(--semi-color-fill-0)] text-[var(--semi-color-text-2)] text-center'
      style={{
        width: compact ? 88 : 280,
        maxWidth: '100%',
        minHeight: compact ? 72 : 140,
        padding: compact ? 8 : 20,
        fontSize: compact ? 11 : 13,
        flexShrink: 0,
      }}
    >
      <Icon size={compact ? 18 : 28} aria-hidden='true' />
      <span>{message}</span>
    </div>
  );
}
