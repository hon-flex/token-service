/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */

import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { AppWindow, Network, Clapperboard } from 'lucide-react';

// Diagram only: chat streaming and asynchronous video tasks use separate lanes.
export default function ReferencePipeline() {
  const { t } = useTranslation();
  const id = useId().replace(/:/g, '');
  const routes = [
    { path: 'M190 170 H300', tone: 'blue' },
    { path: 'M600 170 H735', tone: 'blue' },
    { path: 'M885 170 C945 170 935 98 1000 98', tone: 'blue' },
    { path: 'M885 170 C940 170 944 188 1000 188', tone: 'violet' },
    { path: 'M450 265 V292 Q450 315 477 315 H1000', tone: 'teal' },
    {
      path: 'M775 230 V247 Q775 270 750 270 H120 Q95 270 95 245 V240',
      tone: 'return',
    },
  ];
  return (
    <section
      className='hc-section'
      id='hc-pipeline'
      aria-labelledby='hc-pipeline-title'
    >
      <div className='hc-sec-head'>
        <div className='hc-eyebrow'>{t('调度链路')}</div>
        <div className='hc-sec-copy'>
          <h2 id='hc-pipeline-title'>
            {t('清晰高效的请求流转，')}
            <br />
            {t('从请求到流式输出一气呵成。')}
          </h2>
          <p id={id + '-description'}>
            {t('统一接入 HonMaaS：聊天模型流式返回，视频模型异步生成。')}
          </p>
        </div>
      </div>
      <div className='hc-pipeline-box'>
        <div className='hc-flow-diagram' aria-describedby={id + '-description'}>
          <svg
            className='hc-flow-routes'
            viewBox='0 0 1200 400'
            preserveAspectRatio='none'
            aria-hidden='true'
          >
            <defs>
              <marker
                id={id + '-arrow'}
                viewBox='0 0 10 10'
                refX='9'
                refY='5'
                markerWidth='5'
                markerHeight='5'
                orient='auto-start-reverse'
              >
                <path d='M0 0 L10 5 L0 10Z' fill='context-stroke' />
              </marker>
            </defs>
            {routes.map(({ path, tone }, index) => (
              <g key={path} className={'hc-route route-' + tone}>
                <path
                  d={path}
                  fill='none'
                  strokeWidth='1.5'
                  markerEnd={'url(#' + id + '-arrow)'}
                />
                <circle r='3' cx='0' cy='0'>
                  <animateMotion
                    path={path}
                    dur={5 + index * 0.35 + 's'}
                    repeatCount='indefinite'
                  />
                </circle>
              </g>
            ))}
          </svg>
          <div className='hc-flow-node hc-flow-request'>
            <AppWindow size={32} aria-hidden='true' />
            <span className='hc-flow-label'>{t('01 / 应用请求')}</span>
            <strong>{t('应用发起请求')}</strong>
            <small>Client / SDK</small>
          </div>
          <div className='hc-flow-node hc-flow-gateway'>
            <Network size={40} aria-hidden='true' />
            <span className='hc-flow-label'>{t('02 / 智能调度')}</span>
            <strong>{t('HonMaaS 平台')}</strong>
            <small>{t('负载均衡 · 自动容灾')}</small>
          </div>
          <div className='hc-flow-node hc-flow-stream'>
            <span className='hc-flow-label'>{t('03 / SSE 输出')}</span>
            <div className='hc-sse-wave' aria-hidden='true'>
              {[12, 23, 16, 35, 25, 40, 19, 30, 14].map((height, index) => (
                <span key={index} style={{ height, '--wave-index': index }} />
              ))}
            </div>
            <small>SSE STREAM</small>
          </div>
          <div className='hc-flow-model hc-endpoint-deepseek'>
            <img
              className='hc-flow-brand'
              src='/brands/deepseek.svg'
              width='46'
              height='31'
              alt=''
              loading='lazy'
              decoding='async'
            />
            <div>
              <strong>DeepSeek V4</strong>
              <span>{t('高速生成')}</span>
            </div>
            <i aria-hidden='true' />
          </div>
          <div className='hc-flow-model hc-endpoint-glm'>
            <img
              className='hc-flow-brand'
              src='/brands/zhipu.svg'
              width='46'
              height='31'
              alt=''
              loading='lazy'
              decoding='async'
            />
            <div>
              <strong>GLM 5.2</strong>
              <span>{t('旗舰推理')}</span>
            </div>
            <i aria-hidden='true' />
          </div>
          <div className='hc-video-lane'>
            <Clapperboard size={17} aria-hidden='true' />
            {t('异步视频任务')}
          </div>
          <div className='hc-flow-model hc-endpoint-minimax'>
            <img
              className='hc-flow-brand'
              src='/brands/minimax.png'
              width='46'
              height='31'
              alt=''
              loading='lazy'
              decoding='async'
            />
            <div>
              <strong>MiniMax-H3</strong>
              <span>{t('视频生成')}</span>
            </div>
            <i aria-hidden='true' />
          </div>
        </div>
        <div className='hc-pipe-stats'>
          <div className='hc-pipe-stat'>
            <div className='v'>{t('全面兼容')}</div>
            <div className='k'>{t('OpenAI 接口规范')}</div>
          </div>
          <div className='hc-pipe-stat'>
            <div className='v'>{t('高可用')}</div>
            <div className='k'>{t('节点负载分发')}</div>
          </div>
          <div className='hc-pipe-stat'>
            <div className='v'>{t('流式')}</div>
            <div className='k'>{t('实时输出')}</div>
          </div>
          <div className='hc-pipe-stat'>
            <div className='v'>{t('即插即用')}</div>
            <div className='k'>{t('按需获取令牌')}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
