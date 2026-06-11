import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react'
import FlowEditor from './components/FlowEditor'
import { executeFlow } from './components/FlowEditor/flowEngine'
import type { FlowGraph } from './components/FlowEditor/flowEngine'
import './App.css'

type ApiMethod = 'GET' | 'POST'
type DeviceType = 'mobile' | 'pc'
type EventTrigger = 'click' | 'doubleClick' | 'mouseEnter' | 'mouseLeave' | 'submit'
type EventActionType = 'toast' | 'modal' | 'request' | 'openUrl' | 'showModal'
type LeftTab = 'materials' | 'layers' | 'templates'
type Mode = 'edit' | 'preview'
type RightTab = 'props' | 'style' | 'action' | 'flow' | 'source'
type WidgetType = 'text' | 'image' | 'button' | 'list' | 'notice' | 'form' | 'container' | 'modal'

type Layout = {
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

type ApiConfig = {
  enabled: boolean
  method: ApiMethod
  url: string
  dataPath: string
}

type EventAction = {
  id: string
  type: EventActionType
  label: string
  title: string
  message: string
  method: ApiMethod
  url: string
  body: string
  targetWidgetId: string
}

type WidgetEvents = Partial<Record<EventTrigger, EventAction[]>>

type WidgetSchema = {
  id: string
  type: WidgetType
  name: string
  layout: Layout
  props: Record<string, string>
  style: {
    background: string
    backgroundImage: string
    backgroundSize: string
    backgroundPosition: string
    backgroundRepeat: string
    color: string
    fontSize: number
    radius: number
    opacity: number
    padding: number
    margin: number
    flexDirection: string
    // 布局属性
    overflow?: string
    minWidth?: string
    maxWidth?: string
    minHeight?: string
    maxHeight?: string
    borderWidth?: number
    borderStyle?: string
    borderColor?: string
    boxShadow?: string
    // 文本属性
    fontWeight?: number
    lineHeight?: number
    textAlign?: string
    // 图片属性
    objectFit?: string
    // modal 专属样式
    backdropColor?: string
    headerBg?: string
    headerColor?: string
    headerBorderColor?: string
    bodyColor?: string
    confirmBg?: string
    confirmColor?: string
    confirmRadius?: number
    closeColor?: string
    modalShadow?: string
    modalBorderColor?: string
  }
  api: ApiConfig
  animation: {
    name: string
    duration: number
    delay: number
  }
  events: WidgetEvents
  children?: WidgetSchema[]
  flow?: FlowGraph
}

type PageDsl = {
  page: {
    id: string
    name: string
    device: DeviceType
    width: number
    height: number
    background: string
    backgroundTransparent: boolean
    backgroundImage: string
    backgroundSize: string
    backgroundPosition: string
    backgroundRepeat: string
  }
  widgets: WidgetSchema[]
}

type CustomComponent = {
  id: string
  name: string
  createdAt: number
  widgets: WidgetSchema[]
}

type WidgetTemplate = {
  type: WidgetType
  name: string
  group: string
  description: string
  defaults: Omit<WidgetSchema, 'id'>
}

const canvasSize: Record<DeviceType, { width: number; height: number }> = {
  mobile: { width: 375, height: 667 },
  pc: { width: 960, height: 540 },
}

const eventOptions: Array<[EventTrigger, string]> = [
  ['click', '点击'],
  ['doubleClick', '双击'],
  ['mouseEnter', '鼠标进入'],
  ['mouseLeave', '鼠标离开'],
  ['submit', '提交'],
]

const actionOptions: Array<[EventActionType, string]> = [
  ['toast', '提示'],
  ['modal', '弹窗'],
  ['showModal', '显示弹窗组件'],
  ['request', '调用接口'],
  ['openUrl', '打开链接'],
]

const widgetTemplates: WidgetTemplate[] = [
  {
    type: 'text',
    name: '文本',
    group: '基础组件',
    description: '标题、段落、标签',
    defaults: {
      type: 'text',
      name: '主标题',
      layout: { x: 28, y: 56, width: 280, height: 64, zIndex: 1 },
      props: { text: '低代码活动页' },
      style: {
        background: 'transparent',
        backgroundImage: '',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#1f2937',
        fontSize: 28,
        radius: 0,
        opacity: 100,
        padding: 0,
        margin: 0,
        flexDirection: 'row',
      },
      api: { enabled: false, method: 'GET', url: '', dataPath: '' },
      animation: { name: 'fadeInUp', duration: 600, delay: 0 },
      events: {},
    },
  },
  {
    type: 'image',
    name: '图片',
    group: '基础组件',
    description: '活动图、商品图',
    defaults: {
      type: 'image',
      name: '头图',
      layout: { x: 28, y: 146, width: 319, height: 156, zIndex: 1 },
      props: {
        src: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
        alt: '活动头图',
      },
      style: {
        background: '#e6f4ff',
        backgroundImage: '',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#1f2937',
        fontSize: 14,
        radius: 18,
        opacity: 100,
        padding: 0,
        margin: 0,
        flexDirection: 'row',
      },
      api: { enabled: false, method: 'GET', url: '', dataPath: '' },
      animation: { name: 'zoomIn', duration: 500, delay: 120 },
      events: {},
    },
  },
  {
    type: 'button',
    name: '按钮',
    group: '交互组件',
    description: '跳转、提交、埋点',
    defaults: {
      type: 'button',
      name: '行动按钮',
      layout: { x: 84, y: 326, width: 208, height: 46, zIndex: 2 },
      props: { text: '立即报名' },
      style: {
        background: '#1677ff',
        backgroundImage: '',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#ffffff',
        fontSize: 16,
        radius: 24,
        opacity: 100,
        padding: 0,
        margin: 0,
        flexDirection: 'row',
      },
      api: { enabled: false, method: 'GET', url: '', dataPath: '' },
      animation: { name: 'pulse', duration: 800, delay: 260 },
      events: {},
    },
  },
  {
    type: 'list',
    name: '列表',
    group: '业务组件',
    description: '接口数据卡片',
    defaults: {
      type: 'list',
      name: '推荐列表',
      layout: { x: 24, y: 404, width: 327, height: 150, zIndex: 1 },
      props: {
        title: '热门推荐',
        itemOne: 'AI 绘图课',
        itemTwo: '效率模板包',
        itemThree: '移动组件套件',
      },
      style: {
        background: '#ffffff',
        backgroundImage: '',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#1d39c4',
        fontSize: 14,
        radius: 14,
        opacity: 100,
        padding: 12,
        margin: 0,
        flexDirection: 'column',
      },
      api: { enabled: false, method: 'GET', url: '', dataPath: '' },
      animation: { name: 'fadeIn', duration: 500, delay: 300 },
      events: {},
    },
  },
  {
    type: 'notice',
    name: '公告',
    group: '业务组件',
    description: '提示消息条',
    defaults: {
      type: 'notice',
      name: '公告条',
      layout: { x: 24, y: 18, width: 327, height: 34, zIndex: 3 },
      props: { text: '系统维护：今晚 23:00 后部分接口短暂不可用' },
      style: {
        background: '#e6f4ff',
        backgroundImage: '',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#0958d9',
        fontSize: 12,
        radius: 16,
        opacity: 100,
        padding: 0,
        margin: 0,
        flexDirection: 'row',
      },
      api: { enabled: false, method: 'GET', url: '', dataPath: '' },
      animation: { name: 'fadeInDown', duration: 400, delay: 0 },
      events: {},
    },
  },
  {
    type: 'form',
    name: '表单',
    group: '交互组件',
    description: '线索收集',
    defaults: {
      type: 'form',
      name: '预约表单',
      layout: { x: 24, y: 562, width: 327, height: 82, zIndex: 1 },
      props: { placeholder: '请输入手机号', submitText: '提交' },
      style: {
        background: '#fffbe6',
        backgroundImage: '',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#874d00',
        fontSize: 14,
        radius: 14,
        opacity: 100,
        padding: 12,
        margin: 0,
        flexDirection: 'row',
      },
      api: { enabled: false, method: 'GET', url: '', dataPath: '' },
      animation: { name: 'fadeInUp', duration: 500, delay: 360 },
      events: {},
    },
  },
  {
    type: 'container',
    name: '容器',
    group: '布局组件',
    description: '自由布局子组件',
    defaults: {
      type: 'container',
      name: '容器',
      layout: { x: 24, y: 24, width: 327, height: 200, zIndex: 1 },
      props: {
        direction: 'column',
        justify: 'flex-start',
        align: 'stretch',
        gap: '10',
        wrap: 'nowrap',
      },
      style: {
        background: '#ffffff',
        backgroundImage: '',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#1f2937',
        fontSize: 14,
        radius: 12,
        opacity: 100,
        padding: 12,
        margin: 0,
        flexDirection: 'column',
      },
      api: { enabled: false, method: 'GET', url: '', dataPath: '' },
      animation: { name: 'fadeIn', duration: 400, delay: 0 },
      events: {},
      children: [],
    },
  },
  {
    type: 'modal',
    name: '弹窗',
    group: '交互组件',
    description: '自定义弹窗内容',
    defaults: {
      type: 'modal',
      name: '弹窗',
      layout: { x: 48, y: 80, width: 280, height: 240, zIndex: 10 },
      props: {
        title: '标题',
        content: '这里是弹窗内容，可以在右侧属性面板中修改。',
        confirmText: '确定',
        showClose: 'true',
      },
      style: {
        background: '#ffffff',
        backgroundImage: '',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#1f2937',
        fontSize: 14,
        radius: 12,
        opacity: 100,
        padding: 20,
        margin: 0,
        flexDirection: 'column',
        backdropColor: 'rgba(0,0,0,0.45)',
        headerBg: '#ffffff',
        headerColor: '#111827',
        headerBorderColor: '#edf1f7',
        bodyColor: '#374151',
        confirmBg: '#1677ff',
        confirmColor: '#ffffff',
        confirmRadius: 6,
        closeColor: '#98a2b3',
        modalShadow: '0 8px 30px rgba(0,0,0,0.15)',
        modalBorderColor: 'transparent',
      },
      api: { enabled: false, method: 'GET', url: '', dataPath: '' },
      animation: { name: 'fadeIn', duration: 300, delay: 0 },
      events: {},
    },
  },
]

const widgetTypeSet = new Set<WidgetType>(widgetTemplates.map((item) => item.type))

const initialWidgets = [
  createWidget(widgetTemplates[4]),
  createWidget(widgetTemplates[0]),
  createWidget(widgetTemplates[1]),
  createWidget(widgetTemplates[2]),
  createWidget(widgetTemplates[3]),
]

function createAction(type: EventActionType, patch: Partial<EventAction> = {}): EventAction {
  const labelMap: Record<EventActionType, string> = {
    toast: '显示提示',
    modal: '打开弹窗',
    showModal: '显示弹窗组件',
    request: '调用接口',
    openUrl: '打开链接',
  }

  return {
    id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    label: patch.label ?? labelMap[type],
    title: patch.title ?? '提示',
    message: patch.message ?? '行为已触发',
    method: patch.method ?? 'GET',
    url: patch.url ?? '/api/demo',
    body: patch.body ?? '{}',
    targetWidgetId: patch.targetWidgetId ?? '',
  }
}

function createWidget(template: WidgetTemplate): WidgetSchema {
  return {
    id: `${template.type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: template.type,
    name: template.defaults.name,
    layout: { ...template.defaults.layout },
    props: { ...template.defaults.props },
    style: { ...template.defaults.style },
    api: { ...template.defaults.api },
    animation: { ...template.defaults.animation },
    events: cloneEvents(template.defaults.events),
    children: template.defaults.children?.map((child) => cloneWidget(child)) ?? undefined,
  }
}

function cloneWidget(widget: WidgetSchema): WidgetSchema {
  return {
    ...widget,
    id: `${widget.type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    layout: { ...widget.layout },
    props: { ...widget.props },
    style: { ...widget.style },
    api: { ...widget.api },
    animation: { ...widget.animation },
    events: cloneEvents(widget.events),
    children: widget.children?.map((child) => cloneWidget(child)),
    flow: widget.flow ? { nodes: widget.flow.nodes.map((n) => ({ ...n, config: { ...n.config }, ports: n.ports.map((p) => ({ ...p })) })), edges: widget.flow.edges.map((e) => ({ ...e })) } : undefined,
  }
}

function updateWidgetInTree(
  widgets: WidgetSchema[],
  id: string,
  updater: (w: WidgetSchema) => WidgetSchema,
): WidgetSchema[] {
  return widgets.map((w) => {
    if (w.id === id) return updater(w)
    if (w.children?.length) {
      return { ...w, children: updateWidgetInTree(w.children, id, updater) }
    }
    return w
  })
}

/** 从树中移除指定 id 的 widget（递归） */
function removeWidgetFromTree(widgets: WidgetSchema[], id: string): WidgetSchema[] {
  const filtered = widgets.filter((w) => w.id !== id)
  if (filtered.length < widgets.length) return filtered
  return widgets.map((w) =>
    w.children?.length ? { ...w, children: removeWidgetFromTree(w.children, id) } : w,
  )
}

/** 在树中查找指定 widget 的父容器（递归） */
function findParentContainer(widgets: WidgetSchema[], childId: string): WidgetSchema | undefined {
  for (const w of widgets) {
    if (w.children?.some((c) => c.id === childId)) return w
    if (w.children?.length) {
      const found = findParentContainer(w.children, childId)
      if (found) return found
    }
  }
  return undefined
}

/** 在容器内移动子项位置 */
function moveChildInContainer(widgets: WidgetSchema[], containerId: string, childId: string, direction: 'up' | 'down'): WidgetSchema[] {
  return updateWidgetInTree(widgets, containerId, (container) => {
    const children = [...(container.children ?? [])]
    const idx = children.findIndex((c) => c.id === childId)
    if (idx < 0) return container
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= children.length) return container
    ;[children[idx], children[targetIdx]] = [children[targetIdx], children[idx]]
    return { ...container, children }
  })
}

function cloneEvents(events: WidgetEvents): WidgetEvents {
  return Object.fromEntries(
    Object.entries(events).map(([trigger, actions]) => [
      trigger,
      actions?.map((action) => ({ ...action, id: `${action.type}-${Date.now()}-${Math.random().toString(16).slice(2)}` })),
    ]),
  ) as WidgetEvents
}

function stringifyDsl(dsl: PageDsl) {
  return JSON.stringify(dsl, null, 2)
}

function normalizeEvents(events: unknown): WidgetEvents {
  if (!events || typeof events !== 'object') return {}
  const normalized: WidgetEvents = {}

  for (const [trigger, value] of Object.entries(events as Record<string, unknown>)) {
    if (!eventOptions.some(([key]) => key === trigger)) continue

    if (typeof value === 'string' && value.trim()) {
      normalized[trigger as EventTrigger] = [
        createAction('modal', {
          label: '兼容脚本',
          title: '脚本事件',
          message: value,
        }),
      ]
      continue
    }

    if (Array.isArray(value)) {
      normalized[trigger as EventTrigger] = value
        .filter((item): item is Partial<EventAction> => !!item && typeof item === 'object')
        .map((item) => createAction(isActionType(item.type) ? item.type : 'toast', item))
    }
  }

  return normalized
}

function normalizeWidget(widget: WidgetSchema, index: number): WidgetSchema {
  const template = widgetTemplates.find((item) => item.type === widget.type) ?? widgetTemplates[0]
  const layout = { ...template.defaults.layout, ...(widget.layout ?? {}) }
  const style = { ...template.defaults.style, ...(widget.style ?? {}) }

  return {
    id: widget.id || `${template.type}-${Date.now()}-${index}`,
    type: template.type,
    name: widget.name || template.name,
    layout: {
      x: Number(layout.x),
      y: Number(layout.y),
      width: Number(layout.width),
      height: Number(layout.height),
      zIndex: Number(layout.zIndex),
    },
    props: { ...template.defaults.props, ...(widget.props ?? {}) },
    style: {
      background: style.background,
      backgroundImage: style.backgroundImage ?? '',
      backgroundSize: style.backgroundSize ?? 'cover',
      backgroundPosition: style.backgroundPosition ?? 'center',
      backgroundRepeat: style.backgroundRepeat ?? 'no-repeat',
      color: style.color,
      fontSize: Number(style.fontSize),
      radius: Number(style.radius),
      opacity: Number(style.opacity),
      padding: Number(style.padding ?? 0),
      margin: Number(style.margin ?? 0),
      flexDirection: style.flexDirection ?? 'row',
      overflow: style.overflow ?? 'hidden',
      minWidth: style.minWidth ?? '',
      maxWidth: style.maxWidth ?? '',
      minHeight: style.minHeight ?? '',
      maxHeight: style.maxHeight ?? '',
      borderWidth: Number(style.borderWidth ?? 0),
      borderStyle: style.borderStyle ?? 'solid',
      borderColor: style.borderColor ?? '#000000',
      boxShadow: style.boxShadow ?? '',
      fontWeight: Number(style.fontWeight ?? 400),
      lineHeight: Number(style.lineHeight ?? 1.5),
      textAlign: style.textAlign ?? 'left',
      objectFit: style.objectFit ?? 'cover',
    },
    api: { ...template.defaults.api, ...(widget.api ?? {}) },
    animation: { ...template.defaults.animation, ...(widget.animation ?? {}) },
    events: { ...normalizeEvents(template.defaults.events), ...normalizeEvents(widget.events) },
    children: widget.children?.map((child, ci) => normalizeWidget(child, ci)),
    flow: widget.flow ?? undefined,
  }
}

function isActionType(value: unknown): value is EventActionType {
  return actionOptions.some(([type]) => type === value)
}

function Builder() {
  const [device, setDevice] = useState<DeviceType>('mobile')
  const [eventTrigger, setEventTrigger] = useState<EventTrigger>('click')
  const [leftTab, setLeftTab] = useState<LeftTab>('materials')
  const [mode, setMode] = useState<Mode>('edit')
  const [rightTab, setRightTab] = useState<RightTab>('props')
  const [pageName, setPageName] = useState('码良风格活动页')
  const [pageBackground, setPageBackground] = useState('#f2f4f8')
  const [pageBgTransparent, setPageBgTransparent] = useState(false)
  const [pageBackgroundImage, setPageBackgroundImage] = useState('')
  const [pageBackgroundSize, setPageBackgroundSize] = useState('cover')
  const [pageBackgroundPosition, setPageBackgroundPosition] = useState('center')
  const [pageBackgroundRepeat, setPageBackgroundRepeat] = useState('no-repeat')
  const [selectedId, setSelectedId] = useState(initialWidgets[1]?.id ?? '')
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [sourceText, setSourceText] = useState('')
  const [sourceError, setSourceError] = useState('')
  const [widgets, setWidgets] = useState<WidgetSchema[]>(initialWidgets)
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>(() => {
    try {
      const raw = localStorage.getItem('funlab-custom-components')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })

  function findWidgetById(list: WidgetSchema[], id: string): WidgetSchema | undefined {
    for (const w of list) {
      if (w.id === id) return w
      if (w.children?.length) {
        const found = findWidgetById(w.children, id)
        if (found) return found
      }
    }
    return undefined
  }

  const selected = findWidgetById(widgets, selectedId) ?? widgets[0]
  const parentOfSelected = selectedId && selectedId !== '__page__' ? findParentContainer(widgets, selectedId) : undefined
  const isChildOfContainer = !!parentOfSelected
  const size = canvasSize[device]
  const dsl = useMemo<PageDsl>(
    () => ({
      page: {
        id: 'demo-page',
        name: pageName,
        device,
        width: size.width,
        height: size.height,
        background: pageBackground,
        backgroundTransparent: pageBgTransparent,
        backgroundImage: pageBackgroundImage,
        backgroundSize: pageBackgroundSize,
        backgroundPosition: pageBackgroundPosition,
        backgroundRepeat: pageBackgroundRepeat,
      },
      widgets,
    }),
    [device, pageBackground, pageBgTransparent, pageBackgroundImage, pageBackgroundSize, pageBackgroundPosition, pageBackgroundRepeat, pageName, size.height, size.width, widgets],
  )

  useEffect(() => {
    setSourceText(stringifyDsl(dsl))
    try { localStorage.setItem('funlab-dsl', JSON.stringify(dsl)) } catch { /* ignore */ }
  }, [dsl])

  useEffect(() => {
    try { localStorage.setItem('funlab-custom-components', JSON.stringify(customComponents)) } catch { /* ignore */ }
  }, [customComponents])

  const addWidget = (template: WidgetTemplate, containerId?: string) => {
    const widget = createWidget(template)
    if (containerId) {
      setWidgets((current) =>
        updateWidgetInTree(current, containerId, (c) => ({
          ...c,
          children: [...(c.children ?? []), widget],
        })),
      )
    } else {
      setWidgets((current) => [...current, widget])
    }
    setSelectedId(widget.id)
  }

  const updateSelected = (patch: Partial<WidgetSchema>) => {
    if (!selected) return
    setWidgets((current) =>
      updateWidgetInTree(current, selected.id, (w) => ({ ...w, ...patch })),
    )
  }

  const updateLayout = (key: keyof Layout, value: number) => {
    if (!selected) return
    updateSelected({ layout: { ...selected.layout, [key]: value } })
  }

  const updateStyle = (key: keyof WidgetSchema['style'], value: string | number) => {
    if (!selected) return
    updateSelected({ style: { ...selected.style, [key]: value } })
  }

  const updateProp = (key: string, value: string) => {
    if (!selected) return
    updateSelected({ props: { ...selected.props, [key]: value } })
  }

  const updateAnimation = (key: keyof WidgetSchema['animation'], value: string | number) => {
    if (!selected) return
    updateSelected({ animation: { ...selected.animation, [key]: value } })
  }

  const getSelectedActions = () => selected?.events[eventTrigger] ?? []

  const updateActions = (actions: EventAction[]) => {
    if (!selected) return
    updateSelected({ events: { ...selected.events, [eventTrigger]: actions } })
  }

  const addAction = (type: EventActionType) => {
    updateActions([...getSelectedActions(), createAction(type)])
  }

  const updateAction = (id: string, patch: Partial<EventAction>) => {
    updateActions(getSelectedActions().map((action) => (action.id === id ? { ...action, ...patch } : action)))
  }

  const removeAction = (id: string) => {
    updateActions(getSelectedActions().filter((action) => action.id !== id))
  }

  const removeSelected = () => {
    if (!selected) return
    setWidgets((current) => {
      const next = removeWidgetFromTree(current, selected.id)
      setSelectedId(next[0]?.id ?? '')
      return next
    })
  }

  const duplicateSelected = () => {
    if (!selected) return
    const copy = cloneWidget(selected)
    copy.name = `${selected.name} 副本`
    copy.layout = { ...selected.layout, x: selected.layout.x + 16, y: selected.layout.y + 16 }

    const parentContainer = findParentContainer(widgets, selected.id)
    if (parentContainer) {
      setWidgets((current) =>
        updateWidgetInTree(current, parentContainer.id, (c) => ({
          ...c,
          children: [...(c.children ?? []), copy],
        })),
      )
    } else {
      setWidgets((current) => [...current, copy])
    }
    setSelectedId(copy.id)
  }

  const moveLayer = (id: string, direction: 'up' | 'down') => {
    setWidgets((current) =>
      updateWidgetInTree(current, id, (w) => ({
        ...w,
        layout: {
          ...w.layout,
          zIndex: direction === 'up' ? w.layout.zIndex + 1 : Math.max(0, w.layout.zIndex - 1),
        },
      })),
    )
  }

  /** 在容器内移动子项 */
  const moveChild = (containerId: string, childId: string, direction: 'up' | 'down') => {
    setWidgets((current) => moveChildInContainer(current, containerId, childId, direction))
  }

  const saveAsComponent = (name: string) => {
    if (!selected) return
    // 保存时清除 id，使用时由 cloneWidget 重新生成
    const snapshot = cloneWidget(selected)
    const component: CustomComponent = {
      id: `cc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      createdAt: Date.now(),
      widgets: [snapshot],
    }
    setCustomComponents((prev) => [...prev, component])
  }

  const deleteCustomComponent = (id: string) => {
    setCustomComponents((prev) => prev.filter((c) => c.id !== id))
  }

  const addCustomComponent = (component: CustomComponent) => {
    const cloned = component.widgets.map((w) => {
      const copy = cloneWidget(w)
      copy.layout = { ...copy.layout, x: 48, y: 80 }
      return copy
    })
    setWidgets((current) => [...current, ...cloned])
    if (cloned[0]) setSelectedId(cloned[0].id)
  }

  const applySource = () => {
    try {
      const next = JSON.parse(sourceText) as PageDsl
      if (!Array.isArray(next.widgets)) throw new Error('widgets 必须是数组')
      const invalid = next.widgets.find((widget) => !widgetTypeSet.has(widget.type))
      if (invalid) throw new Error(`未注册组件类型：${invalid.type}`)

      const nextDevice = next.page?.device === 'pc' ? 'pc' : 'mobile'
      setDevice(nextDevice)
      setPageName(next.page?.name || '未命名页面')
      setPageBackground(next.page?.background || '#f2f4f8')
      setPageBgTransparent(!!next.page?.backgroundTransparent)
      setPageBackgroundImage(next.page?.backgroundImage || '')
      setPageBackgroundSize(next.page?.backgroundSize || 'cover')
      setPageBackgroundPosition(next.page?.backgroundPosition || 'center')
      setPageBackgroundRepeat(next.page?.backgroundRepeat || 'no-repeat')
      const normalized = next.widgets.map(normalizeWidget)
      setWidgets(normalized)
      setSelectedId(normalized[0]?.id ?? '')
      setSourceError('')
    } catch (error) {
      setSourceError(error instanceof Error ? error.message : 'DSL 解析失败')
    }
  }

  return (
    <main className={`gods-shell gods-shell--nested ${mode === 'preview' ? 'preview-mode' : ''}`}>
      <header className="gods-header">
        <div className="gods-logo">
          <strong>Gods Pen Studio</strong>
          <span>H5 可视化搭建</span>
        </div>
        <div className="header-actions">
          <button type="button">保存</button>
          <button type="button">发布</button>
          <button type="button" onClick={() => {
            try {
              const json = JSON.stringify(dsl)
              const encoded = btoa(unescape(encodeURIComponent(json)))
              const url = `${window.location.origin}/preview#${encoded}`
              void navigator.clipboard.writeText(url)
              alert('预览链接已复制到剪贴板')
            } catch { alert('生成链接失败') }
          }}>复制链接</button>
        </div>
        <div className="header-switches">
          <Segmented<DeviceType>
            value={device}
            options={[
              ['mobile', '移动端'],
              ['pc', 'PC'],
            ]}
            onChange={setDevice}
          />
          <Segmented<Mode>
            value={mode}
            options={[
              ['edit', '编辑'],
              ['preview', '预览'],
            ]}
            onChange={setMode}
          />
        </div>
      </header>

      {mode === 'edit' ? (
        <section className="gods-workbench">
          <aside className="left-rail">
            <button className={leftTab === 'materials' ? 'active' : ''} type="button" onClick={() => setLeftTab('materials')}>
              组件
            </button>
            <button className={leftTab === 'layers' ? 'active' : ''} type="button" onClick={() => setLeftTab('layers')}>
              图层
            </button>
            <button className={leftTab === 'templates' ? 'active' : ''} type="button" onClick={() => setLeftTab('templates')}>
              模板
            </button>
          </aside>

          <aside className="left-panel">
            {leftTab === 'materials' && (
              <>
                <PanelTitle title="组件物料" subtitle="拖拽或点击添加到画布" />
                <div className="material-list">
                  {widgetTemplates.map((template) => (
                    <button
                      className="material-card"
                      draggable
                      key={template.type}
                      type="button"
                      onClick={() => addWidget(template)}
                      onDragStart={(event) => {
                        event.dataTransfer.setData('widgetType', template.type)
                      }}
                    >
                      <span>{template.name.slice(0, 1)}</span>
                      <strong>{template.name}</strong>
                      <small>{template.group}</small>
                    </button>
                  ))}
                </div>
                {customComponents.length > 0 && (
                  <>
                    <PanelTitle title="自定义组件" subtitle="已保存的组件模板" />
                    <div className="material-list">
                      {customComponents.map((comp) => (
                        <div className="material-card custom-component-card" key={comp.id}>
                          <button
                            className="custom-component-main"
                            type="button"
                            onClick={() => addCustomComponent(comp)}
                          >
                            <span>{comp.name.slice(0, 1)}</span>
                            <strong>{comp.name}</strong>
                            <small>{comp.widgets.length > 1 ? `${comp.widgets.length}个组件` : comp.widgets[0]?.type ?? '组件'}</small>
                          </button>
                          <button
                            className="custom-component-delete"
                            type="button"
                            title="删除"
                            onClick={() => deleteCustomComponent(comp.id)}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {leftTab === 'layers' && (
              <>
                <PanelTitle title="页面图层" subtitle="选择、调整层级" />
                <div className="layer-list">
                  <button
                    className={`layer-row ${selectedId === '__page__' ? 'active' : ''}`}
                    type="button"
                    onClick={() => setSelectedId('__page__')}
                  >
                    <span>page</span>
                    <strong>{pageName}</strong>
                    <small>根</small>
                  </button>
                  {[...widgets]
                    .sort((a, b) => b.layout.zIndex - a.layout.zIndex)
                    .map((widget) => (
                      <LayerRow
                        key={widget.id}
                        widget={widget}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onMoveChild={moveChild}
                        depth={0}
                      />
                    ))}
                </div>
              </>
            )}

            {leftTab === 'templates' && (
              <>
                <PanelTitle title="页面模板" subtitle="快速生成场景页" />
                <div className="template-card">
                  <strong>营销落地页</strong>
                  <p>公告、标题、头图、按钮和推荐列表组合。</p>
                  <button
                    type="button"
                    onClick={() => {
                      const next = initialWidgets.map((widget) => ({
                        ...widget,
                        id: `${widget.id}-tpl-${Math.random().toString(16).slice(2)}`,
                      }))
                      setWidgets(next)
                      setSelectedId(next[1]?.id ?? '')
                    }}
                  >
                    使用模板
                  </button>
                </div>
              </>
            )}
          </aside>

          <section className="design-stage">
            <div className="stage-topbar">
              <div>
                <label>
                  页面名称
                  <input value={pageName} onChange={(event) => setPageName(event.target.value)} />
                </label>
                <label>
                  背景
                  <input
                    type="color"
                    value={pageBackground}
                    onChange={(event) => setPageBackground(event.target.value)}
                  />
                </label>
                <label>
                  背景图
                  <input
                    placeholder="图片 URL"
                    value={pageBackgroundImage}
                    onChange={(event) => setPageBackgroundImage(event.target.value)}
                  />
                </label>
              </div>
              <div>
                <button type="button" onClick={duplicateSelected} disabled={!selected || selectedId === '__page__'}>
                  复制
                </button>
                <button type="button" onClick={() => selected && moveLayer(selected.id, 'up')} disabled={!selected || selectedId === '__page__'}>
                  上移层级
                </button>
                <button type="button" onClick={() => selected && moveLayer(selected.id, 'down')} disabled={!selected || selectedId === '__page__'}>
                  下移层级
                </button>
                <button type="button" className="danger" onClick={removeSelected} disabled={!selected || selectedId === '__page__'}>
                  删除
                </button>
              </div>
            </div>
            <Canvas
              device={device}
              dsl={dsl}
              mode="edit"
              selectedId={selected?.id}
              isPageSelected={selectedId === '__page__'}
              dropTargetId={dropTargetId}
              onAddWidget={addWidget}
              onDuplicate={duplicateSelected}
              onMoveLayer={(dir) => selected && moveLayer(selected.id, dir)}
              onMoveChild={moveChild}
              onRemove={removeSelected}
              onSelect={setSelectedId}
              onSelectPage={() => setSelectedId('__page__')}
              onSetDropTarget={setDropTargetId}
              onUpdateLayout={(id, layout) => {
                setWidgets((current) =>
                  updateWidgetInTree(current, id, (w) => ({
                    ...w,
                    layout: { ...w.layout, ...layout },
                  })),
                )
              }}
              onSaveAsComponent={() => {
                const name = window.prompt('请输入组件名称', selected?.name ?? '自定义组件')
                if (name) saveAsComponent(name)
              }}
            />
          </section>

          <aside className="inspector">
            <div className="inspector-tabs">
              <button className={rightTab === 'props' ? 'active' : ''} type="button" onClick={() => setRightTab('props')}>
                属性
              </button>
              <button className={rightTab === 'style' ? 'active' : ''} type="button" onClick={() => setRightTab('style')}>
                样式
              </button>
              <button className={rightTab === 'action' ? 'active' : ''} type="button" onClick={() => setRightTab('action')}>
                交互
              </button>
              <button className={rightTab === 'flow' ? 'active' : ''} type="button" onClick={() => setRightTab('flow')}>
                编排
              </button>
              <button className={rightTab === 'source' ? 'active' : ''} type="button" onClick={() => setRightTab('source')}>
                源码
              </button>
            </div>

            {rightTab !== 'source' && selectedId === '__page__' ? (
              rightTab === 'props' && (
                <div className="inspector-content">
                  <ConfigSection title="页面配置">
                    <label>
                      页面名称
                      <input value={pageName} onChange={(event) => setPageName(event.target.value)} />
                    </label>
                    <div className="field-grid">
                      <label>
                        设备
                        <select value={device} onChange={(event) => setDevice(event.target.value as DeviceType)}>
                          <option value="mobile">移动端</option>
                          <option value="pc">PC</option>
                        </select>
                      </label>
                      <label>
                        背景色
                        <input type="color" value={pageBackground} disabled={pageBgTransparent} onChange={(event) => setPageBackground(event.target.value)} />
                      </label>
                    </div>
                    <label className="switch-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
                      透明背景
                      <input type="checkbox" checked={pageBgTransparent} onChange={(event) => setPageBgTransparent(event.target.checked)} />
                    </label>
                    <label>
                      背景图 URL
                      <input placeholder="https://example.com/bg.jpg" value={pageBackgroundImage} onChange={(event) => setPageBackgroundImage(event.target.value)} />
                    </label>
                    {pageBackgroundImage && (
                      <>
                        <label>
                          背景尺寸
                          <select value={pageBackgroundSize} onChange={(event) => setPageBackgroundSize(event.target.value)}>
                            <option value="cover">cover（铺满）</option>
                            <option value="contain">contain（包含）</option>
                            <option value="auto">auto（原始大小）</option>
                            <option value="100% 100%">100% 100%（拉伸）</option>
                          </select>
                        </label>
                        <label>
                          背景位置
                          <select value={pageBackgroundPosition} onChange={(event) => setPageBackgroundPosition(event.target.value)}>
                            <option value="center">居中</option>
                            <option value="top">顶部</option>
                            <option value="bottom">底部</option>
                            <option value="left">左侧</option>
                            <option value="right">右侧</option>
                          </select>
                        </label>
                        <label>
                          背景重复
                          <select value={pageBackgroundRepeat} onChange={(event) => setPageBackgroundRepeat(event.target.value)}>
                            <option value="no-repeat">不重复</option>
                            <option value="repeat">平铺</option>
                            <option value="repeat-x">水平重复</option>
                            <option value="repeat-y">垂直重复</option>
                          </select>
                        </label>
                      </>
                    )}
                  </ConfigSection>
                </div>
              )
            ) : rightTab !== 'source' && selected ? (
              <div className="inspector-content">
                {rightTab === 'props' && (
                  <ConfigSection title={`${selected.name} / ${selected.type}`}>
                    <label>
                      组件名称
                      <input value={selected.name} onChange={(event) => updateSelected({ name: event.target.value })} />
                    </label>
                    {Object.entries(selected.props).map(([key, value]) => (
                      <label key={key}>
                        {propLabel(key)}
                        <input value={value} onChange={(event) => updateProp(key, event.target.value)} />
                      </label>
                    ))}
                    <div className="field-grid">
                      {(['x', 'y', 'width', 'height', 'zIndex'] as const).map((key) => (
                        <label key={key}>
                          {layoutLabel(key)}
                          <input
                            type="number"
                            value={selected.layout[key]}
                            onChange={(event) => updateLayout(key, Number(event.target.value))}
                          />
                        </label>
                      ))}
                    </div>
                  </ConfigSection>
                )}

                {rightTab === 'style' && (
                  <ConfigSection title="样式配置">
                    <label>
                      背景色
                      <input
                        type="color"
                        value={selected.style.background}
                        onChange={(event) => updateStyle('background', event.target.value)}
                      />
                    </label>
                    <label>
                      背景图 URL
                      <input
                        placeholder="https://example.com/bg.jpg"
                        value={selected.style.backgroundImage}
                        onChange={(event) => updateStyle('backgroundImage', event.target.value)}
                      />
                    </label>
                    {selected.style.backgroundImage && (
                      <>
                        <label>
                          背景尺寸
                          <select
                            value={selected.style.backgroundSize}
                            onChange={(event) => updateStyle('backgroundSize', event.target.value)}
                          >
                            <option value="cover">cover（铺满）</option>
                            <option value="contain">contain（包含）</option>
                            <option value="auto">auto（原始大小）</option>
                            <option value="100% 100%">100% 100%（拉伸）</option>
                          </select>
                        </label>
                        <label>
                          背景位置
                          <select
                            value={selected.style.backgroundPosition}
                            onChange={(event) => updateStyle('backgroundPosition', event.target.value)}
                          >
                            <option value="center">居中</option>
                            <option value="top">顶部</option>
                            <option value="bottom">底部</option>
                            <option value="left">左侧</option>
                            <option value="right">右侧</option>
                            <option value="top left">左上</option>
                            <option value="top right">右上</option>
                            <option value="bottom left">左下</option>
                            <option value="bottom right">右下</option>
                          </select>
                        </label>
                        <label>
                          背景重复
                          <select
                            value={selected.style.backgroundRepeat}
                            onChange={(event) => updateStyle('backgroundRepeat', event.target.value)}
                          >
                            <option value="no-repeat">不重复</option>
                            <option value="repeat">平铺</option>
                            <option value="repeat-x">水平重复</option>
                            <option value="repeat-y">垂直重复</option>
                          </select>
                        </label>
                      </>
                    )}
                    <label>
                      文本色
                      <input
                        type="color"
                        value={selected.style.color}
                        onChange={(event) => updateStyle('color', event.target.value)}
                      />
                    </label>
                    <label>
                      字号 {selected.style.fontSize}px
                      <input
                        type="range"
                        min="10"
                        max="36"
                        value={selected.style.fontSize}
                        onChange={(event) => updateStyle('fontSize', Number(event.target.value))}
                      />
                    </label>
                    <label>
                      圆角 {selected.style.radius}px
                      <input
                        type="range"
                        min="0"
                        max="36"
                        value={selected.style.radius}
                        onChange={(event) => updateStyle('radius', Number(event.target.value))}
                      />
                    </label>
                    <label>
                      透明度 {selected.style.opacity}%
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={selected.style.opacity}
                        onChange={(event) => updateStyle('opacity', Number(event.target.value))}
                      />
                    </label>
                    <label>
                      内边距 {selected.style.padding}px
                      <input
                        type="range"
                        min="0"
                        max="40"
                        value={selected.style.padding}
                        onChange={(event) => updateStyle('padding', Number(event.target.value))}
                      />
                    </label>
                    <label>
                      外边距 {selected.style.margin}px
                      <input
                        type="range"
                        min="0"
                        max="40"
                        value={selected.style.margin}
                        onChange={(event) => updateStyle('margin', Number(event.target.value))}
                      />
                    </label>
                    <label>
                      排列方向
                      <select
                        value={selected.style.flexDirection}
                        onChange={(event) => updateStyle('flexDirection', event.target.value)}
                      >
                        <option value="row">水平（row）</option>
                        <option value="column">垂直（column）</option>
                        <option value="row-reverse">水平反向</option>
                        <option value="column-reverse">垂直反向</option>
                      </select>
                    </label>
                    <h3 className="config-subtitle">布局属性</h3>
                    <label>
                      溢出
                      <select
                        value={selected.style.overflow ?? 'hidden'}
                        onChange={(event) => updateStyle('overflow', event.target.value)}
                      >
                        <option value="hidden">隐藏（hidden）</option>
                        <option value="visible">可见（visible）</option>
                        <option value="scroll">滚动（scroll）</option>
                        <option value="auto">自动（auto）</option>
                      </select>
                    </label>
                    <div className="field-grid">
                      <label>
                        最小宽度
                        <input
                          placeholder="auto / 100px"
                          value={selected.style.minWidth ?? ''}
                          onChange={(event) => updateStyle('minWidth', event.target.value)}
                        />
                      </label>
                      <label>
                        最大宽度
                        <input
                          placeholder="none / 300px"
                          value={selected.style.maxWidth ?? ''}
                          onChange={(event) => updateStyle('maxWidth', event.target.value)}
                        />
                      </label>
                      <label>
                        最小高度
                        <input
                          placeholder="auto / 100px"
                          value={selected.style.minHeight ?? ''}
                          onChange={(event) => updateStyle('minHeight', event.target.value)}
                        />
                      </label>
                      <label>
                        最大高度
                        <input
                          placeholder="none / 300px"
                          value={selected.style.maxHeight ?? ''}
                          onChange={(event) => updateStyle('maxHeight', event.target.value)}
                        />
                      </label>
                    </div>
                    <h3 className="config-subtitle">边框</h3>
                    <div className="field-grid">
                      <label>
                        边框宽度
                        <input
                          type="number"
                          min="0"
                          value={selected.style.borderWidth ?? 0}
                          onChange={(event) => updateStyle('borderWidth', Number(event.target.value))}
                        />
                      </label>
                      <label>
                        边框样式
                        <select
                          value={selected.style.borderStyle ?? 'solid'}
                          onChange={(event) => updateStyle('borderStyle', event.target.value)}
                        >
                          <option value="solid">实线</option>
                          <option value="dashed">虚线</option>
                          <option value="dotted">点线</option>
                          <option value="double">双线</option>
                          <option value="none">无</option>
                        </select>
                      </label>
                    </div>
                    <label>
                      边框颜色
                      <input
                        type="color"
                        value={selected.style.borderColor ?? '#000000'}
                        onChange={(event) => updateStyle('borderColor', event.target.value)}
                      />
                    </label>
                    <label>
                      阴影
                      <input
                        placeholder="0 2px 8px rgba(0,0,0,0.15)"
                        value={selected.style.boxShadow ?? ''}
                        onChange={(event) => updateStyle('boxShadow', event.target.value)}
                      />
                    </label>
                    <h3 className="config-subtitle">文本</h3>
                    <div className="field-grid">
                      <label>
                        字重
                        <select
                          value={selected.style.fontWeight ?? 400}
                          onChange={(event) => updateStyle('fontWeight', Number(event.target.value))}
                        >
                          <option value={300}>细体（300）</option>
                          <option value={400}>常规（400）</option>
                          <option value={500}>中等（500）</option>
                          <option value={600}>半粗（600）</option>
                          <option value={700}>粗体（700）</option>
                          <option value={800}>特粗（800）</option>
                        </select>
                      </label>
                      <label>
                        对齐
                        <select
                          value={selected.style.textAlign ?? 'left'}
                          onChange={(event) => updateStyle('textAlign', event.target.value)}
                        >
                          <option value="left">左对齐</option>
                          <option value="center">居中</option>
                          <option value="right">右对齐</option>
                          <option value="justify">两端对齐</option>
                        </select>
                      </label>
                    </div>
                    <label>
                      行高 {selected.style.lineHeight ?? 1.5}
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={selected.style.lineHeight ?? 1.5}
                        onChange={(event) => updateStyle('lineHeight', Number(event.target.value))}
                      />
                    </label>
                    {selected.type === 'image' && (
                      <>
                        <h3 className="config-subtitle">图片</h3>
                        <label>
                          填充方式
                          <select
                            value={selected.style.objectFit ?? 'cover'}
                            onChange={(event) => updateStyle('objectFit', event.target.value)}
                          >
                            <option value="cover">裁剪填充（cover）</option>
                            <option value="contain">完整包含（contain）</option>
                            <option value="fill">拉伸填充（fill）</option>
                            <option value="none">原始大小（none）</option>
                          </select>
                        </label>
                      </>
                    )}
                    {isChildOfContainer && (
                      <>
                        <h3 className="config-subtitle">容器子项布局</h3>
                        <div className="field-grid">
                          <label>
                            flex-grow
                            <input
                              type="number"
                              min="0"
                              value={selected.props.flexGrow ?? '0'}
                              onChange={(event) => updateProp('flexGrow', event.target.value)}
                            />
                          </label>
                          <label>
                            flex-shrink
                            <input
                              type="number"
                              min="0"
                              value={selected.props.flexShrink ?? '1'}
                              onChange={(event) => updateProp('flexShrink', event.target.value)}
                            />
                          </label>
                        </div>
                        <label>
                          flex-basis
                          <input
                            placeholder="auto / 100px / 50%"
                            value={selected.props.flexBasis ?? 'auto'}
                            onChange={(event) => updateProp('flexBasis', event.target.value)}
                          />
                        </label>
                        <label>
                          align-self
                          <select
                            value={selected.props.alignSelf ?? 'auto'}
                            onChange={(event) => updateProp('alignSelf', event.target.value)}
                          >
                            <option value="auto">跟随容器（auto）</option>
                            <option value="flex-start">起点</option>
                            <option value="center">居中</option>
                            <option value="flex-end">终点</option>
                            <option value="stretch">拉伸</option>
                          </select>
                        </label>
                        <label>
                          子项宽度
                          <input
                            placeholder="auto / 100px / 50%"
                            value={selected.props.childWidth ?? 'auto'}
                            onChange={(event) => updateProp('childWidth', event.target.value)}
                          />
                        </label>
                      </>
                    )}
                    {selected.type === 'modal' && (
                      <>
                        <h3 className="config-subtitle">弹窗样式</h3>
                        <label>
                          遮罩颜色
                          <input
                            placeholder="rgba(0,0,0,0.45)"
                            value={selected.style.backdropColor ?? ''}
                            onChange={(event) => updateStyle('backdropColor', event.target.value)}
                          />
                        </label>
                        <label>
                          标题栏背景
                          <input
                            type="color"
                            value={selected.style.headerBg ?? '#ffffff'}
                            onChange={(event) => updateStyle('headerBg', event.target.value)}
                          />
                        </label>
                        <label>
                          标题文字色
                          <input
                            type="color"
                            value={selected.style.headerColor ?? '#111827'}
                            onChange={(event) => updateStyle('headerColor', event.target.value)}
                          />
                        </label>
                        <label>
                          标题栏边框色
                          <input
                            type="color"
                            value={selected.style.headerBorderColor ?? '#edf1f7'}
                            onChange={(event) => updateStyle('headerBorderColor', event.target.value)}
                          />
                        </label>
                        <label>
                          内容文字色
                          <input
                            type="color"
                            value={selected.style.bodyColor ?? '#374151'}
                            onChange={(event) => updateStyle('bodyColor', event.target.value)}
                          />
                        </label>
                        <label>
                          确认按钮背景
                          <input
                            type="color"
                            value={selected.style.confirmBg ?? '#1677ff'}
                            onChange={(event) => updateStyle('confirmBg', event.target.value)}
                          />
                        </label>
                        <label>
                          确认按钮文字色
                          <input
                            type="color"
                            value={selected.style.confirmColor ?? '#ffffff'}
                            onChange={(event) => updateStyle('confirmColor', event.target.value)}
                          />
                        </label>
                        <label>
                          确认按钮圆角 {selected.style.confirmRadius ?? 6}px
                          <input
                            type="range"
                            min="0"
                            max="24"
                            value={selected.style.confirmRadius ?? 6}
                            onChange={(event) => updateStyle('confirmRadius', Number(event.target.value))}
                          />
                        </label>
                        <label>
                          关闭按钮颜色
                          <input
                            type="color"
                            value={selected.style.closeColor ?? '#98a2b3'}
                            onChange={(event) => updateStyle('closeColor', event.target.value)}
                          />
                        </label>
                        <label>
                          弹窗阴影
                          <input
                            placeholder="0 8px 30px rgba(0,0,0,0.15)"
                            value={selected.style.modalShadow ?? ''}
                            onChange={(event) => updateStyle('modalShadow', event.target.value)}
                          />
                        </label>
                        <label>
                          弹窗边框色
                          <input
                            type="color"
                            value={selected.style.modalBorderColor ?? 'transparent'}
                            onChange={(event) => updateStyle('modalBorderColor', event.target.value)}
                          />
                        </label>
                      </>
                    )}
                    {selected.type === 'container' && (
                      <>
                        <h3 className="config-subtitle">容器布局</h3>
                        <label>
                          子项排列
                          <select
                            value={selected.props.direction ?? 'column'}
                            onChange={(event) => updateProp('direction', event.target.value)}
                          >
                            <option value="row">水平排列</option>
                            <option value="column">垂直排列</option>
                          </select>
                        </label>
                        <label>
                          主轴对齐
                          <select
                            value={selected.props.justify ?? 'flex-start'}
                            onChange={(event) => updateProp('justify', event.target.value)}
                          >
                            <option value="flex-start">起点</option>
                            <option value="center">居中</option>
                            <option value="flex-end">终点</option>
                            <option value="space-between">两端对齐</option>
                            <option value="space-around">环绕分布</option>
                          </select>
                        </label>
                        <label>
                          交叉轴对齐
                          <select
                            value={selected.props.align ?? 'stretch'}
                            onChange={(event) => updateProp('align', event.target.value)}
                          >
                            <option value="stretch">拉伸</option>
                            <option value="flex-start">起点</option>
                            <option value="center">居中</option>
                            <option value="flex-end">终点</option>
                          </select>
                        </label>
                        <label>
                          间距 {selected.props.gap ?? 10}px
                          <input
                            type="range"
                            min="0"
                            max="30"
                            value={selected.props.gap ?? 10}
                            onChange={(event) => updateProp('gap', event.target.value)}
                          />
                        </label>
                        <label>
                          换行
                          <select
                            value={selected.props.wrap ?? 'nowrap'}
                            onChange={(event) => updateProp('wrap', event.target.value)}
                          >
                            <option value="nowrap">不换行</option>
                            <option value="wrap">换行</option>
                          </select>
                        </label>
                      </>
                    )}
                  </ConfigSection>
                )}

                {rightTab === 'action' && (
                  <ConfigSection title="动画和事件">
                    <label>
                      入场动画
                      <input
                        value={selected.animation.name}
                        onChange={(event) => updateAnimation('name', event.target.value)}
                      />
                    </label>
                    <div className="field-grid">
                      <label>
                        时长
                        <input
                          type="number"
                          value={selected.animation.duration}
                          onChange={(event) => updateAnimation('duration', Number(event.target.value))}
                        />
                      </label>
                      <label>
                        延迟
                        <input
                          type="number"
                          value={selected.animation.delay}
                          onChange={(event) => updateAnimation('delay', Number(event.target.value))}
                        />
                      </label>
                    </div>
                    <div className="event-builder">
                      <label>
                        触发事件
                        <select value={eventTrigger} onChange={(event) => setEventTrigger(event.target.value as EventTrigger)}>
                          {eventOptions.map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="action-adders">
                        {actionOptions.map(([type, label]) => (
                          <button key={type} type="button" onClick={() => addAction(type)}>
                            + {label}
                          </button>
                        ))}
                      </div>
                      <div className="action-list">
                        {getSelectedActions().length === 0 ? (
                          <div className="empty-state compact">当前事件还没有行为。</div>
                        ) : (
                          getSelectedActions().map((action, index) => (
                            <div className="action-card" key={action.id}>
                              <header>
                                <strong>{index + 1}. {actionLabel(action.type)}</strong>
                                <button type="button" onClick={() => removeAction(action.id)}>
                                  删除
                                </button>
                              </header>
                              <label>
                                行为类型
                                <select
                                  value={action.type}
                                  onChange={(event) => updateAction(action.id, { type: event.target.value as EventActionType })}
                                >
                                  {actionOptions.map(([type, label]) => (
                                    <option key={type} value={type}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                行为名称
                                <input value={action.label} onChange={(event) => updateAction(action.id, { label: event.target.value })} />
                              </label>
                              {(action.type === 'toast' || action.type === 'modal') && (
                                <>
                                  {action.type === 'modal' && (
                                    <label>
                                      弹窗标题
                                      <input value={action.title} onChange={(event) => updateAction(action.id, { title: event.target.value })} />
                                    </label>
                                  )}
                                  <label>
                                    内容
                                    <textarea value={action.message} onChange={(event) => updateAction(action.id, { message: event.target.value })} />
                                  </label>
                                </>
                              )}
                              {(action.type === 'request' || action.type === 'openUrl') && (
                                <label>
                                  地址
                                  <input value={action.url} onChange={(event) => updateAction(action.id, { url: event.target.value })} />
                                </label>
                              )}
                              {action.type === 'request' && (
                                <>
                                  <label>
                                    请求方式
                                    <select value={action.method} onChange={(event) => updateAction(action.id, { method: event.target.value as ApiMethod })}>
                                      <option value="GET">GET</option>
                                      <option value="POST">POST</option>
                                    </select>
                                  </label>
                                  <label>
                                    请求体 JSON
                                    <textarea value={action.body} onChange={(event) => updateAction(action.id, { body: event.target.value })} />
                                  </label>
                                </>
                              )}
                              {action.type === 'showModal' && (
                                <label>
                                  目标弹窗
                                  <select
                                    value={action.targetWidgetId}
                                    onChange={(event) => updateAction(action.id, { targetWidgetId: event.target.value })}
                                  >
                                    <option value="">请选择弹窗组件</option>
                                    {dsl.widgets
                                      .filter((w) => w.type === 'modal')
                                      .map((w) => (
                                        <option key={w.id} value={w.id}>
                                          {w.name}
                                        </option>
                                      ))}
                                  </select>
                                </label>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </ConfigSection>
                )}
              </div>
            ) : (
              rightTab !== 'source' && rightTab !== 'flow' && <div className="empty-state">请选择一个画布组件。</div>
            )}

            {rightTab === 'flow' && selected && selectedId !== '__page__' && (
              <div className="inspector-content">
                <FlowEditor
                  flow={selected.flow ?? { nodes: [], edges: [] }}
                  onChange={(flow: FlowGraph) => updateSelected({ flow })}
                  widgetNames={widgets.filter((w) => w.type === 'modal').map((w) => ({ id: w.id, name: w.name }))}
                />
              </div>
            )}
            {rightTab === 'flow' && (!selected || selectedId === '__page__') && (
              <div className="empty-state">页面组件不支持逻辑编排。</div>
            )}

            {rightTab === 'source' && (
              <div className="source-editor">
                <PanelTitle title="页面 DSL" subtitle="修改 JSON 后应用到画布" />
                <textarea
                  spellCheck={false}
                  value={sourceText}
                  onChange={(event) => {
                    setSourceText(event.target.value)
                    setSourceError('')
                  }}
                />
                <div className="source-actions">
                  <button type="button" onClick={() => setSourceText(stringifyDsl(dsl))}>
                    格式化
                  </button>
                  <button type="button" className="primary" onClick={applySource}>
                    应用源码
                  </button>
                </div>
                {sourceError && <p className="source-error">{sourceError}</p>}
              </div>
            )}
          </aside>
        </section>
      ) : (
        <section className="preview-wrap">
          <Canvas device={device} dsl={dsl} mode="preview" />
          <aside className="preview-card">
            <strong>在线预览</strong>
            <span>{pageName}</span>
            <div className="qr-mock">
              {Array.from({ length: 49 }, (_, index) => (
                <i key={index} className={(index * 7 + index) % 3 === 0 ? 'dark' : ''} />
              ))}
            </div>
            <p>扫码预览移动端页面</p>
          </aside>
        </section>
      )}
    </main>
  )
}

function Canvas({
  device,
  dsl,
  mode,
  selectedId,
  isPageSelected,
  dropTargetId,
  onAddWidget,
  onDuplicate,
  onMoveLayer,
  onMoveChild,
  onRemove,
  onSelect,
  onSelectPage,
  onSetDropTarget,
  onUpdateLayout,
  onSaveAsComponent,
}: {
  device: DeviceType
  dsl: PageDsl
  mode: Mode
  selectedId?: string
  isPageSelected?: boolean
  dropTargetId?: string | null
  onAddWidget?: (template: WidgetTemplate, containerId?: string) => void
  onDuplicate?: () => void
  onMoveLayer?: (direction: 'up' | 'down') => void
  onMoveChild?: (containerId: string, childId: string, direction: 'up' | 'down') => void
  onRemove?: () => void
  onSelect?: (id: string) => void
  onSelectPage?: () => void
  onSetDropTarget?: (id: string | null) => void
  onUpdateLayout?: (id: string, layout: Partial<Layout>) => void
  onSaveAsComponent?: () => void
}) {
  const [dragging, setDragging] = useState<{ id: string; dx: number; dy: number } | null>(null)
  const [resizing, setResizing] = useState<{ id: string; handle: string; startX: number; startY: number; startLayout: Layout } | null>(null)
  const [guides, setGuides] = useState<Array<{ type: 'h' | 'v'; pos: number }>>([])
  const [modal, setModal] = useState<{ title: string; message: string } | null>(null)
  const [toast, setToast] = useState('')
  const [visibleModals, setVisibleModals] = useState<Set<string>>(new Set())
  const size = canvasSize[device]

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  const showWidgetModal = (widgetId: string) => {
    setVisibleModals((prev) => new Set(prev).add(widgetId))
  }

  const hideWidgetModal = (widgetId: string) => {
    setVisibleModals((prev) => {
      const next = new Set(prev)
      next.delete(widgetId)
      return next
    })
  }

  const runFlowAction = async (config: Record<string, string>) => {
    if (config.actionType === 'toast') showToast(config.message)
    if (config.actionType === 'modal') setModal({ title: config.title ?? '提示', message: config.message })
    if (config.actionType === 'showModal' && config.targetWidgetId) showWidgetModal(config.targetWidgetId)
    if (config.actionType === 'openUrl') window.open(config.url, '_blank', 'noopener,noreferrer')
    if (config.actionType === 'request') {
      try {
        const init: RequestInit = { method: config.method }
        if (config.method === 'POST') { init.headers = { 'Content-Type': 'application/json' }; init.body = config.body }
        const response = await fetch(config.url, init)
        showToast(response.ok ? '请求成功' : `请求失败：${response.status}`)
      } catch { showToast('请求失败') }
    }
  }

  const runActions = async (widget: WidgetSchema, trigger: EventTrigger) => {
    // 优先使用逻辑编排
    if (widget.flow && widget.flow.nodes.length > 0) {
      await executeFlow(widget.flow, trigger, runFlowAction)
      return
    }

    const actions = widget.events[trigger] ?? []
    for (const action of actions) {
      if (action.type === 'toast') {
        showToast(action.message)
      }

      if (action.type === 'modal') {
        setModal({ title: action.title, message: action.message })
      }

      if (action.type === 'showModal' && action.targetWidgetId) {
        showWidgetModal(action.targetWidgetId)
      }

      if (action.type === 'openUrl') {
        window.open(action.url, '_blank', 'noopener,noreferrer')
      }

      if (action.type === 'request') {
        try {
          const init: RequestInit = { method: action.method }
          if (action.method === 'POST') {
            init.headers = { 'Content-Type': 'application/json' }
            init.body = action.body
          }
          const response = await fetch(action.url, init)
          showToast(response.ok ? `${action.label}成功` : `${action.label}失败：${response.status}`)
        } catch {
          showToast(`${action.label}失败，请检查接口地址`)
        }
      }
    }
  }

  return (
    <div className="canvas-scroll">
      <div
        className={`page-canvas ${device} ${isPageSelected ? 'page-selected' : ''}`}
        style={
          {
            width: size.width,
            height: size.height,
            '--page-bg': dsl.page.backgroundTransparent ? 'transparent' : dsl.page.background,
            '--page-bg-image': dsl.page.backgroundImage ? `url(${dsl.page.backgroundImage})` : 'none',
            '--page-bg-size': dsl.page.backgroundSize,
            '--page-bg-position': dsl.page.backgroundPosition,
            '--page-bg-repeat': dsl.page.backgroundRepeat,
          } as CSSProperties
        }
        onClick={() => {
          if (mode === 'edit') onSelectPage?.()
        }}
        onDragOver={(event) => mode === 'edit' && event.preventDefault()}
        onDrop={(event) => {
          if (mode !== 'edit' || !onAddWidget) return
          const widgetType = event.dataTransfer.getData('widgetType')
          const template = widgetTemplates.find((item) => item.type === widgetType)
          if (template) onAddWidget(template)
          onSetDropTarget?.(null)
        }}
        onMouseMove={(event) => {
          if (mode !== 'edit') return
          if (dragging) {
            const rect = event.currentTarget.getBoundingClientRect()
            let newX = Math.round(event.clientX - rect.left - dragging.dx)
            let newY = Math.round(event.clientY - rect.top - dragging.dy)
            const moved = dsl.widgets.find((w) => w.id === dragging.id)
            if (moved) {
              const SNAP = 5
              const otherEdges = { x: [] as number[], y: [] as number[] }
              for (const w of dsl.widgets) {
                if (w.id === dragging.id) continue
                otherEdges.x.push(w.layout.x, w.layout.x + w.layout.width, w.layout.x + w.layout.width / 2)
                otherEdges.y.push(w.layout.y, w.layout.y + w.layout.height, w.layout.y + w.layout.height / 2)
              }
              otherEdges.x.push(size.width / 2)
              otherEdges.y.push(size.height / 2)
              const newGuides: Array<{ type: 'h' | 'v'; pos: number }> = []
              const movingEdgesX = [newX, newX + moved.layout.width, newX + moved.layout.width / 2]
              const movingEdgesY = [newY, newY + moved.layout.height, newY + moved.layout.height / 2]
              for (const me of movingEdgesX) {
                for (const oe of otherEdges.x) {
                  if (Math.abs(me - oe) <= SNAP) { newX += oe - me; newGuides.push({ type: 'v', pos: oe }); break }
                }
              }
              for (const me of movingEdgesY) {
                for (const oe of otherEdges.y) {
                  if (Math.abs(me - oe) <= SNAP) { newY += oe - me; newGuides.push({ type: 'h', pos: oe }); break }
                }
              }
              setGuides(newGuides)
            }
            onUpdateLayout?.(dragging.id, { x: newX, y: newY })
          } else if (resizing) {
            const rect = event.currentTarget.getBoundingClientRect()
            const dx = event.clientX - resizing.startX
            const dy = event.clientY - resizing.startY
            const start = resizing.startLayout
            const handle = resizing.handle
            const newLayout: Partial<Layout> = {}

            if (handle.includes('right')) newLayout.width = Math.max(20, Math.round(start.width + dx))
            if (handle.includes('left')) { newLayout.width = Math.max(20, Math.round(start.width - dx)); newLayout.x = Math.round(start.x + dx) }
            if (handle.includes('bottom')) newLayout.height = Math.max(20, Math.round(start.height + dy))
            if (handle.includes('top') && handle !== 'top-left' && handle !== 'top-right') { newLayout.height = Math.max(20, Math.round(start.height - dy)); newLayout.y = Math.round(start.y + dy) }
            if (handle === 'top-left' || handle === 'top-right') { newLayout.height = Math.max(20, Math.round(start.height - dy)); newLayout.y = Math.round(start.y + dy) }

            onUpdateLayout?.(resizing.id, newLayout)
          }
        }}
        onMouseUp={() => { setDragging(null); setResizing(null); setGuides([]) }}
        onMouseLeave={() => { setDragging(null); setResizing(null); setGuides([]) }}
      >
        {dsl.widgets
          .slice()
          .sort((a, b) => a.layout.zIndex - b.layout.zIndex)
          .filter((widget) => mode === 'edit' || widget.type !== 'modal' || visibleModals.has(widget.id))
          .map((widget) => {
            const isModalOverlay = mode === 'preview' && widget.type === 'modal'
            return (
            <div
              className={`widget-box ${mode === 'edit' ? 'editable' : ''} ${selectedId === widget.id ? 'selected' : ''} ${dropTargetId === widget.id ? 'drop-target' : ''} ${isModalOverlay ? 'modal-overlay' : ''}`}
              key={widget.id}
              style={isModalOverlay ? {} : {
                left: widget.layout.x,
                top: widget.layout.y,
                width: widget.layout.width,
                height: widget.layout.height,
                zIndex: widget.layout.zIndex,
              }}
              onClick={(event) => {
                event.stopPropagation()
                if (mode === 'edit') {
                  onSelect?.(widget.id)
                  return
                }
                void runActions(widget, 'click')
              }}
              onDoubleClick={(event) => {
                event.stopPropagation()
                if (mode !== 'edit') void runActions(widget, 'doubleClick')
              }}
              onMouseEnter={() => {
                if (mode !== 'edit') void runActions(widget, 'mouseEnter')
              }}
              onMouseLeave={() => {
                if (mode !== 'edit') void runActions(widget, 'mouseLeave')
              }}
              onMouseDown={(event) => {
                if (mode !== 'edit') return
                const rect = event.currentTarget.getBoundingClientRect()
                setDragging({
                  id: widget.id,
                  dx: event.clientX - rect.left,
                  dy: event.clientY - rect.top,
                })
              }}
              onDragOver={(event) => {
                if (mode !== 'edit' || widget.type !== 'container') return
                event.preventDefault()
                event.stopPropagation()
                onSetDropTarget?.(widget.id)
              }}
              onDragLeave={() => {
                if (dropTargetId === widget.id) onSetDropTarget?.(null)
              }}
              onDrop={(event) => {
                if (mode !== 'edit' || widget.type !== 'container' || !onAddWidget) return
                event.preventDefault()
                event.stopPropagation()
                const widgetType = event.dataTransfer.getData('widgetType')
                const template = widgetTemplates.find((item) => item.type === widgetType)
                if (template) onAddWidget(template, widget.id)
                onSetDropTarget?.(null)
              }}
            >
              {mode === 'edit' && selectedId === widget.id && (
                <>
                  <div className="widget-toolbar">
                    <span className="toolbar-move">移动</span>
                    <button className="toolbar-btn" type="button" onClick={(event) => { event.stopPropagation(); onDuplicate?.() }}>复制</button>
                    <button className="toolbar-btn" type="button" onClick={(event) => { event.stopPropagation(); onMoveLayer?.('up') }}>上移</button>
                    <button className="toolbar-btn" type="button" onClick={(event) => { event.stopPropagation(); onMoveLayer?.('down') }}>下移</button>
                    <button className="toolbar-btn" type="button" onClick={(event) => { event.stopPropagation(); onSaveAsComponent?.() }}>存为组件</button>
                    <button className="toolbar-btn toolbar-delete" type="button" onClick={(event) => { event.stopPropagation(); onRemove?.() }}>删除</button>
                  </div>
                  <div className="resize-handle top-left" onMouseDown={(event) => { event.stopPropagation(); setResizing({ id: widget.id, handle: 'top-left', startX: event.clientX, startY: event.clientY, startLayout: { ...widget.layout } }) }} />
                  <div className="resize-handle top-right" onMouseDown={(event) => { event.stopPropagation(); setResizing({ id: widget.id, handle: 'top-right', startX: event.clientX, startY: event.clientY, startLayout: { ...widget.layout } }) }} />
                  <div className="resize-handle bottom-left" onMouseDown={(event) => { event.stopPropagation(); setResizing({ id: widget.id, handle: 'bottom-left', startX: event.clientX, startY: event.clientY, startLayout: { ...widget.layout } }) }} />
                  <div className="resize-handle bottom-right" onMouseDown={(event) => { event.stopPropagation(); setResizing({ id: widget.id, handle: 'bottom-right', startX: event.clientX, startY: event.clientY, startLayout: { ...widget.layout } }) }} />
                  <div className="resize-handle top" onMouseDown={(event) => { event.stopPropagation(); setResizing({ id: widget.id, handle: 'top', startX: event.clientX, startY: event.clientY, startLayout: { ...widget.layout } }) }} />
                  <div className="resize-handle bottom" onMouseDown={(event) => { event.stopPropagation(); setResizing({ id: widget.id, handle: 'bottom', startX: event.clientX, startY: event.clientY, startLayout: { ...widget.layout } }) }} />
                  <div className="resize-handle left" onMouseDown={(event) => { event.stopPropagation(); setResizing({ id: widget.id, handle: 'left', startX: event.clientX, startY: event.clientY, startLayout: { ...widget.layout } }) }} />
                  <div className="resize-handle right" onMouseDown={(event) => { event.stopPropagation(); setResizing({ id: widget.id, handle: 'right', startX: event.clientX, startY: event.clientY, startLayout: { ...widget.layout } }) }} />
                </>
              )}
              <WidgetRenderer
                mode={mode}
                selectedId={selectedId}
                widget={widget}
                dropTargetId={dropTargetId}
                onDuplicate={onDuplicate}
                onRemove={onRemove}
                onSelect={onSelect}
                onCloseModal={() => hideWidgetModal(widget.id)}
                onSubmit={() => {
                  void runActions(widget, 'submit')
                }}
                onSaveAsComponent={onSaveAsComponent}
                onAddWidget={onAddWidget}
                onSetDropTarget={onSetDropTarget}
                onMoveChild={onMoveChild}
              />
            </div>
          )})}
        {mode === 'edit' && guides.map((g, i) => (
          <div key={`guide-${i}`} className={`guide-line ${g.type === 'v' ? 'guide-v' : 'guide-h'}`} style={g.type === 'v' ? { left: g.pos } : { top: g.pos }} />
        ))}
        {mode === 'edit' && (dragging || resizing) && (() => {
          const targetId = dragging?.id ?? resizing?.id
          const target = dsl.widgets.find((w) => w.id === targetId)
          if (!target) return null
          return (
            <div className="layout-tooltip" style={{ left: target.layout.x, top: target.layout.y + target.layout.height + 6 }}>
              X:{target.layout.x}  Y:{target.layout.y}  W:{target.layout.width}  H:{target.layout.height}
            </div>
          )
        })()}
        {toast && <div className="runtime-toast">{toast}</div>}
        {modal && (
          <div className="runtime-modal" role="dialog" aria-modal="true">
            <section>
              <h2>{modal.title}</h2>
              <p>{modal.message}</p>
              <button type="button" onClick={() => setModal(null)}>
                确定
              </button>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

function WidgetRenderer({
  mode,
  selectedId,
  widget,
  dropTargetId,
  onDuplicate,
  onRemove,
  onSelect,
  onCloseModal,
  onSubmit,
  onSaveAsComponent,
  onAddWidget,
  onSetDropTarget,
  onMoveChild,
}: {
  mode: Mode
  selectedId?: string
  widget: WidgetSchema
  dropTargetId?: string | null
  onDuplicate?: () => void
  onRemove?: () => void
  onSelect?: (id: string) => void
  onCloseModal?: () => void
  onSubmit: () => void
  onSaveAsComponent?: () => void
  onAddWidget?: (template: WidgetTemplate, containerId?: string) => void
  onSetDropTarget?: (id: string | null) => void
  onMoveChild?: (containerId: string, childId: string, direction: 'up' | 'down') => void
}) {
  const style = {
    '--widget-bg': widget.style.background,
    '--widget-bg-image': widget.style.backgroundImage ? `url(${widget.style.backgroundImage})` : 'none',
    '--widget-bg-size': widget.style.backgroundSize,
    '--widget-bg-position': widget.style.backgroundPosition,
    '--widget-bg-repeat': widget.style.backgroundRepeat,
    '--widget-color': widget.style.color,
    '--widget-radius': `${widget.style.radius}px`,
    '--widget-font': `${widget.style.fontSize}px`,
    '--widget-opacity': widget.style.opacity / 100,
    '--widget-padding': `${widget.style.padding}px`,
    '--widget-margin': `${widget.style.margin}px`,
    '--widget-flex-dir': widget.style.flexDirection,
    '--widget-overflow': widget.style.overflow ?? 'hidden',
    '--widget-min-w': widget.style.minWidth || 'unset',
    '--widget-max-w': widget.style.maxWidth || 'unset',
    '--widget-min-h': widget.style.minHeight || 'unset',
    '--widget-max-h': widget.style.maxHeight || 'unset',
    '--widget-border': widget.style.borderWidth ? `${widget.style.borderWidth}px ${widget.style.borderStyle ?? 'solid'} ${widget.style.borderColor ?? '#000'}` : 'none',
    '--widget-shadow': widget.style.boxShadow || 'none',
    '--widget-font-weight': widget.style.fontWeight ?? 400,
    '--widget-line-height': widget.style.lineHeight ?? 1.5,
    '--widget-text-align': widget.style.textAlign ?? 'left',
    '--widget-object-fit': widget.style.objectFit ?? 'cover',
    '--container-dir': widget.props.direction ?? 'column',
    '--container-justify': widget.props.justify ?? 'flex-start',
    '--container-align': widget.props.align ?? 'stretch',
    '--container-gap': `${widget.props.gap ?? 10}px`,
    '--container-wrap': widget.props.wrap ?? 'nowrap',
  } as CSSProperties

  if (widget.type === 'modal') {
    const isPreviewOverlay = mode === 'preview'
    const modalStyle = {
      ...style,
      '--modal-shadow': widget.style.modalShadow,
      '--modal-border-color': widget.style.modalBorderColor,
      '--modal-header-bg': widget.style.headerBg,
      '--modal-header-border': widget.style.headerBorderColor,
      '--modal-header-color': widget.style.headerColor,
      '--modal-close-color': widget.style.closeColor,
      '--modal-body-color': widget.style.bodyColor,
      '--modal-confirm-bg': widget.style.confirmBg,
      '--modal-confirm-color': widget.style.confirmColor,
      '--modal-confirm-radius': `${widget.style.confirmRadius ?? 6}px`,
    } as CSSProperties
    return (
      <>
        {isPreviewOverlay && <div className="modal-backdrop" style={{ background: widget.style.backdropColor }} onClick={onCloseModal} />}
        <div className={`widget-content widget-modal ${isPreviewOverlay ? 'modal-centered' : ''}`} style={modalStyle}>
          <div className="modal-head">
            <strong>{widget.props.title}</strong>
            {widget.props.showClose !== 'false' && (
              <button className="modal-close" type="button" onClick={(e) => { e.stopPropagation(); onCloseModal?.() }}>
                &times;
              </button>
            )}
          </div>
          <div className="modal-body">
            {widget.props.content}
          </div>
          <div className="modal-foot">
            <button className="modal-confirm" type="button" onClick={(e) => { e.stopPropagation(); onCloseModal?.() }}>
              {widget.props.confirmText}
            </button>
          </div>
        </div>
      </>
    )
  }

  if (widget.type === 'container') {
    return (
      <div
        className={`widget-content widget-container ${dropTargetId === widget.id ? 'drop-target' : ''}`}
        style={style}
        onDragOver={(event) => {
          if (mode !== 'edit' || !onAddWidget) return
          event.preventDefault()
          event.stopPropagation()
          onSetDropTarget?.(widget.id)
        }}
        onDragLeave={() => {
          if (dropTargetId === widget.id) onSetDropTarget?.(null)
        }}
        onDrop={(event) => {
          if (mode !== 'edit' || !onAddWidget) return
          event.preventDefault()
          event.stopPropagation()
          const widgetType = event.dataTransfer.getData('widgetType')
          const template = widgetTemplates.find((item) => item.type === widgetType)
          if (template) onAddWidget(template, widget.id)
          onSetDropTarget?.(null)
        }}
      >
        {widget.children?.length ? (
          widget.children.map((child, childIdx) => (
            <div
              className={`container-child ${selectedId === child.id ? 'selected' : ''}`}
              key={child.id}
              style={{
                flexGrow: Number(child.props.flexGrow ?? 0),
                flexShrink: Number(child.props.flexShrink ?? 1),
                flexBasis: child.props.flexBasis || 'auto',
                alignSelf: child.props.alignSelf || 'auto',
                width: child.props.childWidth || 'auto',
              }}
              onClick={(event) => {
                event.stopPropagation()
                if (mode === 'edit') {
                  onSelect?.(child.id)
                }
              }}
            >
              {mode === 'edit' && selectedId === child.id && (
                <div className="child-toolbar">
                  <button
                    className="toolbar-btn"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onDuplicate?.()
                    }}
                  >
                    复制
                  </button>
                  {childIdx > 0 && (
                    <button
                      className="toolbar-btn"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onMoveChild?.(widget.id, child.id, 'up')
                      }}
                    >
                      ↑
                    </button>
                  )}
                  {childIdx < widget.children!.length - 1 && (
                    <button
                      className="toolbar-btn"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onMoveChild?.(widget.id, child.id, 'down')
                      }}
                    >
                      ↓
                    </button>
                  )}
                  <button
                    className="toolbar-btn toolbar-delete"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onRemove?.()
                    }}
                  >
                    删除
                  </button>
                </div>
              )}
              <WidgetRenderer
                mode={mode}
                selectedId={selectedId}
                widget={child}
                dropTargetId={dropTargetId}
                onDuplicate={onDuplicate}
                onRemove={onRemove}
                onSelect={onSelect}
                onSubmit={() => {}}
                onSaveAsComponent={onSaveAsComponent}
                onAddWidget={onAddWidget}
                onSetDropTarget={onSetDropTarget}
                onMoveChild={onMoveChild}
              />
            </div>
          ))
        ) : (
          mode === 'edit' && <span className="container-placeholder">拖入组件</span>
        )}
      </div>
    )
  }

  if (widget.type === 'text') {
    return (
      <div className="widget-content widget-text" style={style}>
        {widget.props.text}
      </div>
    )
  }

  if (widget.type === 'image') {
    return (
      <div className="widget-content widget-image" style={style}>
        <img src={widget.props.src} alt={widget.props.alt} />
      </div>
    )
  }

  if (widget.type === 'button') {
    return (
      <button className="widget-content widget-button" style={style} type="button">
        {widget.props.text}
      </button>
    )
  }

  if (widget.type === 'list') {
    return (
      <div className="widget-content widget-list" style={style}>
        <header>
          <strong>{widget.props.title}</strong>
        </header>
        {[widget.props.itemOne, widget.props.itemTwo, widget.props.itemThree].map((item) => (
          <p key={item}>
            {item}
            <span>查看</span>
          </p>
        ))}
      </div>
    )
  }

  if (widget.type === 'notice') {
    return (
      <div className="widget-content widget-notice" style={style}>
        <strong>公告</strong>
        <span>{widget.props.text}</span>
      </div>
    )
  }

  return (
    <div className="widget-content widget-form" style={style}>
      <input placeholder={widget.props.placeholder} />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onSubmit()
        }}
      >
        {widget.props.submitText}
      </button>
    </div>
  )
}

function PanelTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="panel-title">
      <strong>{title}</strong>
      <span>{subtitle}</span>
    </div>
  )
}

function ConfigSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="config-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function Segmented<T extends string>({
  onChange,
  options,
  value,
}: {
  onChange: (value: T) => void
  options: Array<[T, string]>
  value: T
}) {
  return (
    <div className="segmented">
      {options.map(([key, label]) => (
        <button className={value === key ? 'active' : ''} key={key} type="button" onClick={() => onChange(key)}>
          {label}
        </button>
      ))}
    </div>
  )
}

function actionLabel(type: EventActionType) {
  return actionOptions.find(([key]) => key === type)?.[1] ?? type
}

function propLabel(key: string) {
  const labels: Record<string, string> = {
    text: '文本',
    src: '图片地址',
    alt: '图片描述',
    title: '标题',
    content: '内容',
    confirmText: '确认按钮文案',
    showClose: '显示关闭按钮',
    itemOne: '条目一',
    itemTwo: '条目二',
    itemThree: '条目三',
    placeholder: '输入提示',
    submitText: '提交文案',
    direction: '排列方向',
    justify: '主轴对齐',
    align: '交叉轴对齐',
    gap: '间距',
    wrap: '换行',
  }
  return labels[key] ?? key
}

function layoutLabel(key: keyof Layout) {
  const labels: Record<keyof Layout, string> = {
    x: 'X',
    y: 'Y',
    width: '宽',
    height: '高',
    zIndex: '层级',
  }
  return labels[key]
}

/** 递归图层行 — 支持多层容器嵌套 */
function LayerRow({
  widget,
  selectedId,
  onSelect,
  onMoveChild,
  depth,
}: {
  widget: WidgetSchema
  selectedId: string
  onSelect: (id: string) => void
  onMoveChild: (containerId: string, childId: string, direction: 'up' | 'down') => void
  depth: number
}) {
  const indent = depth > 0 ? { paddingLeft: `${12 + depth * 16}px` } : undefined

  return (
    <>
      <button
        className={`layer-row ${selectedId === widget.id ? 'active' : ''}`}
        type="button"
        style={indent}
        onClick={() => onSelect(widget.id)}
      >
        <span>{widget.type}</span>
        <strong>{widget.name}</strong>
        <small>{depth === 0 ? `z${widget.layout.zIndex}` : ''}</small>
      </button>
      {widget.type === 'container' &&
        widget.children?.map((child) => (
          <LayerRow
            key={child.id}
            widget={child}
            selectedId={selectedId}
            onSelect={onSelect}
            onMoveChild={onMoveChild}
            depth={depth + 1}
          />
        ))}
    </>
  )
}

export default Builder
