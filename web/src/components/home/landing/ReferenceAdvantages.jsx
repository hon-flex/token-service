/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import ArchitectureScene from './ArchitectureScene';

export default function ReferenceAdvantages() {
  const { t } = useTranslation();
  const advantages = [
    [t('主流客户端快速接入'), t('支持 Cherry Studio、Dify、Cursor 等工具。')],
    [t('多节点负载均衡与自动容灾'), t('智能分发与备用链路，保障调用稳定。')],
    [t('精细化多令牌与额度隔离'), t('独立 API Key、额度与调用权限管理。')],
  ];
  return (
    <section
      className='hc-section'
      id='hc-advantages'
      aria-labelledby='hc-advantages-title'
    >
      <div className='hc-sec-head'>
        <div className='hc-eyebrow'>{t('平台优势')}</div>
        <div className='hc-sec-copy'>
          <h2 id='hc-advantages-title'>
            {t('专为高可用与稳定性设计，')}
            <br />
            {t('为企业业务提供坚实底座。')}
          </h2>
          <p>{t('自动处理并发、负载均衡与故障转移，让模型接入稳定、可控。')}</p>
        </div>
      </div>
      <div className='hc-infra'>
        <div className='hc-infra-copy'>
          <h3>{t('开箱即用，全面融入现有工具链')}</h3>
          <p>{t('沿用标准 OpenAI 接口协议，连接现有客户端与应用。')}</p>
          <ol className='hc-cap-list'>
            {advantages.map(([title, detail], index) => (
              <li className='hc-cap' key={title}>
                <span className='ico'>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h4>{title}</h4>
                  <p>{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <ArchitectureScene />
      </div>
    </section>
  );
}
