/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */

import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LandingDocsLink } from './LandingActions';

// Adapted from the HonMaaS homepage: https://token-service.hon-maas.com/.
export default function ReferenceHero({ systemName, docs }) {
  const { t } = useTranslation();
  const orbitGradient = useId();
  return (
    <section className='hc-split-hero'>
      <div className='hc-hero-left'>
        <div className='hc-sphere-stage-left' aria-hidden='true'>
          <div className='hc-sphere-glow' />
          <div className='hc-3d-globe-outer'>
            <div className='hc-orbit-ring r1'>
              <span className='hc-node-dot d1' />
              <span className='hc-node-dot d2 v' />
            </div>
            <div className='hc-orbit-ring r2'>
              <span className='hc-node-dot d3' />
              <span className='hc-node-dot d4 g' />
            </div>
            <div className='hc-orbit-ring r5'>
              <span className='hc-node-dot d1' />
              <span className='hc-node-dot d4 v' />
            </div>
          </div>
          <div className='hc-3d-globe-inner'>
            <div className='hc-orbit-ring r3'>
              <span className='hc-node-dot d1 v' />
              <span className='hc-node-dot d3' />
            </div>
            <div className='hc-orbit-ring r4'>
              <span className='hc-node-dot d2 g' />
              <span className='hc-node-dot d4' />
            </div>
          </div>
          <div className='hc-photon-satellite'>
            <span className='hc-node-dot d1' />
            <span className='hc-node-dot d2 v' />
          </div>
          <svg className='hc-sphere-mesh-svg' viewBox='0 0 600 600' fill='none'>
            <defs>
              <linearGradient id={orbitGradient} x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#1672ed' stopOpacity='.76' />
                <stop offset='58%' stopColor='#4388ed' stopOpacity='.6' />
                <stop offset='100%' stopColor='#8659dd' stopOpacity='.56' />
              </linearGradient>
            </defs>
            <ellipse
              cx='300'
              cy='300'
              rx='250'
              ry='95'
              stroke={'url(#' + orbitGradient + ')'}
              strokeWidth='1.8'
            />
            <ellipse
              cx='300'
              cy='300'
              rx='95'
              ry='250'
              stroke='rgba(119, 79, 205, 0.4)'
              strokeDasharray='4 6'
              strokeWidth='1.4'
            />
            <circle
              cx='300'
              cy='300'
              r='200'
              stroke='rgba(37, 99, 235, 0.4)'
              strokeWidth='1.2'
            />
            <circle
              cx='300'
              cy='300'
              r='140'
              stroke='rgba(119, 79, 205, 0.24)'
              strokeDasharray='6 6'
              strokeWidth='1.2'
            />
            <path
              d='M 110 280 L 240 160 L 400 180 L 500 320 L 380 440 L 180 410 Z'
              stroke='rgba(37, 99, 235, 0.55)'
              strokeWidth='1.5'
              strokeDasharray='2 4'
            />
            <path
              d='M 240 160 L 380 440 M 400 180 L 180 410 M 110 280 L 500 320'
              stroke='rgba(49, 117, 215, 0.25)'
              strokeWidth='1.2'
              strokeDasharray='4 8'
            />
            <circle cx='110' cy='280' r='5.5' fill='#2563eb' />
            <circle cx='240' cy='160' r='6' fill='#8254d5' />
            <circle cx='400' cy='180' r='5.5' fill='#0284c7' />
            <circle cx='500' cy='320' r='6' fill='#8254d5' />
            <circle cx='380' cy='440' r='5' fill='#2563eb' />
            <circle cx='180' cy='410' r='5.5' fill='#089eaf' />
            <circle className='hc-orbit-packet' r='3' fill='#2378ec'>
              <animateMotion
                path='M50 300 a250 95 0 1 0 500 0 a250 95 0 1 0 -500 0'
                dur='24s'
                repeatCount='indefinite'
              />
            </circle>
            <circle className='hc-orbit-packet' r='2.5' fill='#8055d3'>
              <animateMotion
                path='M300 50 a95 250 0 1 0 0 500 a95 250 0 1 0 0 -500'
                dur='31s'
                repeatCount='indefinite'
              />
            </circle>
          </svg>
        </div>
        <div className='hc-pill-badge'>
          <span className='hc-pill-dot' />
          {systemName} · HonMaaS {t('大模型服务平台')}
        </div>
        <h1>
          {t('国产前沿大模型')}
          <span className='shine-text'>{t('一站式Token服务')}</span>
        </h1>
        <p className='hc-hero-desc'>
          {' '}
          {t('依托庆阳智算基础设施，接入')}{' '}
          <b>{'deepseek-v4-flash、glm-5.2、minimax-h3'}</b>{' '}
          {t(
            '等主流大模型，统一调度、按需调用，全面兼容标准 OpenAI 协议。',
          )}{' '}
        </p>
        <div className='hc-proof-row'>
          <div className='hc-proof-pill'>
            <svg
              width='14'
              height='14'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
            </svg>
            <span>{t('标准 OpenAI 协议兼容')}</span>
          </div>
          <div className='hc-proof-pill'>
            <svg
              width='14'
              height='14'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <circle cx='12' cy='12' r='10' />
              <polyline points='12 6 12 12 16 14' />
            </svg>
            <span>{t('智能调度与容灾分发')}</span>
          </div>
          <div className='hc-proof-pill'>
            <svg
              width='14'
              height='14'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2' />
            </svg>
            <span>{t('支持流式 SSE 实时输出')}</span>
          </div>
        </div>
        <div className='hc-cta-group'>
          <Link className='hc-btn-plasma' to='/console'>
            {t('立即开通体验')} <span className='arrow'>{'→'}</span>
          </Link>
          {/* <LandingDocsLink docs={docs} className='hc-btn-outline'>
            {t('查看接入文档')} <span className='arrow-down'>{'↓'}</span>
          </LandingDocsLink> */}
        </div>
      </div>
      <div className='hc-console-card'>
        <div className='hc-bracket-tl' />
        <div className='hc-bracket-tr' />
        <div className='hc-bracket-bl' />
        <div className='hc-bracket-br' />
        <div className='hc-console-header'>
          <div className='hc-console-title'>
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <rect x='2' y='4' width='20' height='6' rx='2' />
              <rect x='2' y='14' width='20' height='6' rx='2' />
            </svg>{' '}
            {t('HonMaaS 平台')}{' '}
          </div>
          <div className='hc-console-status'>
            <span
              className='hc-pill-dot'
              style={{ width: '7px', height: '7px' }}
            />{' '}
            {t('智能分发')}{' '}
          </div>
        </div>
        <div className='hc-console-models'>
          <div className='hc-cmodel-row'>
            <div className='hc-cmodel-left'>
              <span className='hc-ctag t-flash'>{t('高速')}</span>
              <span className='hc-cname'>{'deepseek-v4-flash'}</span>
            </div>
            <div className='hc-cmodel-right'>
              <span>{t('轻量高速生成')}</span>
              <span className='hc-online-badge'>{t('按需调用')}</span>
            </div>
          </div>
          <div className='hc-cmodel-row'>
            <div className='hc-cmodel-left'>
              <span className='hc-ctag t-pro'>{t('旗舰')}</span>
              <span className='hc-cname'>{'glm-5.2'}</span>
            </div>
            <div className='hc-cmodel-right'>
              <span>{t('智谱旗舰模型')}</span>
              <span className='hc-online-badge'>{t('按需调用')}</span>
            </div>
          </div>
          <div className='hc-cmodel-row'>
            <div className='hc-cmodel-left'>
              <span className='hc-ctag t-long'>{t('视频')}</span>
              <span className='hc-cname'>{'minimax-h3'}</span>
            </div>
            <div className='hc-cmodel-right'>
              <span>{t('异步视频生成')}</span>
              <span className='hc-online-badge'>{t('按需调用')}</span>
            </div>
          </div>
        </div>
        <div className='hc-console-stats'>
          <div className='hc-cstat'>
            <span className='val'>{t('多款')}</span>
            <span className='lbl'>{t('精选主力模型')}</span>
          </div>
          <div className='hc-cstat'>
            <span className='val'>{'OpenAI'}</span>
            <span className='lbl'>{t('标准接口规范')}</span>
          </div>
          <div className='hc-cstat'>
            <span className='val'>{t('多端')}</span>
            <span className='lbl'>{t('客户端即插即用')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
