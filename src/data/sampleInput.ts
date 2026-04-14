/**
 * 演示：单引号键/值、尾随逗号、JSON5 未加引号键名、Python 风格 True/False、嵌套与数组。
 * 字符串内的 True 不应被改写。
 */
export const SAMPLE_RELAXED_JSON = `{
  title: 'JSON 校验示例',
  enabled: True,
  disabled: False,
  'quoted-key': 42,
  note: "说明里写 True 不应被当成布尔值",
  nested: {
    tags: ['alpha', 'beta', 'gamma',],
    counts: [1, 2, 3,],
  },
  list: [
    { id: 1, ok: True, },
    { id: 2, ok: False, },
  ],
}`
