import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react'
import './App.css'

type ApiMethod = 'GET' | 'POST'
type DeviceType = 'mobile' | 'pc'
type EventTrigger = 'click' | 'doubleClick' | 'mouseEnter' | 'mouseLeave' | 'submit'
type EventActionType = 'toast' | 'modal' | 'request' | 'openUrl'
type LeftTab = 'materials' | 'layers' | 'templates'
type Mode = 'edit' | 'preview'
type RightTab = 'props' | 'style' | 'action' | 'source'
type WidgetType = 'text' | 'image' | 'button' | 'list' | 'notice' | 'form'

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
    color: string
    fontSize: number
    radius: number
    opacity: number
  }
  api: ApiConfig
  animation: {
    name: string
    duration: number
    delay: number
  }
  events: WidgetEvents
}

type PageDsl = {
  page: {
    id: string
    name: string
    device: DeviceType
    width: number
    height: number
    background: string
  }
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
        color: '#1f2937',
        fontSize: 28,
        radius: 0,
        opacity: 100,
      },
      api: { enabled: false, method: 'GET', url: '/api/title', dataPath: 'data.text' },
      animation: { name: 'fadeInUp', duration: 600, delay: 0 },
      events: {
        click: [createAction('modal', { title: '文本组件', message: '这里可以展示活动介绍或运营说明。' })],
      },
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
        color: '#1f2937',
        fontSize: 14,
        radius: 18,
        opacity: 100,
      },
      api: { enabled: false, method: 'GET', url: '/api/banner', dataPath: 'data.src' },
      animation: { name: 'zoomIn', duration: 500, delay: 120 },
      events: {
        mouseEnter: [createAction('toast', { message: '正在查看活动头图' })],
      },
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
        color: '#ffffff',
        fontSize: 16,
        radius: 24,
        opacity: 100,
      },
      api: { enabled: false, method: 'POST', url: '/api/track/click', dataPath: 'payload' },
      animation: { name: 'pulse', duration: 800, delay: 260 },
      events: {
        click: [
          createAction('modal', { title: '报名确认', message: '确认后将调用报名接口。' }),
          createAction('request', {
            label: '提交报名',
            method: 'POST',
            url: '/api/leads',
            body: '{"source":"builder","action":"signup"}',
          }),
        ],
      },
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
        color: '#1d39c4',
        fontSize: 14,
        radius: 14,
        opacity: 100,
      },
      api: { enabled: true, method: 'GET', url: '/api/products/recommend', dataPath: 'data.list' },
      animation: { name: 'fadeIn', duration: 500, delay: 300 },
      events: {
        click: [createAction('request', { label: '刷新推荐', method: 'GET', url: '/api/products/recommend' })],
      },
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
        color: '#0958d9',
        fontSize: 12,
        radius: 16,
        opacity: 100,
      },
      api: { enabled: false, method: 'GET', url: '/api/notice', dataPath: 'data.notice' },
      animation: { name: 'fadeInDown', duration: 400, delay: 0 },
      events: {
        click: [createAction('toast', { message: '公告已阅读' })],
      },
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
        color: '#874d00',
        fontSize: 14,
        radius: 14,
        opacity: 100,
      },
      api: { enabled: true, method: 'POST', url: '/api/leads', dataPath: 'payload' },
      animation: { name: 'fadeInUp', duration: 500, delay: 360 },
      events: {
        submit: [
          createAction('request', {
            label: '提交线索',
            method: 'POST',
            url: '/api/leads',
            body: '{"phone":"13800138000"}',
          }),
          createAction('toast', { message: '表单已提交' }),
        ],
      },
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
  }
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
      color: style.color,
      fontSize: Number(style.fontSize),
      radius: Number(style.radius),
      opacity: Number(style.opacity),
    },
    api: { ...template.defaults.api, ...(widget.api ?? {}) },
    animation: { ...template.defaults.animation, ...(widget.animation ?? {}) },
    events: { ...normalizeEvents(template.defaults.events), ...normalizeEvents(widget.events) },
  }
}

function isActionType(value: unknown): value is EventActionType {
  return actionOptions.some(([type]) => type === value)
}

function App() {
  const [device, setDevice] = useState<DeviceType>('mobile')
  const [eventTrigger, setEventTrigger] = useState<EventTrigger>('click')
  const [leftTab, setLeftTab] = useState<LeftTab>('materials')
  const [mode, setMode] = useState<Mode>('edit')
  const [rightTab, setRightTab] = useState<RightTab>('props')
  const [pageName, setPageName] = useState('码良风格活动页')
  const [pageBackground, setPageBackground] = useState('#f2f4f8')
  const [selectedId, setSelectedId] = useState(initialWidgets[1]?.id ?? '')
  const [sourceText, setSourceText] = useState('')
  const [sourceError, setSourceError] = useState('')
  const [widgets, setWidgets] = useState<WidgetSchema[]>(initialWidgets)

  const selected = widgets.find((widget) => widget.id === selectedId) ?? widgets[0]
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
      },
      widgets,
    }),
    [device, pageBackground, pageName, size.height, size.width, widgets],
  )

  useEffect(() => {
    setSourceText(stringifyDsl(dsl))
  }, [dsl])

  const addWidget = (template: WidgetTemplate) => {
    const widget = createWidget(template)
    setWidgets((current) => [...current, widget])
    setSelectedId(widget.id)
  }

  const updateSelected = (patch: Partial<WidgetSchema>) => {
    if (!selected) return
    setWidgets((current) =>
      current.map((widget) => (widget.id === selected.id ? { ...widget, ...patch } : widget)),
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

  const updateApi = (key: keyof ApiConfig, value: string | boolean) => {
    if (!selected) return
    updateSelected({ api: { ...selected.api, [key]: value } })
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
      const next = current.filter((widget) => widget.id !== selected.id)
      setSelectedId(next[0]?.id ?? '')
      return next
    })
  }

  const duplicateSelected = () => {
    if (!selected) return
    const copy = {
      ...selected,
      id: `${selected.type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: `${selected.name} 副本`,
      layout: { ...selected.layout, x: selected.layout.x + 16, y: selected.layout.y + 16 },
      props: { ...selected.props },
      style: { ...selected.style },
      api: { ...selected.api },
      animation: { ...selected.animation },
      events: cloneEvents(selected.events),
    }
    setWidgets((current) => [...current, copy])
    setSelectedId(copy.id)
  }

  const moveLayer = (id: string, direction: 'up' | 'down') => {
    setWidgets((current) =>
      current.map((widget) => {
        if (widget.id !== id) return widget
        return {
          ...widget,
          layout: {
            ...widget.layout,
            zIndex: direction === 'up' ? widget.layout.zIndex + 1 : Math.max(0, widget.layout.zIndex - 1),
          },
        }
      }),
    )
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
      const normalized = next.widgets.map(normalizeWidget)
      setWidgets(normalized)
      setSelectedId(normalized[0]?.id ?? '')
      setSourceError('')
    } catch (error) {
      setSourceError(error instanceof Error ? error.message : 'DSL 解析失败')
    }
  }

  return (
    <main className={`gods-shell ${mode === 'preview' ? 'preview-mode' : ''}`}>
      <header className="gods-header">
        <div className="gods-logo">
          <strong>Gods Pen Studio</strong>
          <span>H5 可视化搭建</span>
        </div>
        <div className="header-actions">
          <button type="button">保存</button>
          <button type="button">发布</button>
          <button type="button">二维码预览</button>
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
              </>
            )}

            {leftTab === 'layers' && (
              <>
                <PanelTitle title="页面图层" subtitle="选择、调整层级" />
                <div className="layer-list">
                  {[...widgets]
                    .sort((a, b) => b.layout.zIndex - a.layout.zIndex)
                    .map((widget) => (
                      <button
                        className={`layer-row ${selected?.id === widget.id ? 'active' : ''}`}
                        key={widget.id}
                        type="button"
                        onClick={() => setSelectedId(widget.id)}
                      >
                        <span>{widget.type}</span>
                        <strong>{widget.name}</strong>
                        <small>z{widget.layout.zIndex}</small>
                      </button>
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
              </div>
              <div>
                <button type="button" onClick={duplicateSelected} disabled={!selected}>
                  复制
                </button>
                <button type="button" onClick={() => selected && moveLayer(selected.id, 'up')} disabled={!selected}>
                  上移层级
                </button>
                <button type="button" onClick={() => selected && moveLayer(selected.id, 'down')} disabled={!selected}>
                  下移层级
                </button>
                <button type="button" className="danger" onClick={removeSelected} disabled={!selected}>
                  删除
                </button>
              </div>
            </div>
            <Canvas
              device={device}
              dsl={dsl}
              mode="edit"
              selectedId={selected?.id}
              onAddWidget={addWidget}
              onSelect={setSelectedId}
              onUpdateLayout={(id, layout) => {
                setWidgets((current) =>
                  current.map((widget) =>
                    widget.id === id ? { ...widget, layout: { ...widget.layout, ...layout } } : widget,
                  ),
                )
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
              <button className={rightTab === 'source' ? 'active' : ''} type="button" onClick={() => setRightTab('source')}>
                源码
              </button>
            </div>

            {rightTab !== 'source' && selected ? (
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
                  </ConfigSection>
                )}

                {rightTab === 'action' && (
                  <ConfigSection title="接口、动画和事件">
                    <label className="switch-row">
                      <span>启用接口</span>
                      <input
                        type="checkbox"
                        checked={selected.api.enabled}
                        onChange={(event) => updateApi('enabled', event.target.checked)}
                      />
                    </label>
                    <label>
                      请求方式
                      <select value={selected.api.method} onChange={(event) => updateApi('method', event.target.value)}>
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                      </select>
                    </label>
                    <label>
                      接口地址
                      <input value={selected.api.url} onChange={(event) => updateApi('url', event.target.value)} />
                    </label>
                    <label>
                      数据路径
                      <input value={selected.api.dataPath} onChange={(event) => updateApi('dataPath', event.target.value)} />
                    </label>
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
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </ConfigSection>
                )}
              </div>
            ) : (
              rightTab !== 'source' && <div className="empty-state">请选择一个画布组件。</div>
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
  onAddWidget,
  onSelect,
  onUpdateLayout,
}: {
  device: DeviceType
  dsl: PageDsl
  mode: Mode
  selectedId?: string
  onAddWidget?: (template: WidgetTemplate) => void
  onSelect?: (id: string) => void
  onUpdateLayout?: (id: string, layout: Partial<Layout>) => void
}) {
  const [dragging, setDragging] = useState<{ id: string; dx: number; dy: number } | null>(null)
  const [modal, setModal] = useState<{ title: string; message: string } | null>(null)
  const [toast, setToast] = useState('')
  const size = canvasSize[device]

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  const runActions = async (widget: WidgetSchema, trigger: EventTrigger) => {
    const actions = widget.events[trigger] ?? []
    for (const action of actions) {
      if (action.type === 'toast') {
        showToast(action.message)
      }

      if (action.type === 'modal') {
        setModal({ title: action.title, message: action.message })
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
        className={`page-canvas ${device}`}
        style={
          {
            width: size.width,
            height: size.height,
            '--page-bg': dsl.page.background,
          } as CSSProperties
        }
        onDragOver={(event) => mode === 'edit' && event.preventDefault()}
        onDrop={(event) => {
          if (mode !== 'edit' || !onAddWidget) return
          const widgetType = event.dataTransfer.getData('widgetType')
          const template = widgetTemplates.find((item) => item.type === widgetType)
          if (template) onAddWidget(template)
        }}
        onMouseMove={(event) => {
          if (!dragging || mode !== 'edit') return
          const rect = event.currentTarget.getBoundingClientRect()
          onUpdateLayout?.(dragging.id, {
            x: Math.round(event.clientX - rect.left - dragging.dx),
            y: Math.round(event.clientY - rect.top - dragging.dy),
          })
        }}
        onMouseUp={() => setDragging(null)}
        onMouseLeave={() => setDragging(null)}
      >
        {dsl.widgets
          .slice()
          .sort((a, b) => a.layout.zIndex - b.layout.zIndex)
          .map((widget) => (
            <div
              className={`widget-box ${mode === 'edit' ? 'editable' : ''} ${selectedId === widget.id ? 'selected' : ''}`}
              key={widget.id}
              style={{
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
            >
              {mode === 'edit' && <span className="move-handle">移动</span>}
              <WidgetRenderer
                widget={widget}
                onSubmit={() => {
                  void runActions(widget, 'submit')
                }}
              />
            </div>
          ))}
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

function WidgetRenderer({ onSubmit, widget }: { onSubmit: () => void; widget: WidgetSchema }) {
  const style = {
    '--widget-bg': widget.style.background,
    '--widget-color': widget.style.color,
    '--widget-radius': `${widget.style.radius}px`,
    '--widget-font': `${widget.style.fontSize}px`,
    '--widget-opacity': widget.style.opacity / 100,
  } as CSSProperties

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
        {widget.api.enabled && <ApiBadge method={widget.api.method} />}
      </div>
    )
  }

  if (widget.type === 'button') {
    return (
      <button className="widget-content widget-button" style={style} type="button">
        {widget.props.text}
        {widget.api.enabled && <ApiBadge method={widget.api.method} />}
      </button>
    )
  }

  if (widget.type === 'list') {
    return (
      <div className="widget-content widget-list" style={style}>
        <header>
          <strong>{widget.props.title}</strong>
          {widget.api.enabled && <ApiBadge method={widget.api.method} />}
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

function ApiBadge({ method }: { method: ApiMethod }) {
  return <em className="api-badge">{method}</em>
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
    itemOne: '条目一',
    itemTwo: '条目二',
    itemThree: '条目三',
    placeholder: '输入提示',
    submitText: '提交文案',
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

export default App
