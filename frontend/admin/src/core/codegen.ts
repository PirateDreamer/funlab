/**
 * DSL → React 代码生成器
 *
 * 将 OpenTiny TinyEngine DSL Schema 转换为可运行的 React 组件源代码。
 */

import type {
  PageSchema,
  AppSchema,
  BlockSchema,
  ComponentNode,
  ComponentProps,
  BindValue,
  JSExpression,
  JSFunction,
  EventHandler,
  StateVariable,
  DataSource,
  MethodDefinition,
  LifeCycles,
} from './protocol'

// ============ 工具函数 ============

const INDENT = '  '

function indent(level: number): string {
  return INDENT.repeat(level)
}

/** 判断值是否为 JSExpression */
function isJSExpression(v: unknown): v is JSExpression {
  return typeof v === 'object' && v !== null && (v as Record<string, unknown>).type === 'JSExpression'
}

/** 判断值是否为 JSFunction */
function isJSFunction(v: unknown): v is JSFunction {
  return typeof v === 'object' && v !== null && (v as Record<string, unknown>).type === 'JSFunction'
}

/** 字符串化值，用于 JSX 属性 */
function stringifyValue(v: unknown): string {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'boolean') return String(v)
  if (typeof v === 'number') return String(v)
  if (typeof v === 'string') return JSON.stringify(v)
  return JSON.stringify(v)
}

/** 转义 JS 函数体中的特殊字符 */
function sanitizeFunctionBody(body: string): string {
  return body.trim()
}

/** 首字母大写 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ============ 值绑定生成 ============

/** 判断值是否为 JSResource */
function isJSResource(v: unknown): v is { type: 'JSResource'; id: string } {
  return typeof v === 'object' && v !== null && (v as Record<string, unknown>).type === 'JSResource'
}

/** 将 BindValue 转为 JSX 表达式代码 */
function generateBindValue(value: BindValue): string {
  if (isJSExpression(value)) {
    return value.value
  }
  if (isJSFunction(value)) {
    return value.value
  }
  if (isJSResource(value)) {
    // JSResource → 引用 import 的资源变量
    return `__resource_${sanitizeVarName(value.id)}`
  }
  return stringifyValue(value)
}

/** 收集 BindValue 中的 JSResource 引用 */
function collectResourcesFromValue(value: BindValue, acc: Set<string>): void {
  if (isJSResource(value)) {
    acc.add(value.id)
  }
}

/** 递归收集组件树中所有 JSResource 引用 */
function collectResources(node: ComponentNode, acc: Set<string>): void {
  if (node.props) {
    for (const v of Object.values(node.props)) {
      collectResourcesFromValue(v, acc)
    }
  }
  if (node.host) {
    for (const v of Object.values(node.host)) {
      collectResourcesFromValue(v, acc)
    }
  }
  if (node.children) {
    for (const child of node.children) {
      if (typeof child !== 'string') collectResources(child, acc)
    }
  }
  if (node.slots) {
    for (const nodes of Object.values(node.slots)) {
      for (const n of nodes) collectResources(n, acc)
    }
  }
}

/** 清理变量名（移除非法字符） */
function sanitizeVarName(id: string): string {
  return id.replace(/[^a-zA-Z0-9_$]/g, '_')
}

// ============ Props 生成 ============

/** 生成单个 prop 的 JSX 属性字符串 */
function generatePropEntry(key: string, value: BindValue): string {
  // 布尔 true 简写: disabled={true} → disabled
  if (value === true) return key
  if (value === false) return ''

  // 表达式绑定
  if (isJSExpression(value) || isJSFunction(value)) {
    return `${key}={${generateBindValue(value)}}`
  }

  // 字符串直接写
  if (typeof value === 'string') {
    return `${key}=${JSON.stringify(value)}`
  }

  // 数字/对象/数组
  return `${key}={${generateBindValue(value)}}`
}

/** 将 ComponentProps 转为 JSX 属性字符串（含前导空格） */
function generateProps(props?: ComponentProps): string {
  if (!props || Object.keys(props).length === 0) return ''
  const entries = Object.entries(props)
    .map(([k, v]) => generatePropEntry(k, v))
    .filter(Boolean)
  if (entries.length === 0) return ''
  return ' ' + entries.join(' ')
}

// ============ 事件生成 ============

/** 事件名映射：DSL 事件名 → React 事件名 */
function toReactEventName(event: string): string {
  // 如果已经是 onXxx 格式，直接返回
  if (event.startsWith('on')) return event
  // click → onClick, change → onChange, submit → onSubmit
  return 'on' + event.charAt(0).toUpperCase() + event.slice(1)
}

/** 生成事件处理器 JSX */
function generateEvents(events?: EventHandler[]): string {
  if (!events || events.length === 0) return ''
  return events
    .map((ev) => {
      const reactEvent = toReactEventName(ev.event)
      let handlerBody: string

      if (isJSFunction(ev.handler)) {
        handlerBody = ev.handler.value
      } else {
        handlerBody = ev.handler.value
      }

      // 包装 preventDefault / stopPropagation
      if (ev.preventDefault || ev.stopPropagation) {
        const orig = handlerBody
        handlerBody = `(e) => {${ev.preventDefault ? ' e.preventDefault();' : ''}${ev.stopPropagation ? ' e.stopPropagation();' : ''} (${orig})(e); }`
      }

      return `${reactEvent}={${handlerBody}}`
    })
    .join(' ')
}

// ============ 样式生成 ============

/** CSS 属性名转 camelCase: font-size → fontSize, background-color → backgroundColor */
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
}

/** CSS 属性值自动修正 */
function normalizeStyleValue(key: string, value: string | number): string | number {
  if (typeof value !== 'string') return value
  // background-image 自动包裹 url()
  if (key === 'backgroundImage' && value && !value.startsWith('url(')) {
    return `url("${value}")`
  }
  return value
}

/** 生成 style 属性 */
function generateStyle(style?: Record<string, string | number>): string {
  if (!style || Object.keys(style).length === 0) return ''
  const entries = Object.entries(style)
    .map(([k, v]) => {
      const camelKey = toCamelCase(k)
      const val = normalizeStyleValue(camelKey, v)
      return `${JSON.stringify(camelKey)}: ${JSON.stringify(val)}`
    })
    .join(', ')
  return ` style={{${entries}}}`
}

// ============ JSX 生成（递归） ============

/** 将组件树节点递归转为 JSX 代码 */
function generateJSX(node: ComponentNode, level: number = 0): string {
  const pad = indent(level)

  // 1. 标签名
  const tagName = node.componentName

  // 2. 属性拼接
  const propStr = generateProps(node.props)
  const eventStr = generateEvents(node.events)
  const styleStr = generateStyle(node.style)
  const classNameStr = node.className ? ` className=${JSON.stringify(node.className)}` : ''
  const refStr = node.ref ? ` ref={${node.ref}}` : ''
  const hostStr = node.host
    ? ' ' + Object.entries(node.host)
        .map(([k, v]) => generatePropEntry(k, v))
        .filter(Boolean)
        .join(' ')
    : ''

  const attrs = `${propStr}${eventStr}${styleStr}${classNameStr}${refStr}${hostStr}`

  // 3. 子节点
  const childrenCode = generateChildren(node, level + 1)

  // 4. 插槽处理 —— default → children，命名 → render props
  const { childrenCode: slotChildren, slotProps } = generateSlots(node.slots, level + 1)

  // 5. 组装基础 JSX
  const effectiveChildren = childrenCode || slotChildren
  const allAttrs = slotProps ? `${attrs} ${slotProps}` : attrs
  const selfClosing = !effectiveChildren && !node.children?.length
  let jsx: string

  if (selfClosing) {
    jsx = `${pad}<${tagName}${allAttrs} />`
  } else {
    // 如果子内容较短，内联显示
    if (effectiveChildren.length < 60 && !effectiveChildren.includes('\n')) {
      jsx = `${pad}<${tagName}${allAttrs}>${effectiveChildren}</${tagName}>`
    } else {
      jsx = `${pad}<${tagName}${allAttrs}>\n${effectiveChildren}\n${pad}</${tagName}>`
    }
  }

  // 6. 条件渲染包装
  if (node.condition) {
    const condExpr = node.condition.value
    if (node.condition.preserveNode) {
      jsx = `${pad}<div style={{ display: ${condExpr} ? 'contents' : 'none' }}>\n${jsx}\n${pad}</div>`
    } else {
      jsx = `${pad}{${condExpr} && (\n${jsx}\n${pad})}`
    }
  }

  // 7. 循环渲染包装
  if (node.loop) {
    const dataExpr = node.loop.data.value
    const itemVar = node.loop.item || 'item'
    const indexVar = node.loop.index || 'index'
    const keyExpr = node.loop.key || indexVar
    jsx = `${pad}{${dataExpr}.map((${itemVar}, ${indexVar}) => (\n${jsx.replace(/(<\w+)/, `$1 key={${keyExpr}}`)}\n${pad}))}`
  }

  return jsx
}

/** 生成子节点代码 */
function generateChildren(node: ComponentNode, level: number): string {
  if (!node.children || node.children.length === 0) return ''
  return node.children
    .map((child) => {
      if (typeof child === 'string') {
        return indent(level) + child
      }
      return generateJSX(child, level)
    })
    .join('\n')
}

/** 生成插槽代码（default 插槽 → children，命名插槽 → render props） */
function generateSlots(
  slots: Record<string, ComponentNode[]> | undefined,
  level: number
): { childrenCode: string; slotProps: string } {
  if (!slots || Object.keys(slots).length === 0) return { childrenCode: '', slotProps: '' }

  const entries = Object.entries(slots)
  // 只有 default 插槽 → 作为 children
  if (entries.length === 1 && entries[0][0] === 'default') {
    const code = entries[0][1].map((n) => generateJSX(n, level)).join('\n')
    return { childrenCode: code, slotProps: '' }
  }

  // 有命名插槽 → default 作为 children，其余作为 render props
  let childrenCode = ''
  const slotProps: string[] = []
  for (const [name, nodes] of entries) {
    const jsx = nodes.map((n) => generateJSX(n, level + 1)).join('\n')
    if (name === 'default') {
      childrenCode = jsx
    } else {
      // 命名插槽 → render prop: header={<><Child1/><Child2/></>}
      const content = jsx.includes('\n')
        ? `<>\n${jsx}\n${indent(level)}</>`
        : `<>${jsx}</>`
      slotProps.push(`${name}={${content}}`)
    }
  }
  return { childrenCode, slotProps: slotProps.join(' ') }
}

// ============ Import 生成 ============

/** 收集组件树中所有依赖的包名 */
function collectComponentDeps(node: ComponentNode, acc: Map<string, Set<string>>): void {
  if (node.meta?.package) {
    const pkg = node.meta.package
    const exportName = node.meta.exportName || node.componentName
    if (!acc.has(pkg)) acc.set(pkg, new Set())
    if (node.meta.destructuring !== false) {
      acc.get(pkg)!.add(exportName)
    }
  }
  if (node.children) {
    for (const child of node.children) {
      if (typeof child !== 'string') collectComponentDeps(child, acc)
    }
  }
  if (node.slots) {
    for (const nodes of Object.values(node.slots)) {
      for (const n of nodes) collectComponentDeps(n, acc)
    }
  }
}

/** 生成 import 语句 */
function generateImports(schema: PageSchema): string {
  const lines: string[] = []
  const componentDeps = new Map<string, Set<string>>()

  // React 核心
  const hasState = schema.state && schema.state.length > 0
  const hasDataSources = schema.dataSources && schema.dataSources.length > 0
  const hasLifeCycles = schema.lifeCycles
  const needsUseEffect = hasDataSources || hasLifeCycles
  // useState 也用于 DataSource 自动生成的 loading/error 状态
  const needsUseState = hasState || hasDataSources

  const reactImports: string[] = []
  if (needsUseState) reactImports.push('useState')
  if (needsUseEffect) reactImports.push('useEffect')
  if (reactImports.length > 0) {
    lines.push(`import { ${reactImports.join(', ')} } from 'react'`)
  }

  // 收集组件依赖
  collectComponentDeps(schema.componentTree, componentDeps)

  // 收集 JSResource 引用
  const resourceIds = new Set<string>()
  collectResources(schema.componentTree, resourceIds)
  if (resourceIds.size > 0) {
    for (const id of resourceIds) {
      const varName = `__resource_${sanitizeVarName(id)}`
      lines.push(`import ${varName} from './resources/${id}'`)
    }
  }

  // 额外依赖
  if (schema.dependencies) {
    for (const dep of schema.dependencies) {
      if (!componentDeps.has(dep.package)) componentDeps.set(dep.package, new Set())
      if (dep.exportName) componentDeps.get(dep.package)!.add(dep.exportName)
    }
  }

  // 生成组件 import
  for (const [pkg, names] of componentDeps) {
    if (names.size === 0) {
      lines.push(`import '${pkg}'`)
    } else {
      lines.push(`import { ${[...names].join(', ')} } from '${pkg}'`)
    }
  }

  return lines.join('\n')
}

// ============ State 生成 ============

/** 将 StateVariable 转为 useState 声明 */
function generateState(state?: StateVariable[]): string {
  if (!state || state.length === 0) return ''
  return state
    .map((v) => {
      const initValue = generateBindValue(v.value)
      return `  const [${v.name}, set${capitalize(v.name)}] = useState(${initValue})`
    })
    .join('\n')
}

// ============ Methods 生成 ============

/** 将 MethodDefinition 转为函数声明 */
function generateMethods(methods?: MethodDefinition[]): string {
  if (!methods || methods.length === 0) return ''
  return methods
    .map((m) => {
      const params = m.params?.join(', ') || ''
      return `  const ${m.name} = (${params}) => {\n    ${sanitizeFunctionBody(m.content)}\n  }`
    })
    .join('\n\n')
}

// ============ DataSource 生成 ============

/** 将 params 对象拼接为 URL 查询字符串代码 */
function generateUrlWithParams(ds: DataSource): string {
  const config = ds.config
  const baseUrl = typeof config.url === 'string' ? JSON.stringify(config.url) : config.url.value
  if (!config.params || Object.keys(config.params).length === 0) {
    return baseUrl
  }

  // 静态 params → 直接拼接
  const staticEntries: [string, string][] = []
  let hasDynamic = false
  for (const [k, v] of Object.entries(config.params)) {
    if (isJSExpression(v)) {
      hasDynamic = true
      staticEntries.push([k, `\${${v.value}}`])
    } else {
      staticEntries.push([k, `\${${stringifyValue(v)}}`])
    }
  }

  if (typeof config.url === 'string') {
    // 全静态：直接算出完整 URL
    const qs = staticEntries.map(([k, v]) => `${k}=${v}`).join('&')
    return '`' + config.url + (config.url.includes('?') ? '&' : '?') + qs + '`'
  }

  // 动态 URL + params → 模板字符串
  const qs = staticEntries.map(([k, v]) => `${k}=${v}`).join('&')
  if (hasDynamic) {
    return '`' + '${' + baseUrl + '}' + (baseUrl.includes('?') ? '&' : '?') + qs + '`'
  }
  return `${baseUrl} + '${config.url?.toString().includes('?') ? '&' : '?'}${qs}'`
}

/** 生成单个数据源的 fetch 逻辑（含 try/catch、AbortController、自动 setState） */
function generateDataSourceFetcher(ds: DataSource, signalExpr: string): string {
  const config = ds.config
  const urlWithParams = generateUrlWithParams(ds)
  const method = config.method || 'GET'
  const headers = config.headers
    ? JSON.stringify(
        Object.fromEntries(
          Object.entries(config.headers).map(([k, v]) => [k, typeof v === 'string' ? v : v.value])
        )
      )
    : undefined

  const hasBody = config.body && ['POST', 'PUT', 'PATCH'].includes(method)
  const body = hasBody
    ? typeof config.body === 'object' && config.body !== null && 'type' in config.body
      ? (config.body as JSExpression).value
      : JSON.stringify(config.body)
    : null

  const stateName = ds.name
  const setterName = `set${capitalize(stateName)}`

  const lines: string[] = []

  // try 开始
  lines.push(`    set${capitalize(stateName)}Loading(true)`)
  lines.push(`    set${capitalize(stateName)}Error(null)`)
  lines.push(`    try {`)

  // fetch 调用
  lines.push(`      const response = await fetch(${urlWithParams}, {`)
  lines.push(`        method: '${method}',`)
  if (headers) lines.push(`        headers: ${headers},`)
  if (body) lines.push(`        body: JSON.stringify(${body}),`)
  if (config.withCredentials) lines.push(`        credentials: 'include',`)
  // AbortController signal（组件卸载取消）+ 超时
  const signals: string[] = [signalExpr]
  if (config.timeout) signals.push(`AbortSignal.timeout(${config.timeout})`)
  const combinedSignal = signals.length > 1
    ? `AbortSignal.any([${signals.join(', ')}])`
    : signals[0]
  lines.push(`        signal: ${combinedSignal},`)
  lines.push(`      })`)

  lines.push(`      if (!response.ok) throw new Error(\`请求失败: \${response.status} \${response.statusText}\`)`)
  lines.push(`      const data = await response.json()`)

  // dataHandler 转换
  if (ds.dataHandler) {
    lines.push(`      const result = (${ds.dataHandler.value})(data)`)
  } else {
    lines.push(`      const result = data`)
  }

  // 自动 setState
  lines.push(`      ${setterName}(result)`)

  // catch
  lines.push(`    } catch (err) {`)
  lines.push(`      if (err.name !== 'AbortError') {`)
  lines.push(`        set${capitalize(stateName)}Error(err.message || '请求失败')`)
  lines.push(`      }`)
  lines.push(`    } finally {`)
  lines.push(`      set${capitalize(stateName)}Loading(false)`)
  lines.push(`    }`)

  return lines.join('\n')
}

/** 生成数据源 useEffect（含 AbortController 清理） */
function generateDataSources(dataSources?: DataSource[]): string {
  if (!dataSources || dataSources.length === 0) return ''
  return dataSources
    .map((ds) => {
      const controllerVar = `${ds.name}AbortCtrl`
      const signalExpr = `${controllerVar}.signal`
      const fetcher = generateDataSourceFetcher(ds, signalExpr)
      const guard = ds.shouldFetch ? `\n      if (!(${ds.shouldFetch.value})) return` : ''

      const lines: string[] = []
      lines.push(`  useEffect(() => {`)
      lines.push(`    const ${controllerVar} = new AbortController()`)
      lines.push(`    const fetchData = async () => {${guard}`)
      lines.push(fetcher)
      lines.push(`    }`)
      lines.push(`    fetchData()`)
      lines.push(`    return () => ${controllerVar}.abort()`)
      lines.push(`  }, [])`)
      return lines.join('\n')
    })
    .join('\n\n')
}

/** 收集 DataSource 自动生成的状态变量（data + loading + error） */
function collectAutoState(dataSources?: DataSource[]): StateVariable[] {
  if (!dataSources || dataSources.length === 0) return []
  const vars: StateVariable[] = []
  for (const ds of dataSources) {
    const name = ds.name
    vars.push({ id: `${ds.id}_data`, name, value: null })
    vars.push({ id: `${ds.id}_loading`, name: `${name}Loading`, value: false })
    vars.push({ id: `${ds.id}_error`, name: `${name}Error`, value: null })
  }
  return vars
}

// ============ 生命周期生成 ============

/** 将 LifeCycles 转为 useEffect 声明 */
function generateLifeCycles(lc?: LifeCycles): string {
  if (!lc) return ''
  const blocks: string[] = []

  // mounted / beforeMount → useEffect([], [])
  if (lc.mounted || lc.beforeMount) {
    const body = []
    if (lc.beforeMount) body.push(`    ${sanitizeFunctionBody(lc.beforeMount.value)}`)
    if (lc.mounted) body.push(`    ${sanitizeFunctionBody(lc.mounted.value)}`)
    blocks.push(`  useEffect(() => {\n${body.join('\n')}\n  }, [])`)
  }

  // unmounted → useEffect cleanup
  if (lc.unmounted || lc.beforeUnmount) {
    const cleanupBody = lc.unmounted?.value || lc.beforeUnmount?.value || ''
    blocks.push(`  useEffect(() => {\n    return () => {\n      ${sanitizeFunctionBody(cleanupBody)}\n    }\n  }, [])`)
  }

  // updated → useEffect without deps
  if (lc.updated || lc.beforeUpdate) {
    const body = []
    if (lc.beforeUpdate) body.push(`    ${sanitizeFunctionBody(lc.beforeUpdate.value)}`)
    if (lc.updated) body.push(`    ${sanitizeFunctionBody(lc.updated.value)}`)
    blocks.push(`  useEffect(() => {\n${body.join('\n')}\n  })`)
  }

  return blocks.join('\n\n')
}

// ============ 完整页面代码生成 ============

/**
 * 将 PageSchema 转换为 React 组件源代码
 */
function generatePageCode(schema: PageSchema): string {
  const sections: string[] = []

  // 1. import
  const imports = generateImports(schema)
  if (imports) sections.push(imports)

  // 2. CSS（如有）
  if (schema.css) {
    sections.push(`/* 页面样式 */\nconst styles = \`\n${schema.css}\n\``)
  }

  // 3. 常量
  if (schema.constants && Object.keys(schema.constants).length > 0) {
    const constEntries = Object.entries(schema.constants)
      .map(([k, v]) => `const ${k} = ${stringifyValue(v)}`)
      .join('\n')
    sections.push(constEntries)
  }

  // 4. 工具函数
  if (schema.utils && Object.keys(schema.utils).length > 0) {
    const utilEntries = Object.entries(schema.utils)
      .map(([k, v]) => `const ${k} = ${v.value}`)
      .join('\n\n')
    sections.push(utilEntries)
  }

  // 4.5 桥接函数
  if (schema.bridge && Object.keys(schema.bridge).length > 0) {
    const bridgeEntries = Object.entries(schema.bridge)
      .map(([k, v]) => `const ${k} = ${v.value}`)
      .join('\n\n')
    sections.push(bridgeEntries)
  }

  // 5. 组件开始
  const componentName = toPascalCase(schema.meta.name)
  const compLines: string[] = []
  compLines.push(`function ${componentName}() {`)

  // 5a. state（用户定义 + DataSource 自动生成的 loading/error）
  const autoStates = collectAutoState(schema.dataSources)
  const allStates = [...(schema.state || []), ...autoStates]
  const stateCode = generateState(allStates)
  if (stateCode) compLines.push(stateCode)

  // 5b. methods
  const methodsCode = generateMethods(schema.methods)
  if (methodsCode) compLines.push(methodsCode)

  // 5c. dataSources → useEffect
  const dsCode = generateDataSources(schema.dataSources)
  if (dsCode) compLines.push(dsCode)

  // 5d. lifeCycles → useEffect
  const lcCode = generateLifeCycles(schema.lifeCycles)
  if (lcCode) compLines.push(lcCode)

  // 5e. return JSX
  const jsxCode = generateJSX(schema.componentTree, 2)
  compLines.push(`\n  return (`)
  compLines.push(`    <>`)
  compLines.push(jsxCode)
  compLines.push(`    </>`)
  compLines.push(`  )`)

  compLines.push(`}`)
  sections.push(compLines.join('\n'))

  // 6. export
  sections.push(`export default ${componentName}`)

  return sections.join('\n\n')
}

// ============ 区块代码生成 ============

/**
 * 将 BlockSchema 转换为可复用的 React 组件源代码
 *
 * 区块对外暴露 schemaProps 作为组件 props，
 * 生成 TypeScript interface 定义。
 */
function generateBlockCode(schema: BlockSchema): string {
  const sections: string[] = []
  const componentName = toPascalCase(schema.name)

  // 1. 收集依赖
  const componentDeps = new Map<string, Set<string>>()
  collectComponentDeps(schema.componentTree, componentDeps)
  if (schema.dependencies) {
    for (const dep of schema.dependencies) {
      if (!componentDeps.has(dep.package)) componentDeps.set(dep.package, new Set())
      if (dep.exportName) componentDeps.get(dep.package)!.add(dep.exportName)
    }
  }

  // 2. import
  const reactImports: string[] = []
  const hasState = schema.state && schema.state.length > 0
  if (hasState) reactImports.push('useState')
  if (reactImports.length > 0) {
    sections.push(`import { ${reactImports.join(', ')} } from 'react'`)
  }
  for (const [pkg, names] of componentDeps) {
    if (names.size === 0) {
      sections.push(`import '${pkg}'`)
    } else {
      sections.push(`import { ${[...names].join(', ')} } from '${pkg}'`)
    }
  }

  // 3. Props interface
  if (schema.schemaProps && Object.keys(schema.schemaProps).length > 0) {
    const propLines = Object.entries(schema.schemaProps).map(([k, v]) => {
      const optional = v.required ? '' : '?'
      const tsType = v.type || 'unknown'
      const comment = v.desc ? `  /** ${v.desc} */\n` : ''
      return `${comment}  ${k}${optional}: ${tsType}`
    })
    sections.push(`interface ${componentName}Props {\n${propLines.join('\n')}\n}`)
  }

  // 4. 组件
  const hasProps = schema.schemaProps && Object.keys(schema.schemaProps).length > 0
  const propsParam = hasProps ? `{ ${Object.keys(schema.schemaProps!).join(', ')} }: ${componentName}Props` : ''
  const compLines: string[] = []
  compLines.push(`function ${componentName}(${propsParam}) {`)

  // state
  const stateCode = generateState(schema.state)
  if (stateCode) compLines.push(stateCode)

  // methods
  const methodsCode = generateMethods(schema.methods)
  if (methodsCode) compLines.push(methodsCode)

  // JSX
  const jsxCode = generateJSX(schema.componentTree, 2)
  compLines.push(`\n  return (`)
  compLines.push(`    <>`)
  compLines.push(jsxCode)
  compLines.push(`    </>`)
  compLines.push(`  )`)
  compLines.push(`}`)
  sections.push(compLines.join('\n'))

  // 5. export
  sections.push(`export default ${componentName}`)

  return sections.join('\n\n')
}

// ============ 完整应用代码生成 ============

/**
 * 将 AppSchema 转换为完整 React 应用的源代码文件集合
 *
 * 返回文件路径 → 文件内容的映射：
 * - "App.tsx" —— 根组件
 * - "router.tsx" —— 路由配置
 * - "pages/<PageName>.tsx" —— 各页面组件
 * - "global.css" —— 全局样式（如有）
 */
function generateAppCode(schema: AppSchema): Record<string, string> {
  const files: Record<string, string> = {}

  // 1. 各页面组件
  const pageComponentNames: { name: string; path: string; id: string }[] = []
  for (const page of schema.pages) {
    const pageCode = generatePageCode(page)
    const fileName = `pages/${toPascalCase(page.meta.name)}.tsx`
    files[fileName] = pageCode
    pageComponentNames.push({
      id: page.meta.id,
      name: toPascalCase(page.meta.name),
      path: page.meta.router || `/${toKebabCase(page.meta.name)}`,
    })
  }

  // 2. 路由配置
  if (schema.routes || schema.pages.length > 1) {
    const routesCode = generateRouterCode(schema, pageComponentNames)
    files['router.tsx'] = routesCode
  }

  // 3. 全局状态 provider（如有）
  if (schema.globalState && schema.globalState.length > 0) {
    files['store.tsx'] = generateGlobalStateCode(schema)
  }

  // 3.5 全局方法（如有）
  if (schema.globalMethods && schema.globalMethods.length > 0) {
    files['globalMethods.ts'] = generateGlobalMethodsCode(schema)
  }

  // 3.6 全局数据源（如有）
  if (schema.globalDataSources && schema.globalDataSources.length > 0) {
    files['globalDataSources.ts'] = generateGlobalDataSourcesCode(schema)
  }

  // 4. App.tsx
  files['App.tsx'] = generateAppRootCode(schema, pageComponentNames)

  // 5. 全局 CSS
  if (schema.globalCss) {
    files['global.css'] = schema.globalCss
  }

  // 6. 入口文件
  files['main.tsx'] = generateEntryCode(schema)

  return files
}

// ============ 辅助代码生成 ============

/** 递归生成单条路由 JSX */
function generateRouteLine(
  route: import('./protocol').RouteConfig,
  pageMap: Map<string, string>,
  level: number
): string {
  const pad = indent(level)
  const pageName = pageMap.get(route.pageId)
  const elementAttr = pageName ? ` element={<${pageName} />}` : ''
  const redirectAttr = route.redirect ? ` element={<Navigate to="${route.redirect}" replace />}` : ''
  const nameAttr = route.name ? ` name="${route.name}"` : ''

  if (route.children && route.children.length > 0) {
    const childLines = route.children.map((c) => generateRouteLine(c, pageMap, level + 1)).join('\n')
    return `${pad}<Route path="${route.path}"${elementAttr || redirectAttr}${nameAttr}>\n${childLines}\n${pad}</Route>`
  }
  return `${pad}<Route path="${route.path}"${elementAttr || redirectAttr}${nameAttr} />`
}

/** 生成路由配置代码（支持嵌套） */
function generateRouterCode(
  schema: AppSchema,
  pages: { name: string; path: string; id: string }[]
): string {
  const pageMap = new Map(pages.map((p) => [p.id, p.name]))

  // 有显式 routes 配置 → 递归生成
  if (schema.routes && schema.routes.length > 0) {
    const imports = pages.map((p) => `import ${p.name} from './pages/${p.name}'`).join('\n')
    const routeLines = schema.routes.map((r) => generateRouteLine(r, pageMap, 2)).join('\n')
    const needsRedirect = JSON.stringify(schema.routes).includes('redirect')

    return `import { Routes, Route${needsRedirect ? ', Navigate' : ''} } from 'react-router-dom'
${imports}

export default function AppRouter() {
  return (
    <Routes>
${routeLines}
    </Routes>
  )
}
`
  }

  // 无显式 routes → 自动生成扁平路由
  const imports = pages.map((p) => `import ${p.name} from './pages/${p.name}'`).join('\n')
  const routes = pages.map((p) => `        <Route path="${p.path}" element={<${p.name} />} />`).join('\n')

  return `import { Routes, Route } from 'react-router-dom'
${imports}

export default function AppRouter() {
  return (
    <Routes>
${routes}
    </Routes>
  )
}
`
}

/** 生成全局状态代码 */
function generateGlobalStateCode(schema: AppSchema): string {
  const stateVars = schema.globalState!
  const stateInit = stateVars
    .map((v) => `  ${v.name}: ${generateBindValue(v.value)}`)
    .join(',\n')

  return `import { createContext, useContext, useState } from 'react'

const initialState = {
${stateInit}
}

const StoreContext = createContext(initialState)

export function StoreProvider({ children }) {
  const [state, setState] = useState(initialState)

  const update = (key, value) => {
    setState(prev => ({ ...prev, [key]: value }))
  }

  return (
    <StoreContext.Provider value={{ ...state, update }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
`
}

/** 生成全局方法模块 */
function generateGlobalMethodsCode(schema: AppSchema): string {
  const methods = schema.globalMethods!
  const funcs = methods
    .map((m) => {
      const params = m.params?.join(', ') || ''
      return `export const ${m.name} = (${params}) => {\n  ${sanitizeFunctionBody(m.content)}\n}`
    })
    .join('\n\n')
  return funcs
}

/** 生成全局数据源 hooks */
function generateGlobalDataSourcesCode(schema: AppSchema): string {
  const dataSources = schema.globalDataSources!
  const lines: string[] = [`import { useState, useEffect } from 'react'`]

  for (const ds of dataSources) {
    const stateName = ds.name
    const hookName = `use${capitalize(stateName)}`
    const controllerVar = `${stateName}AbortCtrl`
    const signalExpr = `${controllerVar}.signal`
    const fetcher = generateDataSourceFetcher(ds, signalExpr)
    const guard = ds.shouldFetch ? `\n      if (!(${ds.shouldFetch.value})) return` : ''

    lines.push(`
export function ${hookName}() {
  const [${stateName}, set${capitalize(stateName)}] = useState(null)
  const [${stateName}Loading, set${capitalize(stateName)}Loading] = useState(false)
  const [${stateName}Error, set${capitalize(stateName)}Error] = useState(null)

  useEffect(() => {
    const ${controllerVar} = new AbortController()
    const fetchData = async () => {${guard}
${fetcher}
    }
    fetchData()
    return () => ${controllerVar}.abort()
  }, [])

  return { ${stateName}, ${stateName}Loading, ${stateName}Error }
}`)
  }

  return lines.join('\n')
}

/** 生成 App 根组件 */
function generateAppRootCode(
  schema: AppSchema,
  pages: { name: string; path: string; id: string }[]
): string {
  const hasGlobalState = schema.globalState && schema.globalState.length > 0
  const hasRouter = schema.routes || schema.pages.length > 1

  const imports: string[] = []
  if (hasRouter) imports.push(`import AppRouter from './router'`)
  if (hasGlobalState) imports.push(`import { StoreProvider } from './store'`)

  let body = ''
  if (hasRouter && hasGlobalState) {
    body = `    <StoreProvider>\n      <AppRouter />\n    </StoreProvider>`
  } else if (hasRouter) {
    body = `    <AppRouter />`
  } else if (hasGlobalState) {
    body = `    <StoreProvider>\n      <${pages[0]?.name || 'App'} />\n    </StoreProvider>`
  } else {
    body = `    <${pages[0]?.name || 'App'} />`
  }

  return `${imports.join('\n')}

function App() {
  return (
    <>
${body}
    </>
  )
}

export default App
`
}

/** 生成入口文件 */
function generateEntryCode(entrySchema: AppSchema): string {
  return `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
${entrySchema.globalCss ? "import './global.css'" : ''}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
`
}

// ============ 名称转换工具 ============

/** 转为 PascalCase */
function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (_, c: string) => c.toUpperCase())
}

/** 转为 kebab-case */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

// ============ 导出 ============

export {
  generatePageCode,
  generateBlockCode,
  generateAppCode,
  generateJSX,
  generateBindValue,
  generateProps,
  generateEvents,
  generateState,
  generateMethods,
  generateDataSources,
  generateLifeCycles,
  generateImports,
}
