/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ReferenceModels() {
  const { t } = useTranslation();
  const models = [
    {
      name: 'DeepSeek V4',
      id: 'deepseek-v4-flash',
      tone: 'deepseek',
      logo: '/brands/deepseek.svg',
      brand: 'DeepSeek',
      tag: t('高速'),
      benefit: t('轻量生成，流畅响应'),
      features: [t('高性能轻量 MoE'), t('支持流式实时输出')],
      scenario: t('日常问答 · 高并发服务'),
    },
    {
      name: 'GLM 5.2',
      id: 'glm-5.2',
      tone: 'glm',
      logo: '/brands/zhipu.svg',
      brand: '智谱',
      tag: t('旗舰'),
      benefit: t('复杂推理，精准理解'),
      features: [t('工具调用 / 结构化输出'), t('复杂逻辑 / 中文理解')],
      scenario: t('企业知识库 · Agent 规划'),
    },
    {
      name: 'MiniMax-H3',
      id: 'minimax-h3',
      tone: 'minimax',
      logo: '/brands/minimax.png',
      brand: 'MiniMax',
      tag: t('视频'),
      benefit: t('视频生成，释放创意'),
      features: [t('异步视频任务'), t('任务查询与视频下载')],
      scenario: t('创意制作 · 视频内容生成'),
    },
  ];
  return (
    <section
      className='hc-section'
      id='hc-models'
      aria-labelledby='hc-models-title'
    >
      <div className='hc-sec-head'>
        <div className='hc-eyebrow'>{t('模型矩阵')}</div>
        <div className='hc-sec-copy'>
          <h2 id='hc-models-title'>
            {t('精选前沿大模型，')}
            <br />
            {t('随时调用最契合业务的大脑。')}
          </h2>
          <p>
            {t('一个统一的访问令牌，按需调用文本生成、复杂推理与视频模型。')}
          </p>
        </div>
      </div>
      <div className='hc-modelgrid'>
        {models.map(
          (
            { name, id, tone, logo, brand, tag, benefit, features, scenario },
            index,
          ) => (
            <article
              className={'hc-modelcard card-' + tone}
              key={id}
              style={{ '--card-index': index }}
            >
              <div className='hc-model-top'>
                <span className='hc-model-brand'>
                  <img
                    src={logo}
                    alt={brand}
                    width='126'
                    height='44'
                    loading='lazy'
                    decoding='async'
                  />
                </span>
                <span className='hc-flag'>{tag}</span>
              </div>
              <h3>{name}</h3>
              <div className='hc-model-id'>{id}</div>
              <h4 className='hc-model-benefit'>{benefit}</h4>
              <ul className='hc-model-features'>
                {features.map((feature) => (
                  <li key={feature}>
                    <Check size={14} aria-hidden='true' />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className='hc-model-use'>
                <div>
                  <span>{t('推荐应用场景')}</span>
                  <p>{scenario}</p>
                </div>
                <Link
                  to='/pricing'
                  className='hc-model-link'
                  aria-label={t('查看模型') + ' ' + name}
                >
                  <ArrowRight size={21} aria-hidden='true' />
                </Link>
              </div>
            </article>
          ),
        )}
      </div>
    </section>
  );
}
