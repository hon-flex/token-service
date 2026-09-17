/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconArrowRight, IconCopy, IconTick } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { LandingDocsLink } from './LandingActions';
import { createCodeExamples, getApiBaseURL } from './code-examples';

const LANGUAGES = [
  { id: 'curl', label: 'cURL' },
  { id: 'python', label: 'Python' },
  { id: 'node', label: 'Node.js' },
];

function CodeLine({ text }) {
  const parts = text.split(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:from|import|const|await|new)\b)/g,
  );
  return parts.map((part, index) => (
    <span
      key={index}
      className={
        /^["']/.test(part)
          ? 'hl-code-string'
          : /^(from|import|const|await|new)$/.test(part)
            ? 'hl-code-keyword'
            : undefined
      }
    >
      {part}
    </span>
  ));
}

export default function HomeQuickStart({ serverAddress, docs }) {
  const { t } = useTranslation();
  const id = useId();
  const [language, setLanguage] = useState('curl');
  const [copyState, setCopyState] = useState('idle');
  const copyTimer = useRef(null);
  const tabRefs = useRef([]);
  const examples = useMemo(
    () =>
      createCodeExamples(getApiBaseURL(serverAddress, window.location.origin)),
    [serverAddress],
  );

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const copyCode = async () => {
    clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(examples[language]);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
    copyTimer.current = setTimeout(() => setCopyState('idle'), 2400);
  };

  const selectLanguage = (value) => {
    setLanguage(value);
    setCopyState('idle');
    clearTimeout(copyTimer.current);
  };

  const handleTabKey = (event, index) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % LANGUAGES.length;
    if (event.key === 'ArrowLeft')
      next = (index + LANGUAGES.length - 1) % LANGUAGES.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = LANGUAGES.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectLanguage(LANGUAGES[next].id);
      tabRefs.current[next]?.focus();
    }
  };

  return (
    <section
      className='hc-section'
      id='hc-quickstart'
      aria-labelledby='hc-start-title'
    >
      <div className='hc-sec-head'>
        <div className='hc-eyebrow'>{t('快速开始')}</div>
        <div className='hc-sec-copy'>
          <h2 id='hc-start-title'>
            {t('只需三步，')}
            <br />
            {t('即可为应用接入大模型能力。')}
          </h2>
          <p>{t('三步接入，快速将大模型能力集成到你的应用中。')}</p>
        </div>
      </div>
      <div className='hc-onboard'>
        <div className='hc-steps'>
          <div className='hc-step'>
            <div className='num'>01</div>
            <div>
              <h4>
                <Link to='/console/token'>
                  {t('获取令牌')} <IconArrowRight aria-hidden='true' />
                </Link>
              </h4>
              <p>{t('在控制台创建 API 令牌')}</p>
            </div>
          </div>
          <div className='hc-step'>
            <div className='num'>02</div>
            <div>
              <h4>
                <LandingDocsLink docs={docs}>
                  {t('配置接口')} <IconArrowRight aria-hidden='true' />
                </LandingDocsLink>
              </h4>
              <p>{t('按文档配置调用参数')}</p>
              <code className='hc-api-address'>
                {getApiBaseURL(serverAddress, window.location.origin)}
              </code>
            </div>
          </div>
          <div className='hc-step'>
            <div className='num'>03</div>
            <div>
              <h4>
                <Link to='/console/playground'>
                  {t('发起调用')} <IconArrowRight aria-hidden='true' />
                </Link>
              </h4>
              <p>{t('开始对话与应用集成')}</p>
            </div>
          </div>
        </div>
        <div className='hl-code-panel'>
          <div className='hl-code-toolbar'>
            <div
              className='hl-code-tabs'
              role='tablist'
              aria-label={t('示例语言')}
            >
              {LANGUAGES.map((item, index) => (
                <button
                  key={item.id}
                  ref={(element) => {
                    tabRefs.current[index] = element;
                  }}
                  role='tab'
                  id={id + '-tab-' + item.id}
                  aria-selected={language === item.id}
                  aria-controls={id + '-panel'}
                  tabIndex={language === item.id ? 0 : -1}
                  onClick={() => selectLanguage(item.id)}
                  onKeyDown={(event) => handleTabKey(event, index)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              className='hl-copy'
              type='button'
              onClick={copyCode}
              aria-label={copyState === 'copied' ? t('已复制') : t('复制代码')}
              title={copyState === 'copied' ? t('已复制') : t('复制代码')}
            >
              {copyState === 'copied' ? (
                <IconTick aria-hidden='true' />
              ) : (
                <IconCopy aria-hidden='true' />
              )}
              <span className='hl-copy-label'>
                {copyState === 'copied' ? t('已复制') : t('复制代码')}
              </span>
            </button>
          </div>
          <div
            className='hl-code-content'
            role='tabpanel'
            id={id + '-panel'}
            aria-labelledby={id + '-tab-' + language}
            tabIndex={0}
          >
            <pre>
              <code>
                {examples[language].split('\n').map((line, index) => (
                  <span className='hl-code-line' key={index}>
                    <span className='hl-code-text'>
                      <CodeLine text={line || ' '} />
                    </span>
                  </span>
                ))}
              </code>
            </pre>
          </div>
          <div className='hl-code-caption'>
            <span>
              {t(
                '将 YOUR_MODEL_ID 替换为支持聊天接口的模型 ID。视频模型请使用视频 API。',
              )}
            </span>
            <span role='status' aria-live='polite'>
              {copyState === 'copied'
                ? t('已复制')
                : copyState === 'error'
                  ? t('复制失败，请手动选择代码复制。')
                  : ''}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
