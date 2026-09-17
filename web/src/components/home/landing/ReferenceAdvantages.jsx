/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */

import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutGrid,
  Network,
  FileCode2,
  ShieldCheck,
  Server,
} from 'lucide-react';

export default function ReferenceAdvantages() {
  const { t } = useTranslation();
  const glassId = useId();
  const advantages = [
    [t('主流客户端快速接入'), t('支持 Cherry Studio、Dify、Cursor 等工具。')],
    [t('多节点负载均衡与自动容灾'), t('智能分发与备用链路，保障调用稳定。')],
    [t('精细化多令牌与额度隔离'), t('独立 API Key、额度与调用权限管理。')],
  ];
  const layers = [
    {
      name: t('应用层'),
      detail: 'Cherry Studio · Dify · Cursor',
      Icon: LayoutGrid,
    },
    {
      name: t('网关层'),
      detail: t('HonMaaS · 智能调度 · 自动容灾'),
      Icon: Network,
      featured: true,
    },
    {
      name: t('协议层'),
      detail: 'OpenAI API · SSE · Video API',
      Icon: FileCode2,
    },
    {
      name: t('安全层'),
      detail: t('令牌 · 额度 · 速率限制'),
      Icon: ShieldCheck,
    },
    { name: t('算力层'), detail: t('多节点推理集群'), Icon: Server },
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
          <div className='hc-client-tools'>
            <span>{t('支持的客户端与工具')}</span>
            <div>
              <span>
                <img
                  src='/brands/cherry-studio.png'
                  width='19'
                  height='19'
                  alt=''
                  loading='lazy'
                  decoding='async'
                />
                Cherry Studio
              </span>
              <span>
                <img
                  className='hc-client-wordmark'
                  src='/brands/dify.svg'
                  width='45'
                  height='20'
                  alt='Dify'
                  loading='lazy'
                  decoding='async'
                />
              </span>
              <span>
                <img
                  src='/brands/cursor.svg'
                  width='19'
                  height='19'
                  alt=''
                  loading='lazy'
                  decoding='async'
                />
                Cursor
              </span>
            </div>
          </div>
        </div>
        <div className='hc-architecture'>
          <div className='hc-architecture-floor' aria-hidden='true' />
          <div
            className='hc-architecture-column column-back'
            aria-hidden='true'
          />
          <div
            className='hc-architecture-column column-front'
            aria-hidden='true'
          />
          <ol className='hc-stack' aria-label={t('平台架构')}>
            {layers.map(({ name, detail, Icon, featured }, index) => (
              <li
                key={name}
                className={'hc-layer' + (featured ? ' featured' : '')}
                style={{ '--layer-index': index }}
              >
                <div className='hc-layer-light' aria-hidden='true' />
                <svg
                  className='hc-glass-platform'
                  viewBox='0 0 640 170'
                  fill='none'
                  aria-hidden='true'
                >
                  <defs>
                    <linearGradient
                      id={glassId + '-face-' + index}
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop offset='0%' stopColor='#ffffff' stopOpacity='.78' />
                      <stop
                        offset='55%'
                        stopColor='#e8f4ff'
                        stopOpacity='.38'
                      />
                      <stop
                        offset='100%'
                        stopColor='#f7fcff'
                        stopOpacity='.6'
                      />
                    </linearGradient>
                    <radialGradient
                      id={glassId + '-light-' + index}
                      cx='.55'
                      cy='.62'
                      r='.65'
                    >
                      <stop
                        offset='0%'
                        stopColor={featured ? '#409aff' : '#91c6ff'}
                        stopOpacity={featured ? '.42' : '.1'}
                      />
                      <stop
                        offset='65%'
                        stopColor='#6aafff'
                        stopOpacity={featured ? '.22' : '.04'}
                      />
                      <stop offset='100%' stopColor='#c6e6ff' stopOpacity='0' />
                    </radialGradient>
                    <linearGradient
                      id={glassId + '-edge-' + index}
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop offset='0%' stopColor='#effbff' stopOpacity='.95' />
                      <stop
                        offset='35%'
                        stopColor={featured ? '#86c3ff' : '#d1eaff'}
                        stopOpacity='.8'
                      />
                      <stop
                        offset='80%'
                        stopColor={featured ? '#277df2' : '#8ec6ff'}
                        stopOpacity={featured ? '.85' : '.5'}
                      />
                      <stop
                        offset='100%'
                        stopColor={featured ? '#85c6ff' : '#e5f5ff'}
                        stopOpacity='.7'
                      />
                    </linearGradient>
                  </defs>
                  <g transform='translate(-48 -8) scale(1.15 1.12)'>
                    <path
                      className='hc-glass-depth'
                      d='M49 91 L49 102 Q49 114 64 115 L497 127 Q510 128 519 119 L581 59 Q586 54 584 43 L513 109 Q507 115 497 115 L64 103 Q49 103 49 91Z'
                      fill={'url(#' + glassId + '-edge-' + index + ')'}
                    />
                    <path
                      className='hc-glass-face'
                      d='M57 83 L159 30 Q165 26 176 27 L573 37 Q590 38 579 49 L514 109 Q507 116 497 115 L64 103 Q42 103 57 83Z'
                      fill={'url(#' + glassId + '-face-' + index + ')'}
                    />
                    <path
                      d='M57 83 L159 30 Q165 26 176 27 L573 37 Q590 38 579 49 L514 109 Q507 116 497 115 L64 103 Q42 103 57 83Z'
                      fill={'url(#' + glassId + '-light-' + index + ')'}
                    />
                    <g className='hc-glass-collars'>
                      <ellipse cx='225' cy='35' rx='11' ry='4' />
                      <ellipse cx='537' cy='43' rx='11' ry='4' />
                    </g>
                    <path
                      className='hc-glass-edge'
                      d='M49 95 Q51 103 65 103 L497 115 Q507 116 514 109 L582 45'
                    />
                  </g>
                </svg>
                <div className='hc-layer-content'>
                  <Icon size={30} aria-hidden='true' />
                  <div>
                    <h4>{name}</h4>
                    <p>{detail}</p>
                  </div>
                </div>
                {index < layers.length - 1 && (
                  <div className='hc-layer-ports' aria-hidden='true'>
                    {[0, 1].map((port) => (
                      <svg key={port} viewBox='0 0 20 24' fill='currentColor'>
                        <path d='M7 2h6v11h5l-8 9-8-9h5z' />
                      </svg>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
