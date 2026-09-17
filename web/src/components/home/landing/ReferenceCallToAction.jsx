/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

// Adapted from the HonMaaS homepage: https://token-service.hon-maas.com/.
export default function ReferenceCallToAction() {
  const { t } = useTranslation();
  return (
    <section className='hc-final'>
      <div className='hc-finalbox'>
        <div>
          <div className='hc-eyebrow' style={{ marginBottom: '16px' }}>
            {t('HonMaaS 模型聚合')}
          </div>
          <h2>
            {t('让大模型接入与落地，')}
            <br />
            {t('像调用标准接口一样轻松。')}
          </h2>
          <p>
            {t(
              '面向企业级业务与开发者，提供稳定、兼容、易用的国产大模型聚合分发基座。',
            )}
          </p>
        </div>
        <div className='hc-final-side'>
          <Link
            className='hc-btn-plasma'
            style={{ height: '48px', padding: '0 30px' }}
            to='/console'
          >
            {t('立即开始体验')} <span className='arrow'>{'→'}</span>
          </Link>
          <div className='hc-final-note'>{t('企业级模型网关')}</div>
        </div>
      </div>
    </section>
  );
}
