/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */
import React, { useEffect, useState } from 'react';
import {
  Banner,
  Button,
  Input,
  InputNumber,
  Switch,
  Typography,
} from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { API, isRoot, showError, showSuccess } from '../../../helpers';

const initialValues = {
  endpoint: '',
  bucket: '',
  region: 'us-east-1',
  path_style: true,
  public_base_url: '',
  object_prefix: 'token-factory/uploads',
  max_file_size_mb: 512,
  link_ttl_hours: 168,
  material_max_file_size_mb: 10,
  playground_retention_hours: 24,
  material_preview_retention_hours: 168,
};

export default function SettingsS3Storage({
  visible,
  onStatus,
  onApply,
  children,
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState(initialValues);
  const [savedValues, setSavedValues] = useState(initialValues);
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [clearToken, setClearToken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const root = isRoot();
  const change = (key, value) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!root) return;
    let active = true;
    API.get('/api/storage/s3')
      .then(({ data }) => {
        if (!active) return;
        if (!data.success) throw new Error(data.message);
        setValues({ ...initialValues, ...data.data });
        setSavedValues({ ...initialValues, ...data.data });
        setLoaded(true);
      })
      .catch((error) => {
        if (active) showError(error.message);
      });
    return () => {
      active = false;
    };
  }, [root]);

  const dirty =
    JSON.stringify(values) !== JSON.stringify(savedValues) ||
    !!accessKey ||
    !!secretKey ||
    !!sessionToken ||
    clearToken;
  useEffect(() => {
    onStatus({
      ready: loaded && !!savedValues.credentials_configured,
      dirty,
      busy,
    });
  }, [loaded, savedValues, dirty, busy, onStatus]);

  const save = async () => {
    setBusy(true);
    try {
      const payload = {
        ...values,
        access_key: accessKey,
        secret_key: secretKey,
      };
      if (clearToken || sessionToken)
        payload.session_token = clearToken ? '' : sessionToken;
      const { data } = await API.put('/api/storage/s3', payload);
      if (!data.success) throw new Error(data.message);
      setValues({ ...initialValues, ...data.data });
      setSavedValues({ ...initialValues, ...data.data });
      setAccessKey('');
      setSecretKey('');
      setSessionToken('');
      setClearToken(false);
      showSuccess(t('保存成功'));
      return true;
    } catch (error) {
      showError(error?.response?.data?.message || error.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const testConnection = async () => {
    setBusy(true);
    try {
      const { data } = await API.post('/api/storage/s3/test');
      if (!data.success) throw new Error(data.message);
      showSuccess(
        t('已保存配置的 Bucket 可访问；请通过测试上传验证读写权限。'),
      );
    } catch (error) {
      showError(error?.response?.data?.message || error.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (!root) return null;
  const field = (key, label, placeholder) => (
    <label style={{ display: 'grid', gap: 6 }}>
      <span>{t(label)}</span>
      <Input
        aria-label={t(label)}
        value={values[key]}
        placeholder={placeholder}
        disabled={!loaded || busy}
        onChange={(value) => change(key, value)}
      />
    </label>
  );
  const policyField = (key, label, max) => (
    <label style={{ display: 'grid', gap: 6 }}>
      <span>{t(label)}</span>
      <InputNumber
        aria-label={t(label)}
        min={1}
        max={max}
        precision={0}
        value={values[key]}
        disabled={!loaded || busy}
        onChange={(value) => change(key, value)}
      />
    </label>
  );
  return (
    <section
      style={{
        display: visible ? undefined : 'none',
        marginBottom: 16,
        padding: 20,
        border: '1px solid var(--semi-color-border)',
        borderRadius: 8,
      }}
    >
      <Typography.Title heading={5}>
        {t('S3 / MinIO 存储配置')}
      </Typography.Title>
      <Typography.Paragraph type='tertiary'>
        {t(
          '在上方选择 S3 并应用后，平台所有上传业务统一使用此配置。切换存储不迁移或删除已有文件。',
        )}
      </Typography.Paragraph>
      <Banner
        type='info'
        closeIcon={null}
        description={t(
          'S3 的大小限制和保留时间独立保存，仅对新上传文件生效。切换存储不会迁移或删除已有文件。',
        )}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        {field('endpoint', 'S3 API 地址', 'http://minio.example.com:9000')}
        {field('bucket', 'Bucket', 'token-factory-test')}
        {field('region', 'Region', 'us-east-1')}
        {field(
          'public_base_url',
          '平台外部地址',
          'https://gateway.example.com',
        )}
        {field('object_prefix', '对象前缀', 'token-factory/uploads')}
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Access Key</span>
          <Input
            mode='password'
            autoComplete='new-password'
            aria-label='S3 Access Key'
            value={accessKey}
            disabled={!loaded || busy}
            placeholder={t('留空保留已保存凭证')}
            onChange={setAccessKey}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Secret Key</span>
          <Input
            mode='password'
            autoComplete='new-password'
            aria-label='S3 Secret Key'
            value={secretKey}
            disabled={!loaded || busy}
            placeholder={t('留空保留已保存凭证')}
            onChange={setSecretKey}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>{t('临时凭证 Token（可选）')}</span>
          <Input
            mode='password'
            autoComplete='new-password'
            aria-label={t('临时凭证 Token（可选）')}
            value={sessionToken}
            disabled={!loaded || busy || clearToken}
            onChange={setSessionToken}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>{t('单文件上限（MB，最大 1024）')}</span>
          <InputNumber
            aria-label={t('单文件上限（MB，最大 1024）')}
            min={1}
            max={1024}
            precision={0}
            value={values.max_file_size_mb}
            disabled={!loaded || busy}
            onChange={(value) => change('max_file_size_mb', value)}
          />
        </label>
        {policyField(
          'material_max_file_size_mb',
          '素材库单文件上限（MB）',
          1024,
        )}
        {policyField(
          'playground_retention_hours',
          '操练场文件保留时间（小时）',
          8760,
        )}
        {policyField(
          'material_preview_retention_hours',
          '素材预览保留时间（小时）',
          8760,
        )}
      </div>
      <Typography.Paragraph type='tertiary' style={{ marginTop: 12 }}>
        {t('素材上传同时受单文件上限约束，当前有效上限为 {{size}} MB。', {
          size: Math.min(
            values.max_file_size_mb || 0,
            values.material_max_file_size_mb || 0,
          ),
        })}{' '}
        {t('以上限制不读取本地、OSS 或素材库设置中的大小和保留时间。')}
      </Typography.Paragraph>
      <Typography.Paragraph type='tertiary'>
        {t(
          '保留时间可设为 1–8760 小时；到期停止读取，后台每 10 分钟清理一次，删除失败会重试。素材清理只删除预览，不删除素材记录或上游素材。',
        )}
      </Typography.Paragraph>
      <Typography.Paragraph type='tertiary'>
        {t(
          '首页、图标、发票和水印等永久用途不自动过期。上传权限和平台限流仍然生效。',
        )}
      </Typography.Paragraph>
      <Typography.Paragraph type='tertiary'>
        {t(
          '单文件最多 1024 MB，S3 上传与读取操作超时为 15 分钟；反向代理的请求体上限、超时及上游模型限制需要在对应服务配置。',
        )}
      </Typography.Paragraph>
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: 16, margin: '16px 0' }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Switch
            aria-label='Path-style'
            checked={values.path_style}
            disabled={!loaded || busy}
            onChange={(value) => change('path_style', value)}
          />
          <span>{t('Path-style（IP 地址须启用）')}</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Switch
            aria-label={t('清除已保存的临时 Token')}
            checked={clearToken}
            disabled={!loaded || busy}
            onChange={setClearToken}
          />
          <span>{t('清除已保存的临时 Token')}</span>
        </label>
      </div>
      <Typography.Paragraph type='tertiary'>
        {t(
          '平台外部地址须同时能被浏览器和模型服务器访问。S3 地址填写 API 端口，Bucket 须预先创建。',
        )}{' '}
        {values.credentials_configured
          ? t('凭证已配置，留空不会覆盖。')
          : t('尚未配置凭证。')}
      </Typography.Paragraph>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button theme='solid' loading={busy} disabled={!loaded} onClick={save}>
          {t('保存配置')}
        </Button>
        <Button
          disabled={!loaded}
          loading={busy}
          onClick={async () => {
            if (await save()) await onApply();
          }}
        >
          {t('保存 S3 配置并应用')}
        </Button>
        <Button
          disabled={!loaded || busy || dirty || !values.credentials_configured}
          onClick={testConnection}
        >
          {t('检查已保存的连接')}
        </Button>
      </div>
      {children}
    </section>
  );
}
