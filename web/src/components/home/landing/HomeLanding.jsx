/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */

import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusContext } from '../../../context/Status';
import { useActualTheme } from '../../../context/Theme';
import { getSystemName } from '../../../helpers/appBasics';
import { resolveDocsNav } from '../../../helpers/docsLink';
import ReferenceHero from './ReferenceHero';
import ReferenceStrip from './ReferenceStrip';
import ReferenceModels from './ReferenceModels';
import ReferenceAdvantages from './ReferenceAdvantages';
import ReferencePipeline from './ReferencePipeline';
import ReferenceCallToAction from './ReferenceCallToAction';
import HomeQuickStart from './HomeQuickStart';
import HomeMotionRegion from './HomeMotionRegion';
import './reference-home.css';
import './home-landing.css';

export default function HomeLanding() {
  const [statusState] = useContext(StatusContext);
  const { i18n } = useTranslation();
  const theme = useActualTheme();
  const status = statusState?.status || {};
  const systemName = getSystemName(i18n.language);
  const docs = resolveDocsNav(status.docs_link, i18n.language);
  return (
    <div className='hc-root' data-theme={theme === 'dark' ? 'dark' : 'light'}>
      <div className='hc-shell hc-hero-shell'>
        <HomeMotionRegion>
          <ReferenceHero systemName={systemName} docs={docs} />
        </HomeMotionRegion>
      </div>
      <ReferenceStrip />
      <div className='hc-shell'>
        <HomeMotionRegion reveal>
          <ReferenceModels />
        </HomeMotionRegion>
        <HomeMotionRegion reveal>
          <ReferenceAdvantages />
        </HomeMotionRegion>
        <HomeMotionRegion reveal>
          <ReferencePipeline />
        </HomeMotionRegion>
        <HomeMotionRegion reveal>
          <HomeQuickStart
            serverAddress='https://token-service-qy.hon-maas.com/v1'
            docs={docs}
          />
        </HomeMotionRegion>
        <HomeMotionRegion reveal>
          <ReferenceCallToAction />
        </HomeMotionRegion>
      </div>
    </div>
  );
}
