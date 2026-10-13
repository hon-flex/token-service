/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */

export { isSoraH3Channel } from '../../../../../helpers/playgroundH3';

const params = (rows) =>
  rows.map(([name, type, required, example, description]) => ({
    name,
    type,
    required,
    example,
    description,
  }));

const taskParams = params([
  [
    'task_id',
    'string',
    true,
    'TASK_ID',
    '提交响应中的 id；查询和下载使用同一服务地址。',
  ],
]);

const multipartExample = (prompt, extra, references = []) =>
  [
    'curl --fail-with-body "{{base_url}}/v1/videos" \\',
    '  -H "Authorization: Bearer {{api_key}}" \\',
    '  -F "model={{model}}" \\',
    `  -F "prompt=${prompt}" \\`,
    '  -F "seconds=4" \\',
    '  -F "size=1344x768" \\',
    '  -F "width=1344" \\',
    '  -F "height=768" \\',
    '  -F "aspect_ratio=16:9" \\',
    '  -F "num_inference_steps=30" \\',
    '  -F "flow_shift=12" \\',
    ...references.map((file) => `  -F "input_references=@${file}" \\`),
    `  -F 'extra_params=${JSON.stringify(extra)}'`,
  ].join('\n');

export const h3ApiDocs = [
  {
    id: 'h3-create',
    description: 'MiniMax-H3 Video API',
    method: 'POST',
    path: '/v1/videos',
    multipart: true,
    body_params: params([
      ['model', 'string', true, '<model_name>', '当前选择的模型名称。'],
      [
        'prompt',
        'string',
        true,
        'A cat walking in a garden',
        '视频生成提示词。',
      ],
      ['seconds', 'integer', false, '4', '视频时长，单位为秒。'],
      [
        'size',
        'string',
        false,
        '1344x768',
        '输出尺寸，须与 width、height 一致。',
      ],
      ['width', 'integer', false, '1344', '输出宽度。'],
      ['height', 'integer', false, '768', '输出高度。'],
      ['aspect_ratio', 'string', true, '16:9', '视频宽高比。'],
      ['num_inference_steps', 'integer', false, '30', '推理步数。'],
      ['flow_shift', 'number', false, '12', '采样偏移，支持显式传入 0。'],
      [
        'input_references',
        'file',
        false,
        '@/path/to/first.png',
        '本地素材，可重复该字段上传多个文件；文生视频时省略。',
      ],
      [
        'extra_params',
        'string',
        false,
        '{"task":"fl2va","frame_indices":[0]}',
        'JSON 字符串。t2va：文生视频；fl2va：1 张首帧用 [0]，首尾 2 张图用 [0,-1]；ref2va：1–9 张参考图，或 1 个 MP4/MOV 并设置 start_time_seconds:[0]。',
      ],
    ]),
    curl_examples: [
      ['t2va', '文生视频', 'A cat walking in a garden', { task: 't2va' }, []],
      [
        'first',
        '首帧',
        'Animate the scene in the first frame',
        { task: 'fl2va', frame_indices: [0] },
        ['/path/to/first.png'],
      ],
      [
        'first-last',
        '首尾帧',
        'A smooth transition between the first and last frames',
        { task: 'fl2va', frame_indices: [0, -1] },
        ['/path/to/first.png', '/path/to/last.png'],
      ],
      [
        'reference-images',
        '参考图',
        'Create a video based on these reference images',
        { task: 'ref2va' },
        ['/path/to/reference-1.png', '/path/to/reference-2.png'],
      ],
      [
        'reference-video',
        '参考视频',
        'Create a video based on this reference video',
        { task: 'ref2va', start_time_seconds: [0] },
        ['/path/to/reference.mp4'],
      ],
    ].map(([id, label, prompt, extra, references]) => ({
      id,
      label,
      content: multipartExample(prompt, extra, references),
    })),
    response_params: params([
      ['id', 'string', false, 'TASK_ID', '任务 ID，用于查询和下载。'],
      [
        'status',
        'string',
        false,
        'queued',
        'queued：排队中；in_progress：生成中；completed：完成；failed / cancelled：结束，查看 error。',
      ],
      ['progress', 'integer', false, '0', '生成进度，范围 0–100。'],
    ]),
  },
  {
    id: 'h3-status',
    description: '查询状态',
    method: 'GET',
    path: '/v1/videos/{task_id}',
    path_params: taskParams,
    curl_example: [
      'curl --fail-with-body "{{base_url}}/v1/videos/TASK_ID" \\',
      '  -H "Authorization: Bearer {{api_key}}"',
    ].join('\n'),
    response_params: params([
      ['id', 'string', false, 'TASK_ID', '任务 ID。'],
      [
        'status',
        'string',
        false,
        'completed',
        'completed 后可下载；queued / in_progress 时稍后再查。',
      ],
      ['progress', 'integer', false, '100', '生成进度。'],
      ['error', 'null', false, 'null', '失败时返回错误信息。'],
    ]),
  },
  {
    id: 'h3-download',
    description: '下载视频',
    method: 'GET',
    path: '/v1/videos/{task_id}/content',
    path_params: taskParams,
    curl_example: [
      'curl --fail "{{base_url}}/v1/videos/TASK_ID/content" \\',
      '  -H "Authorization: Bearer {{api_key}}" \\',
      '  -o video.mp4',
    ].join('\n'),
  },
];
