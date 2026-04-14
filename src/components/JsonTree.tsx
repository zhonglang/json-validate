import { useCallback, useState } from 'react'

const STRING_PREVIEW = 64
/** 每层缩进（px），与 JSON 常见 2 空格视觉接近但更易辨认层级 */
const JSON_TREE_INDENT_PX = 24

function previewString(s: string): string {
  const oneLine = s.replace(/\s+/g, ' ')
  if (oneLine.length <= STRING_PREVIEW) return oneLine
  return `${oneLine.slice(0, STRING_PREVIEW)}…`
}

export type ExpandPreset = 'default' | 'all' | 'none'

function initialOpen(
  preset: ExpandPreset,
  depth: number,
  defaultExpandDepth: number,
): boolean {
  if (preset === 'all') return true
  if (preset === 'none') return false
  return depth < defaultExpandDepth
}

type NodeProps = {
  value: unknown
  name?: string
  depth: number
  defaultExpandDepth: number
  expandPreset: ExpandPreset
  trailComma?: boolean
}

function JsonNode({
  value,
  name,
  depth,
  defaultExpandDepth,
  expandPreset,
  trailComma,
}: NodeProps) {
  const [open, setOpen] = useState(() =>
    initialOpen(expandPreset, depth, defaultExpandDepth),
  )

  const toggle = useCallback(() => setOpen((o) => !o), [])

  const pad = (d: number) => ({ paddingLeft: d * JSON_TREE_INDENT_PX })

  const punct = (ch: string) => (
    <span className="json-tree__punct">{ch}</span>
  )

  const keyColon =
    name !== undefined ? (
      <>
        <span className="json-tree__key">{JSON.stringify(name)}</span>
        {punct(':')}
        <span className="json-tree__gap"> </span>
      </>
    ) : null

  const comma = trailComma ? punct(',') : null

  if (value === null) {
    return (
      <div className="json-tree__line" style={pad(depth)}>
        {keyColon}
        <span className="json-tree__null">null</span>
        {comma}
      </div>
    )
  }

  if (typeof value === 'boolean') {
    return (
      <div className="json-tree__line" style={pad(depth)}>
        {keyColon}
        <span className="json-tree__bool">{String(value)}</span>
        {comma}
      </div>
    )
  }

  if (typeof value === 'number') {
    return (
      <div className="json-tree__line" style={pad(depth)}>
        {keyColon}
        <span className="json-tree__num">{String(value)}</span>
        {comma}
      </div>
    )
  }

  if (typeof value === 'string') {
    return (
      <div className="json-tree__line" style={pad(depth)}>
        {keyColon}
        <span className="json-tree__str">"{previewString(value)}"</span>
        {comma}
      </div>
    )
  }

  if (Array.isArray(value)) {
    const n = value.length
    if (!open) {
      return (
        <button
          type="button"
          className="json-tree__line-toggle json-tree__line"
          style={pad(depth)}
          onClick={toggle}
          aria-expanded={false}
          aria-label="展开数组"
        >
          {keyColon}
          {punct('[')}
          <span className="json-tree__fold-hint"> … {n} 项 </span>
          {punct(']')}
          {comma}
        </button>
      )
    }

    return (
      <div className="json-tree__nest">
        <button
          type="button"
          className="json-tree__line-toggle json-tree__line"
          style={pad(depth)}
          onClick={toggle}
          aria-expanded
          aria-label="收起数组"
        >
          {keyColon}
          {punct('[')}
        </button>
        {value.map((item, idx) => (
          <JsonNode
            key={idx}
            depth={depth + 1}
            defaultExpandDepth={defaultExpandDepth}
            expandPreset={expandPreset}
            value={item}
            trailComma={idx < value.length - 1}
          />
        ))}
        <button
          type="button"
          className="json-tree__line-toggle json-tree__line"
          style={pad(depth)}
          onClick={toggle}
          aria-expanded
          aria-label="收起数组"
        >
          {punct(']')}
          {comma}
        </button>
      </div>
    )
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value as object)
    const n = keys.length

    if (!open) {
      return (
        <button
          type="button"
          className="json-tree__line-toggle json-tree__line"
          style={pad(depth)}
          onClick={toggle}
          aria-expanded={false}
          aria-label="展开对象"
        >
          {keyColon}
          {punct('{')}
          <span className="json-tree__fold-hint"> … {n} 个键 </span>
          {punct('}')}
          {comma}
        </button>
      )
    }

    return (
      <div className="json-tree__nest">
        <button
          type="button"
          className="json-tree__line-toggle json-tree__line"
          style={pad(depth)}
          onClick={toggle}
          aria-expanded
          aria-label="收起对象"
        >
          {keyColon}
          {punct('{')}
        </button>
        {keys.map((k, i) => (
          <JsonNode
            key={k}
            name={k}
            value={(value as Record<string, unknown>)[k]}
            depth={depth + 1}
            defaultExpandDepth={defaultExpandDepth}
            expandPreset={expandPreset}
            trailComma={i < keys.length - 1}
          />
        ))}
        <button
          type="button"
          className="json-tree__line-toggle json-tree__line"
          style={pad(depth)}
          onClick={toggle}
          aria-expanded
          aria-label="收起对象"
        >
          {punct('}')}
          {comma}
        </button>
      </div>
    )
  }

  return (
    <div className="json-tree__line" style={pad(depth)}>
      {keyColon}
      <span className="json-tree__unknown">{String(value)}</span>
      {comma}
    </div>
  )
}

const TREE_VALUE_CHAR_LIMIT = 500_000

export type JsonTreeProps = {
  value: unknown
  defaultExpandDepth?: number
}

export function JsonTree({ value, defaultExpandDepth = 1 }: JsonTreeProps) {
  const [bulkKey, setBulkKey] = useState(0)
  const [expandPreset, setExpandPreset] = useState<ExpandPreset>('default')

  const expandAll = useCallback(() => {
    setExpandPreset('all')
    setBulkKey((k) => k + 1)
  }, [])

  const collapseAll = useCallback(() => {
    setExpandPreset('none')
    setBulkKey((k) => k + 1)
  }, [])

  let serialized = ''
  try {
    serialized = JSON.stringify(value)
  } catch {
    return (
      <p className="json-tree__warn">该值无法序列化，无法展示树视图。</p>
    )
  }

  if (serialized.length > TREE_VALUE_CHAR_LIMIT) {
    return (
      <p className="json-tree__warn">
        数据体积较大（约 {serialized.length.toLocaleString()} 字符），为保持界面流畅已隐藏树视图。请使用「格式化」或「压缩」标签页查看。
      </p>
    )
  }

  return (
    <div className="json-tree">
      <div className="json-tree__toolbar">
        <div className="json-tree__toolbar-btns">
          <button type="button" className="btn btn--ghost" onClick={expandAll}>
            全部展开
          </button>
          <button type="button" className="btn btn--ghost" onClick={collapseAll}>
            全部收起
          </button>
        </div>
        <p className="json-tree__hint">
          每一层对象或数组：点击带 <code>{"{}"}</code> 或 <code>{"[]"}</code>{' '}
          的整行（含键名的行首行，或仅括号与逗号的行尾行）即可单独展开或收起。
        </p>
      </div>
      <div key={bulkKey} className="json-tree__root">
        <JsonNode
          value={value}
          depth={0}
          defaultExpandDepth={defaultExpandDepth}
          expandPreset={expandPreset}
        />
      </div>
    </div>
  )
}
