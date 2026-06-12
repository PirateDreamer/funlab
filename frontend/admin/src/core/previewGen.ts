/**
 * 预览专用代码生成器
 *
 * 生成纯 React.createElement 调用（非 JSX），无需 Babel 编译，直接在 iframe 中运行。
 */

import type {
  PageSchema,
  ComponentNode,
  BindValue,
  JSExpression,
  JSFunction,
  StateVariable,
} from './protocol'

// ============ 工具函数 ============

function isJSExpression(v: unknown): v is JSExpression {
  return typeof v === 'object' && v !== null && (v as Record<string, unknown>).type === 'JSExpression'
}

function isJSFunction(v: unknown): v is JSFunction {
  return typeof v === 'object' && v !== null && (v as Record<string, unknown>).type === 'JSFunction'
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
}

function escapeStr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')
}

function stringifyValue(v: unknown): string {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'boolean') return String(v)
  if (typeof v === 'number') return String(v)
  if (typeof v === 'string') return `'${escapeStr(v)}'`
  return JSON.stringify(v)
}

/** 将 BindValue 转为 JS 表达式代码 */
function bindValueToJS(value: BindValue): string {
  if (isJSExpression(value)) return `(${value.value})`
  if (isJSFunction(value)) return value.value
  return stringifyValue(value)
}

// ============ 节点 → createElement ============

function nodeToCreateElement(node: ComponentNode): string {
  const tag = `'${node.componentName}'`

  // props
  const propEntries: string[] = []
  if (node.props) {
    for (const [k, v] of Object.entries(node.props)) {
      propEntries.push(`${k}: ${bindValueToJS(v)}`)
    }
  }
  if (node.style) {
    const styleEntries = Object.entries(node.style).map(([k, v]) => {
      const camelKey = toCamelCase(k)
      let val = v
      if (camelKey === 'backgroundImage' && typeof val === 'string' && val && !val.startsWith('url(')) {
        val = `url("${val}")`
      }
      return `${camelKey}: ${stringifyValue(val)}`
    })
    propEntries.push(`style: { ${styleEntries.join(', ')} }`)
  }
  if (node.className) {
    propEntries.push(`className: '${escapeStr(node.className)}'`)
  }

  // events
  if (node.events) {
    for (const ev of node.events) {
      const handler = isJSFunction(ev.handler) ? ev.handler.value : ev.handler.value
      propEntries.push(`${ev.event}: ${handler}`)
    }
  }

  // key for loops
  if (node.loop) {
    propEntries.push(`key: index`)
  }

  const propsStr = propEntries.length > 0 ? `{ ${propEntries.join(', ')} }` : 'null'

  // children
  const childExprs: string[] = []
  if (node.children) {
    for (const child of node.children) {
      if (typeof child === 'string') {
        childExprs.push(`'${escapeStr(child)}'`)
      } else {
        childExprs.push(nodeToCreateElement(child))
      }
    }
  }

  // slots (default → children)
  if (node.slots) {
    for (const [, slotNodes] of Object.entries(node.slots)) {
      for (const slotNode of slotNodes) {
        childExprs.push(nodeToCreateElement(slotNode))
      }
    }
  }

  const allArgs = [tag, propsStr, ...childExprs].join(', ')
  let result = `React.createElement(${allArgs})`

  // 条件渲染
  if (node.condition) {
    result = `(${node.condition.value}) ? ${result} : null`
  }

  // 循环渲染
  if (node.loop) {
    const itemVar = node.loop.item || 'item'
    const indexVar = node.loop.index || 'index'
    result = `(${node.loop.data.value}).map((${itemVar}, ${indexVar}) => ${result})`
  }

  return result
}

// ============ State 生成 ============

function stateToJS(state?: StateVariable[]): string {
  if (!state || state.length === 0) return ''
  return state
    .map((v) => {
      const initVal = bindValueToJS(v.value)
      return `    const [${v.name}, set${v.name.charAt(0).toUpperCase() + v.name.slice(1)}] = React.useState(${initVal})`
    })
    .join('\n')
}

// ============ 完整组件生成 ============

/**
 * 生成预览用的纯 JS 代码（React.createElement，无需 Babel）
 */
export function generatePreviewCode(schema: PageSchema): string {
  const lines: string[] = []

  // state
  const stateCode = stateToJS(schema.state)

  // JSX → createElement
  const renderCode = nodeToCreateElement(schema.componentTree)

  // 组装函数组件
  lines.push(`function Preview() {`)
  if (stateCode) lines.push(stateCode)

  // dataSources → useEffect
  if (schema.dataSources && schema.dataSources.length > 0) {
    lines.push(`    React.useEffect(() => {`)
    for (const ds of schema.dataSources) {
      lines.push(`      (async () => {`)
      lines.push(`        try {`)
      lines.push(`          const res = await fetch(${JSON.stringify(ds.config.url)})`)
      lines.push(`          const data = await res.json()`)
      lines.push(`          set${ds.name.charAt(0).toUpperCase() + ds.name.slice(1)}(${ds.dataHandler ? `(${ds.dataHandler.value})(data)` : 'data'})`)
      lines.push(`        } catch (e) { console.error(e) }`)
      lines.push(`      })()`)
    }
    lines.push(`    }, [])`)
  }

  lines.push(`    return (${renderCode})`)
  lines.push(`}`)

  lines.push(`const root = ReactDOM.createRoot(document.getElementById('root'))`)
  lines.push(`root.render(React.createElement(Preview))`)

  return lines.join('\n')
}
