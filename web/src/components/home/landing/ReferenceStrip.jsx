/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */

import React from 'react';
import { Box, Network, FileCode2, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Adapted from the HonMaaS homepage: https://token-service.hon-maas.com/.
export default function ReferenceStrip() {
  const { t } = useTranslation();
  return (
    <div className='hc-strip'>
      <div className='hc-shell hc-strip-inner'>
        <div className='hc-strip-item'>
          <Box className='hc-strip-icon' size={28} aria-hidden='true' />
          <div>
            <div className='n'>{t('01 / 模型')}</div>
            <div className='v'>{t('精选国产前沿大模型矩阵')}</div>
          </div>
        </div>
        <div className='hc-strip-item'>
          <Network className='hc-strip-icon' size={28} aria-hidden='true' />
          <div>
            <div className='n'>{t('02 / 调度')}</div>
            <div className='v'>{t('智能分发与多节点容灾')}</div>
          </div>
        </div>
        <div className='hc-strip-item'>
          <FileCode2 className='hc-strip-icon' size={28} aria-hidden='true' />
          <div>
            <div className='n'>{t('03 / 协议')}</div>
            <div className='v'>{t('标准 OpenAI 接口全面兼容')}</div>
          </div>
        </div>
        <div className='hc-strip-item'>
          <ShieldCheck className='hc-strip-icon' size={28} aria-hidden='true' />
          <div>
            <div className='n'>{t('04 / 控制台')}</div>
            <div className='v'>{t('独立令牌与精细额度管理')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
