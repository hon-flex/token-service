/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */

import React from 'react';
import { Input, Select, Typography } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { getH3Settings } from '../../helpers/playgroundH3';
import ImageUrlInput from './ImageUrlInput';
import VideoUrlInput from './VideoUrlInput';

export default function H3Settings({
  inputs,
  onInputChange,
  disabled,
  section,
}) {
  const { t } = useTranslation();
  const config = getH3Settings(inputs);
  const modes = [
    { value: 't2va', label: t('文生视频') },
    { value: 'fl2va', label: t('首帧 / 首尾帧') },
    { value: 'ref2va-image', label: t('参考图生视频') },
    { value: 'ref2va-video', label: t('参考视频生视频') },
  ];
  const field = (key, label, type = 'number', min) => (
    <label key={key} className='flex flex-col gap-2 text-xs'>
      <span>{label}</span>
      <Input
        type={type}
        min={min}
        value={config[key]}
        disabled={disabled}
        onChange={(value) => onInputChange(key, value)}
      />
    </label>
  );
  return (
    <div className='flex flex-col gap-4'>
      <label className='flex flex-col gap-2 text-xs'>
        <span>{t('H3 生成模式')}</span>
        <Select
          aria-label={t('H3 生成模式')}
          value={config.h3_mode}
          optionList={modes}
          disabled={disabled}
          onChange={(value) => onInputChange('h3_mode', value)}
        />
      </label>
      {section === 'params' ? (
        <>
          <div className='grid grid-cols-2 gap-3'>
            {field('h3_seconds', t('视频时长（秒）'), 'number', 1)}
            {field('h3_aspect_ratio', t('比例'), 'text')}
            {field('h3_width', t('宽度 width'), 'number', 1)}
            {field('h3_height', t('高度 height'), 'number', 1)}
            {field('h3_steps', t('推理步数'), 'number', 1)}
            {field('h3_flow_shift', 'flow_shift')}
          </div>
          <Typography.Text type='tertiary' size='small'>
            {t('H3 默认参数来自调用脚本，其他规格以模型服务支持范围为准')}
          </Typography.Text>
        </>
      ) : (
        <>
          {config.h3_mode === 't2va' && (
            <Typography.Text type='tertiary'>
              {t('文生视频无需上传素材')}
            </Typography.Text>
          )}
          {config.h3_mode === 'fl2va' &&
            [0, 1].map((index) => (
              <ImageUrlInput
                key={index}
                title={index === 0 ? t('首帧（必填）') : t('尾帧（可选）')}
                imageUrls={[inputs.h3_frame_urls?.[index] || '']}
                imageEnabled={true}
                maxCount={1}
                disabled={disabled}
                onImageUrlsChange={(urls) => {
                  const frames = [
                    inputs.h3_frame_urls?.[0] || '',
                    inputs.h3_frame_urls?.[1] || '',
                  ];
                  frames[index] = urls[0] || '';
                  onInputChange('h3_frame_urls', frames);
                }}
              />
            ))}
          {config.h3_mode === 'ref2va-image' && (
            <ImageUrlInput
              title={t('参考图')}
              imageUrls={inputs.h3_image_urls || ['']}
              imageEnabled={true}
              maxCount={9}
              showCount={true}
              disabled={disabled}
              onImageUrlsChange={(urls) => onInputChange('h3_image_urls', urls)}
            />
          )}
          {config.h3_mode === 'ref2va-video' && (
            <>
              <VideoUrlInput
                videoUrls={inputs.h3_video_urls || ['']}
                videoEnabled={true}
                allowToggle={false}
                maxCount={1}
                disabled={disabled}
                onVideoUrlsChange={(urls) =>
                  onInputChange('h3_video_urls', urls)
                }
              />
              {field(
                'h3_start_seconds',
                t('参考视频起始时间（秒）'),
                'number',
                0,
              )}
            </>
          )}
          {config.h3_mode !== 't2va' && (
            <Typography.Text type='tertiary' size='small'>
              {t('H3 素材请上传文件或填写 HTTP(S) 地址，不支持 asset:// 引用')}
            </Typography.Text>
          )}
        </>
      )}
    </div>
  );
}
