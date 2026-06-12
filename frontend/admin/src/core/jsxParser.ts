/**
 * JSX 代码 → ComponentNode 解析器
 *
 * 将简单的 JSX 代码片段解析为 DSL ComponentNode 树。
 * 支持：标签、属性（字符串/数字/布尔/表达式）、子节点、自闭合标签、嵌套。
 */

import type { ComponentNode, ComponentProps, BindValue } from './protocol'

/** 生成唯一 ID */
function genId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** 解析结果 */
export interface ParseResult {
  success: boolean
  node?: ComponentNode
  error?: string
}

// ============ Tokenizer ============

type TokenType = 'TAG_OPEN' | 'TAG_CLOSE' | 'TAG_SELF_CLOSE' | 'ATTR_NAME' | 'ATTR_VALUE'
  | 'TEXT' | 'EXPR' | 'SLASH' | 'GT' | 'EQ' | 'STRING' | 'EOF'

interface Token {
  type: TokenType
  value: string
  pos: number
}

/** 简易 JSX tokenizer */
function tokenize(src: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < src.length) {
    // 跳过空白
    if (/\s/.test(src[i])) { i++; continue }

    // JSX 表达式 {...}
    if (src[i] === '{') {
      let depth = 1
      let j = i + 1
      while (j < src.length && depth > 0) {
        if (src[j] === '{') depth++
        if (src[j] === '}') depth--
        j++
      }
      tokens.push({ type: 'EXPR', value: src.slice(i + 1, j - 1).trim(), pos: i })
      i = j
      continue
    }

    // 标签开始 </
    if (src[i] === '<' && src[i + 1] === '/') {
      tokens.push({ type: 'TAG_CLOSE', value: '</', pos: i })
      i += 2
      continue
    }

    // 标签开始 <
    if (src[i] === '<') {
      tokens.push({ type: 'TAG_OPEN', value: '<', pos: i })
      i++
      continue
    }

    // 自闭合 />
    if (src[i] === '/' && src[i + 1] === '>') {
      tokens.push({ type: 'TAG_SELF_CLOSE', value: '/>', pos: i })
      i += 2
      continue
    }

    // 斜杠
    if (src[i] === '/') {
      tokens.push({ type: 'SLASH', value: '/', pos: i })
      i++
      continue
    }

    // >
    if (src[i] === '>') {
      tokens.push({ type: 'GT', value: '>', pos: i })
      i++
      continue
    }

    // =
    if (src[i] === '=') {
      tokens.push({ type: 'EQ', value: '=', pos: i })
      i++
      continue
    }

    // 字符串 "..." 或 '...'
    if (src[i] === '"' || src[i] === "'") {
      const quote = src[i]
      let j = i + 1
      while (j < src.length && src[j] !== quote) {
        if (src[j] === '\\') j++ // 跳过转义
        j++
      }
      tokens.push({ type: 'STRING', value: src.slice(i + 1, j), pos: i })
      i = j + 1
      continue
    }

    // 标签名或属性名（标识符）
    if (/[a-zA-Z_$]/.test(src[i])) {
      let j = i
      while (j < src.length && /[a-zA-Z0-9_$.-]/.test(src[j])) j++
      const word = src.slice(i, j)
      tokens.push({ type: 'ATTR_NAME', value: word, pos: i })
      i = j
      continue
    }

    // 其他字符当作文本
    let j = i
    while (j < src.length && src[j] !== '<' && src[j] !== '{') j++
    if (j > i) {
      tokens.push({ type: 'TEXT', value: src.slice(i, j).trim(), pos: i })
      i = j
    } else {
      i++ // 跳过无法识别的字符
    }
  }

  tokens.push({ type: 'EOF', value: '', pos: i })
  return tokens
}

// ============ Parser ============

class JSXParser {
  private tokens: Token[]
  private pos: number = 0

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  peek(): Token {
    return this.tokens[this.pos]
  }

  advance(): Token {
    const tok = this.tokens[this.pos]
    this.pos++
    return tok
  }

  private expect(type: TokenType): Token {
    const tok = this.advance()
    if (tok.type !== type) {
      throw new Error(`Expected ${type}, got ${tok.type} at position ${tok.pos}`)
    }
    return tok
  }

  /** 解析属性值 */
  private parseAttrValue(): BindValue {
    const tok = this.peek()

    if (tok.type === 'STRING') {
      this.advance()
      return tok.value
    }

    if (tok.type === 'EXPR') {
      this.advance()
      const expr = tok.value
      // 尝试识别简单值
      if (expr === 'true') return true
      if (expr === 'false') return false
      if (/^\d+$/.test(expr)) return Number(expr)
      if (/^\d+\.\d+$/.test(expr)) return Number(expr)
      // 作为表达式
      return { type: 'JSExpression', value: expr }
    }

    // 布尔简写（无值属性）
    return true
  }

  /** 解析标签属性 */
  private parseAttributes(): ComponentProps {
    const props: ComponentProps = {}

    while (this.peek().type === 'ATTR_NAME') {
      const name = this.advance().value

      if (this.peek().type === 'EQ') {
        this.advance() // 跳过 =
        props[name] = this.parseAttrValue()
      } else {
        // 布尔简写 disabled → disabled={true}
        props[name] = true
      }
    }

    return props
  }

  /** 解析一个元素节点 */
  parseElement(): ComponentNode {
    this.expect('TAG_OPEN')

    const nameTok = this.expect('ATTR_NAME')
    const componentName = nameTok.value
    const props = this.parseAttributes()

    // 自闭合 />
    if (this.peek().type === 'TAG_SELF_CLOSE') {
      this.advance()
      return {
        id: genId(),
        componentName,
        props: Object.keys(props).length > 0 ? props : undefined,
      }
    }

    // >
    this.expect('GT')

    // 解析子节点
    const children: (ComponentNode | string)[] = []

    while (this.peek().type !== 'TAG_CLOSE' && this.peek().type !== 'EOF') {
      const tok = this.peek()

      if (tok.type === 'TAG_OPEN') {
        children.push(this.parseElement())
      } else if (tok.type === 'TEXT') {
        this.advance()
        const text = tok.value.trim()
        if (text) children.push(text)
      } else if (tok.type === 'EXPR') {
        this.advance()
        // 表达式子节点暂跳过
      } else {
        this.advance() // 跳过未知 token
      }
    }

    // 关闭标签 </name>
    if (this.peek().type === 'TAG_CLOSE') {
      this.advance() // </
      if (this.peek().type === 'ATTR_NAME') {
        this.advance() // 标签名
      }
      if (this.peek().type === 'GT') {
        this.advance() // >
      }
    }

    // 分离 string children 和 ComponentNode children
    const hasComponentChildren = children.some((c) => typeof c !== 'string')
    const hasStringChildren = children.some((c) => typeof c === 'string')

    let finalChildren: ComponentNode[] | string[] | undefined
    if (hasComponentChildren && !hasStringChildren) {
      finalChildren = children.filter((c): c is ComponentNode => typeof c !== 'string')
    } else if (!hasComponentChildren && hasStringChildren) {
      finalChildren = children.filter((c): c is string => typeof c === 'string')
    } else if (children.length > 0) {
      // 混合情况：将 string 包装为 span
      finalChildren = children.map((c) => {
        if (typeof c === 'string') {
          return { id: genId(), componentName: 'span', children: [c] } as ComponentNode
        }
        return c
      })
    }

    return {
      id: genId(),
      componentName,
      props: Object.keys(props).length > 0 ? props : undefined,
      children: finalChildren,
    }
  }
}

/**
 * 将 JSX 代码字符串解析为 ComponentNode
 *
 * @example
 * parseJSX('<div className="card"><Button type="primary">提交</Button></div>')
 */
export function parseJSX(code: string): ParseResult {
  try {
    // 预处理：去掉 export default、函数包裹等
    let cleanCode = code.trim()
    cleanCode = cleanCode.replace(/^export\s+default\s+/, '')
    cleanCode = cleanCode.replace(/^function\s+\w+\s*\(\)\s*\{[\s\n]*return\s*\(?\s*/, '')
    cleanCode = cleanCode.replace(/\s*\)?[\s\n]*\}$/, '')
    // 去掉最外层的 <> Fragment 包裹
    if (cleanCode.startsWith('<>') && cleanCode.endsWith('</>')) {
      cleanCode = cleanCode.slice(2, -3).trim()
    }

    const tokens = tokenize(cleanCode)
    const parser = new JSXParser(tokens)
    const node = parser.parseElement()

    return { success: true, node }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * 将 JSX 代码解析为多个 ComponentNode（处理 Fragment 包裹的多个根节点）
 */
export function parseJSXMultiple(code: string): { success: boolean; nodes: ComponentNode[]; error?: string } {
  try {
    let cleanCode = code.trim()
    cleanCode = cleanCode.replace(/^export\s+default\s+/, '')
    cleanCode = cleanCode.replace(/^function\s+\w+\s*\(\)\s*\{[\s\n]*return\s*\(?\s*/, '')
    cleanCode = cleanCode.replace(/\s*\)?[\s\n]*\}$/, '')

    // 去掉 Fragment 包裹
    if (cleanCode.startsWith('<>') && cleanCode.endsWith('</>')) {
      cleanCode = cleanCode.slice(2, -3).trim()
    }

    const tokens = tokenize(cleanCode)
    const parser = new JSXParser(tokens)
    const nodes: ComponentNode[] = []

    while (parser.peek().type !== 'EOF') {
      if (parser.peek().type === 'TAG_OPEN') {
        nodes.push(parser.parseElement())
      } else if (parser.peek().type === 'TEXT') {
        const text = parser.advance().value.trim()
        if (text) {
          nodes.push({ id: genId(), componentName: 'span', children: [text] })
        }
      } else {
        parser.advance()
      }
    }

    return { success: true, nodes }
  } catch (err) {
    return {
      success: false,
      nodes: [],
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
