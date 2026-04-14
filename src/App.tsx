import { useCallback, useEffect, useMemo, useState } from 'react'
import { JsonTree } from './components/JsonTree'
import { SAMPLE_RELAXED_JSON } from './data/sampleInput'
import { parseUserJson } from './lib/parseUserJson'
import './App.css'

type Tab = 'tree' | 'pretty' | 'minify'

function useDebounced<T>(value: T, ms: number): T {
  const [d, setD] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setD(value), ms)
    return () => window.clearTimeout(t)
  }, [value, ms])
  return d
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function App() {
  const [raw, setRaw] = useState('')
  const [tab, setTab] = useState<Tab>('tree')
  const [copyHint, setCopyHint] = useState<string | null>(null)
  const debounced = useDebounced(raw, 400)
  const [parseInput, setParseInput] = useState('')

  useEffect(() => {
    setParseInput(debounced)
  }, [debounced])

  const result = useMemo(() => parseUserJson(parseInput), [parseInput])

  const pretty = useMemo(() => {
    if (!result.ok) return ''
    try {
      return JSON.stringify(result.value, null, 2)
    } catch {
      return ''
    }
  }, [result])

  const minified = useMemo(() => {
    if (!result.ok) return ''
    try {
      return JSON.stringify(result.value)
    } catch {
      return ''
    }
  }, [result])

  const validateNow = useCallback(() => {
    setParseInput(raw)
  }, [raw])

  const loadSample = useCallback(() => {
    setRaw(SAMPLE_RELAXED_JSON)
    setParseInput(SAMPLE_RELAXED_JSON)
    setTab('tree')
  }, [])

  const onCopy = useCallback(
    async (text: string) => {
      const ok = await copyText(text)
      setCopyHint(ok ? '已复制到剪贴板' : '复制失败，请手动选择文本')
      window.setTimeout(() => setCopyHint(null), 2000)
    },
    [],
  )

  const errDetail =
    result.ok || !result.error
      ? ''
      : [
          result.error.message,
          result.error.lineNumber != null
            ? `第 ${result.error.lineNumber} 行`
            : '',
          result.error.columnNumber != null
            ? `第 ${result.error.columnNumber} 列`
            : '',
        ]
          .filter(Boolean)
          .join(' · ')

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">JSON 校验与格式化</h1>
        <p className="app__subtitle">
          支持单引号、尾随逗号等 JSON5 语法；自动将引号外的{' '}
          <code>True</code> / <code>False</code> 转为合法布尔值，<code>None</code>{' '}
          转为空字符串。数据仅在浏览器本地处理。
        </p>
      </header>

      <div className="app__grid">
        <section className="app__panel app__panel--input">
          <div className="app__toolbar">
            <label className="app__label" htmlFor="json-input">
              输入
            </label>
            <div className="app__actions">
              <button type="button" className="btn" onClick={validateNow}>
                立即校验
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={raw.length === 0}
                onClick={() => onCopy(raw)}
              >
                复制源数据
              </button>
              <span className="app__hint">输入后约 0.4s 自动校验</span>
            </div>
          </div>
          <div className="app__sample-row">
            <span className="app__sample-label">快速试用</span>
            <button
              type="button"
              className="btn btn--ghost app__sample-btn"
              onClick={loadSample}
            >
              载入示例数据
            </button>
            <span className="app__sample-desc">
              含单引号、True/False/None、尾随逗号与嵌套，载入后自动校验并切到树视图
            </span>
          </div>
          <textarea
            id="json-input"
            className="app__textarea"
            spellCheck={false}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={`示例：{'a': 1, b: False,}`}
            rows={18}
          />
        </section>

        <section className="app__panel app__panel--output">
          <div
            className={`app__status ${
              raw.trim() === ''
                ? 'app__status--idle'
                : result.ok
                  ? 'app__status--ok'
                  : 'app__status--err'
            }`}
            role="status"
          >
            {raw.trim() === ''
              ? '等待输入'
              : result.ok
                ? '解析成功'
                : '解析失败'}
            {!result.ok && errDetail ? `：${errDetail}` : null}
          </div>

          <div className="app__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'tree'}
              className={`app__tab ${tab === 'tree' ? 'app__tab--active' : ''}`}
              onClick={() => setTab('tree')}
            >
              树视图
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'pretty'}
              className={`app__tab ${tab === 'pretty' ? 'app__tab--active' : ''}`}
              onClick={() => setTab('pretty')}
            >
              格式化
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'minify'}
              className={`app__tab ${tab === 'minify' ? 'app__tab--active' : ''}`}
              onClick={() => setTab('minify')}
            >
              压缩一行
            </button>
          </div>

          <div className="app__tab-panel">
            {tab === 'tree' && (
              <div className="app__scroll" role="tabpanel">
                {result.ok ? (
                  <JsonTree value={result.value} defaultExpandDepth={1} />
                ) : (
                  <p className="app__placeholder">解析成功后将在此展示可折叠树。</p>
                )}
              </div>
            )}
            {tab === 'pretty' && (
              <div className="app__scroll" role="tabpanel">
                {result.ok ? (
                  <>
                    <div className="app__row-actions">
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => onCopy(pretty)}
                      >
                        复制
                      </button>
                    </div>
                    <pre className="app__pre">{pretty}</pre>
                  </>
                ) : (
                  <p className="app__placeholder">解析成功后将显示 2 空格缩进的 JSON。</p>
                )}
              </div>
            )}
            {tab === 'minify' && (
              <div className="app__scroll" role="tabpanel">
                {result.ok ? (
                  <>
                    <div className="app__row-actions">
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => onCopy(minified)}
                      >
                        复制
                      </button>
                    </div>
                    <pre className="app__pre app__pre--min">{minified}</pre>
                  </>
                ) : (
                  <p className="app__placeholder">解析成功后将显示单行压缩 JSON。</p>
                )}
              </div>
            )}
          </div>

          {copyHint ? <div className="app__toast">{copyHint}</div> : null}
        </section>
      </div>
    </div>
  )
}

export default App
