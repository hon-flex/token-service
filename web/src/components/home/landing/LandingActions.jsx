/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

export function LandingDocsLink({ docs, className = '', children, ...props }) {
  const { t } = useTranslation();
  return (
    <a
      className={className}
      href={docs.href}
      target={docs.openInNewTab ? '_blank' : undefined}
      rel={docs.openInNewTab ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children || t('查看接入文档')}
    </a>
  );
}
