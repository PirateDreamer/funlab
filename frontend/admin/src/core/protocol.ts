/**
 * OpenTiny TinyEngine DSL Protocol
 *
 * 低代码引擎的领域特定语言协议，用于描述页面结构、组件树、数据源和生命周期。
 * 参考：https://github.com/opentiny/tiny-engine
 */

// ============ 基础类型 ============

/** 唯一标识符 */
type ComponentId = string

/** CSS 样式对象 */
type CSSProperties = Record<string, string | number>

/** 组件属性值，支持静态值和表达式绑定 */
type PropValue = string | number | boolean | null | undefined | Record<string, unknown> | unknown[]

/** 表达式绑定，以 { type: 'JSExpression', value: string } 形式表示 */
interface JSExpression {
  type: 'JSExpression'
  /** 表达式字符串，如 "state.count + 1" */
  value: string
  /** 模拟值，用于设计器预览 */
  mock?: PropValue
}

/** JS 函数绑定 */
interface JSFunction {
  type: 'JSFunction'
  /** 函数体，如 "(e) => { state.count++ }" */
  value: string
  /** 函数参数 */
  params?: string[]
}

/** JS 资源引用 */
interface JSResource {
  type: 'JSResource'
  /** 资源 ID */
  id: string
}

/** 绑定值类型：静态值或表达式 */
type BindValue = PropValue | JSExpression | JSFunction | JSResource

// ============ 组件节点 ============

/** 组件属性 */
type ComponentProps = Record<string, BindValue>

/** 事件处理器 */
interface EventHandler {
  /** 事件名，如 "click", "change" */
  event: string
  /** 处理方式 */
  handler: JSFunction | JSExpression
  /** 是否阻止默认行为 */
  preventDefault?: boolean
  /** 是否阻止事件冒泡 */
  stopPropagation?: boolean
}

/** 条件渲染 */
interface Condition {
  type: 'JSExpression'
  value: string
  /** false 时是否保留节点（display:none）而非移除 */
  preserveNode?: boolean
}

/** 循环渲染 */
interface Loop {
  /** 循环数据源 */
  data: JSExpression
  /** 当前项变量名，默认 "item" */
  item?: string
  /** 索引变量名，默认 "index" */
  index?: string
  /** 唯一标识生成表达式 */
  key?: string
}

/** 插槽定义 */
type Slots = Record<string, ComponentNode[]>

/** 组件节点描述 */
interface ComponentNode {
  /** 组件唯一 ID */
  id: ComponentId
  /** 组件名称，如 "Button", "div", "Input" */
  componentName: string
  /** 组件属性 */
  props?: ComponentProps
  /** 绑定到 DOM 元素的属性（ref, className 等） */
  host?: Record<string, BindValue>
  /** 组件描述文本 */
  desc?: string
  /** 子节点（数组形式） */
  children?: ComponentNode[] | string[]
  /** 命名插槽 */
  slots?: Slots
  /** 事件列表 */
  events?: EventHandler[]
  /** 条件渲染 */
  condition?: Condition
  /** 循环渲染 */
  loop?: Loop
  /** 行内样式 */
  style?: CSSProperties
  /** CSS 类名 */
  className?: string
  /** 组件引用名 */
  ref?: string
  /** 是否为根节点 */
  isRoot?: boolean
  /** 组件元信息 */
  meta?: ComponentMeta
}

/** 组件元信息 */
interface ComponentMeta {
  /** 组件的 npm 包名 */
  package?: string
  /** 版本号 */
  version?: string
  /** 导入名 */
  exportName?: string
  /** 解构导入 */
  destructuring?: boolean
  /** 子组件名（用于容器类组件的插槽） */
  subName?: string
}

// ============ 数据源 ============

/** HTTP 方法 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/** 数据源配置 */
interface DataSource {
  /** 数据源 ID */
  id: string
  /** 数据源名称 */
  name: string
  /** 请求配置 */
  config: {
    /** 接口地址 */
    url: string | JSExpression
    /** HTTP 方法 */
    method?: HttpMethod
    /** 请求头 */
    headers?: Record<string, string | JSExpression>
    /** 请求体（POST/PUT/PATCH） */
    body?: Record<string, BindValue> | JSExpression
    /** URL 查询参数 */
    params?: Record<string, BindValue>
    /** 超时时间（ms） */
    timeout?: number
    /** 是否携带凭证 */
    withCredentials?: boolean
  }
  /** 数据转换函数 */
  dataHandler?: JSFunction
  /** 是否自动请求 */
  shouldFetch?: JSExpression
}

// ============ 全局状态 ============

/** 状态变量定义 */
interface StateVariable {
  /** 变量 ID */
  id: string
  /** 变量名 */
  name: string
  /** 初始值 */
  value: BindValue
  /** 变量描述 */
  desc?: string
  /** 是否为全局变量 */
  global?: boolean
  /** 类型标注 */
  type?: string
}

// ============ 方法定义 ============

/** 页面/组件方法 */
interface MethodDefinition {
  /** 方法 ID */
  id: string
  /** 方法名 */
  name: string
  /** 方法体 */
  content: string
  /** 参数列表 */
  params?: string[]
  /** 方法描述 */
  desc?: string
}

// ============ 依赖定义 ============

/** 外部依赖 */
interface Dependency {
  /** 包名 */
  package: string
  /** 版本 */
  version: string
  /** 导入名 */
  exportName?: string
  /** 是否解构导入 */
  destructuring?: boolean
  /** 导入的子路径 */
  subName?: string
}

// ============ 页面 Schema ============

/** 页面元信息 */
interface PageMeta {
  /** 页面 ID */
  id: string
  /** 页面名称 */
  name: string
  /** 页面标题 */
  title?: string
  /** 页面描述 */
  desc?: string
  /** 页面路由路径 */
  router?: string
  /** 页面图标 */
  icon?: string
  /** 是否为首页 */
  isHome?: boolean
  /** 创建时间 */
  createdAt?: string
  /** 更新时间 */
  updatedAt?: string
}

/** 单个页面的完整 Schema */
interface PageSchema {
  /** 页面元信息 */
  meta: PageMeta
  /** 组件树根节点 */
  componentTree: ComponentNode
  /** 数据源列表 */
  dataSources?: DataSource[]
  /** 全局状态 */
  state?: StateVariable[]
  /** 页面方法 */
  methods?: MethodDefinition[]
  /** 生命周期钩子 */
  lifeCycles?: LifeCycles
  /** 外部依赖 */
  dependencies?: Dependency[]
  /** CSS 样式字符串 */
  css?: string
  /** 桥接函数 */
  bridge?: Record<string, JSFunction>
  /** 工具函数 */
  utils?: Record<string, JSFunction>
  /** 常量定义 */
  constants?: Record<string, PropValue>
}

// ============ 生命周期 ============

interface LifeCycleHook {
  /** 钩子类型 */
  type: 'JSFunction' | 'JSExpression'
  /** 钩子函数体 */
  value: string
}

interface LifeCycles {
  /** 组件挂载前 */
  beforeMount?: LifeCycleHook
  /** 组件挂载后 */
  mounted?: LifeCycleHook
  /** 组件更新前 */
  beforeUpdate?: LifeCycleHook
  /** 组件更新后 */
  updated?: LifeCycleHook
  /** 组件卸载前 */
  beforeUnmount?: LifeCycleHook
  /** 组件卸载后 */
  unmounted?: LifeCycleHook
}

// ============ 应用 Schema ============

/** 应用元信息 */
interface AppMeta {
  /** 应用 ID */
  id: string
  /** 应用名称 */
  name: string
  /** 应用描述 */
  desc?: string
  /** 应用图标 */
  icon?: string
  /** 应用框架（vue / react） */
  framework?: 'vue' | 'react'
  /** 应用主题 */
  theme?: string
  /** 应用语言 */
  locale?: string
  /** 设计器版本 */
  designerVersion?: string
  /** 创建时间 */
  createdAt?: string
  /** 更新时间 */
  updatedAt?: string
}

/** 路由配置 */
interface RouteConfig {
  /** 路由路径 */
  path: string
  /** 关联页面 ID */
  pageId: string
  /** 路由名称 */
  name?: string
  /** 是否精确匹配 */
  exact?: boolean
  /** 重定向 */
  redirect?: string
  /** 嵌套路由 */
  children?: RouteConfig[]
  /** 路由元信息 */
  meta?: Record<string, unknown>
}

/** 应用级别的完整 Schema */
interface AppSchema {
  /** 应用元信息 */
  meta: AppMeta
  /** 应用所有页面 */
  pages: PageSchema[]
  /** 路由配置 */
  routes?: RouteConfig[]
  /** 应用全局状态 */
  globalState?: StateVariable[]
  /** 应用全局方法 */
  globalMethods?: MethodDefinition[]
  /** 应用全局数据源 */
  globalDataSources?: DataSource[]
  /** 应用级依赖 */
  dependencies?: Dependency[]
  /** 应用全局 CSS */
  globalCss?: string
  /** 应用配置 */
  config?: Record<string, unknown>
}

// ============ 区块（可复用片段） ============

/** 区块 Schema —— 可复用的组件片段 */
interface BlockSchema {
  /** 区块 ID */
  id: string
  /** 区块名称 */
  name: string
  /** 区块描述 */
  desc?: string
  /** 区块组件树 */
  componentTree: ComponentNode
  /** 区块属性定义（对外暴露的 props） */
  schemaProps?: Record<string, {
    type: string
    default?: PropValue
    desc?: string
    required?: boolean
  }>
  /** 区块插槽定义 */
  schemaSlots?: Record<string, { desc?: string }>
  /** 区块事件定义 */
  schemaEvents?: Record<string, { desc?: string; params?: string[] }>
  /** 依赖 */
  dependencies?: Dependency[]
  /** 状态 */
  state?: StateVariable[]
  /** 方法 */
  methods?: MethodDefinition[]
}

// ============ 工具类型 ============

/** Schema 节点访问器 —— 用于遍历组件树 */
type NodeVisitor = (node: ComponentNode, parent?: ComponentNode, index?: number) => boolean | void

/** DSL 操作结果 */
interface DSLOperationResult {
  success: boolean
  message?: string
  data?: unknown
}

/** Schema diff 变更描述 */
interface SchemaChange {
  type: 'add' | 'remove' | 'update' | 'move'
  /** 变更节点 ID */
  nodeId: ComponentId
  /** 变更路径 */
  path?: string
  /** 旧值 */
  oldValue?: unknown
  /** 新值 */
  newValue?: unknown
  /** 父节点 ID（add/move 时） */
  parentId?: ComponentId
  /** 位置索引（add/move 时） */
  index?: number
}

// ============ 导出 ============

export type {
  // 基础
  ComponentId,
  CSSProperties,
  PropValue,
  BindValue,
  JSExpression,
  JSFunction,
  JSResource,
  // 组件
  ComponentNode,
  ComponentProps,
  ComponentMeta,
  EventHandler,
  Condition,
  Loop,
  Slots,
  // 数据
  DataSource,
  HttpMethod,
  StateVariable,
  MethodDefinition,
  Dependency,
  // 页面
  PageSchema,
  PageMeta,
  LifeCycles,
  LifeCycleHook,
  // 应用
  AppSchema,
  AppMeta,
  RouteConfig,
  // 区块
  BlockSchema,
  // 工具
  NodeVisitor,
  DSLOperationResult,
  SchemaChange,
}
