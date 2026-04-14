import JSON5 from 'json5'
import { normalizePythonLiterals } from './normalizePythonLiterals'

export type ParseError = {
  message: string
  lineNumber?: number
  columnNumber?: number
}

export type ParseUserJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; error: ParseError }

export function parseUserJson(raw: string): ParseUserJsonResult {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { ok: false, error: { message: '请输入 JSON 文本' } }
  }

  const normalized = normalizePythonLiterals(trimmed)

  try {
    const value = JSON5.parse(normalized)
    return { ok: true, value }
  } catch (e) {
    const err = e as SyntaxError & {
      lineNumber?: number
      columnNumber?: number
    }
    return {
      ok: false,
      error: {
        message: err.message || '解析失败',
        lineNumber: err.lineNumber,
        columnNumber: err.columnNumber,
      },
    }
  }
}
