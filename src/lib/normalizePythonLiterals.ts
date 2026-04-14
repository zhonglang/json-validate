function isIdentChar(c: string): boolean {
  return /[A-Za-z0-9_]/.test(c)
}

/**
 * 在字符串字面量与注释之外，将独立的 `True` / `False` 替换为 JSON5 可解析的 `true` / `false`。
 */
export function normalizePythonLiterals(input: string): string {
  const out: string[] = []
  let i = 0
  let inDouble = false
  let inSingle = false
  let escape = false

  while (i < input.length) {
    const c = input[i]!

    if (escape) {
      out.push(c)
      escape = false
      i++
      continue
    }

    if (inDouble) {
      out.push(c)
      if (c === '\\') escape = true
      else if (c === '"') inDouble = false
      i++
      continue
    }

    if (inSingle) {
      out.push(c)
      if (c === '\\') escape = true
      else if (c === "'") inSingle = false
      i++
      continue
    }

    if (c === '/' && input[i + 1] === '/') {
      while (i < input.length && input[i] !== '\n') {
        out.push(input[i]!)
        i++
      }
      continue
    }

    if (c === '/' && input[i + 1] === '*') {
      out.push(c, input[i + 1]!)
      i += 2
      while (i < input.length) {
        const ch = input[i]!
        out.push(ch)
        if (ch === '*' && input[i + 1] === '/') {
          out.push('/')
          i += 2
          break
        }
        i++
      }
      continue
    }

    if (c === '"') {
      inDouble = true
      out.push(c)
      i++
      continue
    }
    if (c === "'") {
      inSingle = true
      out.push(c)
      i++
      continue
    }

    const prev = i > 0 ? input[i - 1]! : ''
    const isWordStart = i === 0 || !isIdentChar(prev)

    if (isWordStart) {
      if (input.slice(i, i + 4) === 'True') {
        const after = input[i + 4]
        if (after === undefined || !isIdentChar(after)) {
          out.push('true')
          i += 4
          continue
        }
      }
      if (input.slice(i, i + 5) === 'False') {
        const after = input[i + 5]
        if (after === undefined || !isIdentChar(after)) {
          out.push('false')
          i += 5
          continue
        }
      }
    }

    out.push(c)
    i++
  }

  return out.join('')
}
