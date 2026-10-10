/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */

export const isSoraH3Channel = (channelType, soraVideoMode) =>
  Number(channelType) === 55 && soraVideoMode === 'h3';

// Random routing is safe only when all available channels use the same H3 format.
export function resolveH3Channel(model, route, channels = []) {
  const selected = route
    ? channels.filter((channel) => channel.route_slug === route)
    : channels;
  const modes = new Set(
    selected.map((channel) =>
      isSoraH3Channel(channel.channel_type, channel.sora_video_mode),
    ),
  );
  return {
    model,
    route: String(route || ''),
    mode: !selected.length
      ? 'loading'
      : modes.size > 1
        ? 'mixed'
        : modes.has(true)
          ? 'h3'
          : 'default',
  };
}

const getH3ChannelMode = (inputs) => {
  const channel = inputs.selected_h3_channel;
  return channel?.model === inputs.model &&
    channel?.route === String(inputs.selected_route_slug || '')
    ? channel.mode
    : 'loading';
};

export const isPlaygroundH3 = (inputs) => getH3ChannelMode(inputs) === 'h3';

export function getH3ChannelError(inputs) {
  if (!inputs.model) return '';
  const mode = getH3ChannelMode(inputs);
  if (mode === 'loading') return '正在读取渠道类型，请稍后再发送';
  if (mode === 'mixed') return '同名模型包含不同视频协议，请先选择具体渠道';
  return '';
}

export const H3_DEFAULTS = {
  h3_mode: 't2va',
  h3_seconds: 4,
  h3_width: 1344,
  h3_height: 768,
  h3_aspect_ratio: '16:9',
  h3_steps: 30,
  h3_flow_shift: 12,
  h3_start_seconds: 0,
};

export const getH3Settings = (inputs) => ({ ...H3_DEFAULTS, ...inputs });

const filled = (urls) =>
  (urls || [])
    .flatMap((url) => String(url || '').split('\n'))
    .map((url) => url.trim())
    .filter(Boolean);

export function getH3ImageUrls(inputs) {
  const { h3_mode: mode } = getH3Settings(inputs);
  if (mode === 'ref2va-image') return filled(inputs.h3_image_urls);
  if (mode === 'fl2va')
    return (inputs.h3_frame_urls || ['', '']).map((url) =>
      String(url || '').trim(),
    );
  return [];
}

export function buildH3Payload(inputs, prompt, model) {
  const config = getH3Settings(inputs);
  const mode = config.h3_mode;
  const images = getH3ImageUrls(inputs);
  const videos = mode === 'ref2va-video' ? filled(inputs.h3_video_urls) : [];
  const references =
    mode === 'fl2va' ? images.filter(Boolean) : [...images, ...videos];
  const extra = { task: mode.startsWith('ref2va-') ? 'ref2va' : mode };
  if (mode === 'fl2va') extra.frame_indices = images[1] ? [0, -1] : [0];
  if (mode === 'ref2va-video')
    extra.start_time_seconds = [Number(config.h3_start_seconds)];
  return {
    model,
    prompt,
    seconds: String(config.h3_seconds),
    duration: Number(config.h3_seconds),
    size: `${config.h3_width}x${config.h3_height}`,
    width: Number(config.h3_width),
    height: Number(config.h3_height),
    aspect_ratio: config.h3_aspect_ratio,
    num_inference_steps: Number(config.h3_steps),
    flow_shift: Number(config.h3_flow_shift),
    extra_params: extra,
    input_references: references,
    ...(mode === 'ref2va-image' ? { images } : {}),
    ...(mode === 'fl2va'
      ? {
          first_frame_url: images[0],
          ...(images[1] ? { last_frame_url: images[1] } : {}),
        }
      : {}),
    metadata: {
      ratio: config.h3_aspect_ratio,
      ...(videos.length ? { video_urls: videos } : {}),
    },
    __endpoint: 'video',
    stream: false,
  };
}

export function validateH3Inputs(inputs) {
  const c = getH3Settings(inputs);
  const fail = (message) => ({ ok: false, message });
  if (!['t2va', 'fl2va', 'ref2va-image', 'ref2va-video'].includes(c.h3_mode))
    return fail('请选择 H3 生成模式');
  for (const key of ['h3_seconds', 'h3_width', 'h3_height', 'h3_steps']) {
    if (!Number.isSafeInteger(Number(c[key])) || Number(c[key]) <= 0)
      return fail('H3 时长、宽高和推理步数必须为正整数');
  }
  if (
    !String(c.h3_flow_shift).trim() ||
    !Number.isFinite(Number(c.h3_flow_shift))
  )
    return fail('H3 flow_shift 必须为有效数值');
  if (!/^[1-9]\d*:[1-9]\d*$/.test(String(c.h3_aspect_ratio)))
    return fail('H3 比例格式应为 16:9');
  const images = getH3ImageUrls(inputs);
  if (c.h3_mode === 'fl2va' && (!images[0] || images.length > 2))
    return fail('H3 首尾帧模式需要首帧，尾帧可选');
  if (c.h3_mode === 'ref2va-image' && (images.length < 1 || images.length > 9))
    return fail('H3 参考图片数量必须为 1 到 9 张');
  const videos =
    c.h3_mode === 'ref2va-video' ? filled(inputs.h3_video_urls) : [];
  if (c.h3_mode === 'ref2va-video') {
    if (videos.length !== 1) return fail('H3 参考视频模式需要 1 个视频');
    if (
      !String(c.h3_start_seconds).trim() ||
      !Number.isFinite(Number(c.h3_start_seconds)) ||
      Number(c.h3_start_seconds) < 0
    )
      return fail('H3 视频起始时间必须为非负数');
  }
  for (const value of [...images.filter(Boolean), ...videos]) {
    try {
      const url = new URL(value);
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password
      )
        throw new Error();
    } catch {
      return fail('H3 素材请上传文件或填写 HTTP(S) 地址，不支持 asset:// 引用');
    }
  }
  return { ok: true };
}
