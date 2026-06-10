import { type CSSProperties, useEffect, useState } from 'react'
import { executeFlow } from '../components/FlowEditor/flowEngine'
import type { FlowGraph } from '../components/FlowEditor/flowEngine'

type EventTrigger = 'click' | 'doubleClick' | 'mouseEnter' | 'mouseLeave' | 'submit'

type WidgetSchema = {
  id: string
  type: string
  name: string
  layout: { x: number; y: number; width: number; height: number; zIndex: number }
  props: Record<string, string>
  style: {
    background: string; backgroundImage: string; backgroundSize: string
    backgroundPosition: string; backgroundRepeat: string; color: string
    fontSize: number; radius: number; opacity: number
    padding: number; margin: number; flexDirection: string
  }
  events: Partial<Record<EventTrigger, Array<{ type: string; label: string; title: string; message: string; method: string; url: string; body: string; targetWidgetId: string }>>>
  children?: WidgetSchema[]
  flow?: FlowGraph
}

type PageDsl = {
  page: {
    device: 'mobile' | 'pc'; width: number; height: number; background: string
    backgroundTransparent: boolean
    backgroundImage: string; backgroundSize: string; backgroundPosition: string; backgroundRepeat: string
  }
  widgets: WidgetSchema[]
}

const canvasSizes: Record<string, { width: number; height: number }> = {
  mobile: { width: 375, height: 667 },
  pc: { width: 960, height: 540 },
}

export default function Preview() {
  const [dsl, setDsl] = useState<PageDsl | null>(null)
  const [modal, setModal] = useState<{ title: string; message: string } | null>(null)
  const [toast, setToast] = useState('')
  const [visibleModals, setVisibleModals] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      // 优先从 URL hash 读取（分享链接）
      const hash = window.location.hash.slice(1)
      if (hash) {
        const json = decodeURIComponent(escape(atob(hash)))
        setDsl(JSON.parse(json) as PageDsl)
        return
      }
      // 回退到 localStorage（同浏览器预览）
      const raw = localStorage.getItem('funlab-dsl')
      if (raw) setDsl(JSON.parse(raw) as PageDsl)
    } catch { /* ignore */ }
  }, [])

  if (!dsl) return <div className="preview-empty">暂无页面数据，请先在搭建器中保存。</div>

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  const runFlowAction = async (config: Record<string, string>) => {
    if (config.actionType === 'toast') showToast(config.message)
    if (config.actionType === 'modal') setModal({ title: config.title ?? '提示', message: config.message })
    if (config.actionType === 'showModal' && config.targetWidgetId) setVisibleModals((p) => new Set(p).add(config.targetWidgetId))
    if (config.actionType === 'openUrl') window.open(config.url, '_blank', 'noopener,noreferrer')
    if (config.actionType === 'request') {
      try {
        const init: RequestInit = { method: config.method }
        if (config.method === 'POST') { init.headers = { 'Content-Type': 'application/json' }; init.body = config.body }
        const res = await fetch(config.url, init)
        showToast(res.ok ? '请求成功' : `请求失败：${res.status}`)
      } catch { showToast('请求失败') }
    }
  }

  const runActions = async (widget: WidgetSchema, trigger: EventTrigger) => {
    if (widget.flow && widget.flow.nodes.length > 0) {
      await executeFlow(widget.flow, trigger, runFlowAction)
      return
    }
    for (const action of widget.events[trigger] ?? []) {
      if (action.type === 'toast') showToast(action.message)
      if (action.type === 'modal') setModal({ title: action.title, message: action.message })
      if (action.type === 'showModal' && action.targetWidgetId) setVisibleModals((p) => new Set(p).add(action.targetWidgetId))
      if (action.type === 'openUrl') window.open(action.url, '_blank', 'noopener,noreferrer')
      if (action.type === 'request') {
        try {
          const init: RequestInit = { method: action.method }
          if (action.method === 'POST') { init.headers = { 'Content-Type': 'application/json' }; init.body = action.body }
          const res = await fetch(action.url, init)
          showToast(res.ok ? `${action.label}成功` : `${action.label}失败：${res.status}`)
        } catch { showToast(`${action.label}失败`) }
      }
    }
  }

  const hideModal = (id: string) => setVisibleModals((p) => { const n = new Set(p); n.delete(id); return n })
  const size = canvasSizes[dsl.page.device] ?? canvasSizes.mobile

  return (
    <div className="preview-page">
      <div className="preview-canvas" style={{
        width: size.width, height: size.height, background: dsl.page.backgroundTransparent ? 'transparent' : dsl.page.background,
        backgroundImage: dsl.page.backgroundImage ? `url(${dsl.page.backgroundImage})` : undefined,
        backgroundSize: dsl.page.backgroundSize, backgroundPosition: dsl.page.backgroundPosition, backgroundRepeat: dsl.page.backgroundRepeat,
      }}>
        {dsl.widgets.filter((w) => w.type !== 'modal' || visibleModals.has(w.id)).sort((a, b) => a.layout.zIndex - b.layout.zIndex).map((widget) => {
          const isModal = widget.type === 'modal'
          return (
            <div key={widget.id} className={isModal ? 'preview-modal-overlay' : 'preview-widget'}
              style={isModal ? {} : { position: 'absolute', left: widget.layout.x, top: widget.layout.y, width: widget.layout.width, height: widget.layout.height, zIndex: widget.layout.zIndex }}>
              {isModal && <div className="modal-backdrop" onClick={() => hideModal(widget.id)} />}
              <RenderWidget widget={widget} onRun={runActions} onClose={() => hideModal(widget.id)} />
            </div>
          )
        })}
        {toast && <div className="runtime-toast">{toast}</div>}
        {modal && <div className="runtime-modal" role="dialog"><section><h2>{modal.title}</h2><p>{modal.message}</p><button type="button" onClick={() => setModal(null)}>确定</button></section></div>}
      </div>
    </div>
  )
}

function RenderWidget({ widget, onRun, onClose }: { widget: WidgetSchema; onRun: (w: WidgetSchema, t: EventTrigger) => Promise<void>; onClose: () => void }) {
  const s = {
    '--widget-bg': widget.style.background,
    '--widget-bg-image': widget.style.backgroundImage ? `url(${widget.style.backgroundImage})` : 'none',
    '--widget-bg-size': widget.style.backgroundSize, '--widget-bg-position': widget.style.backgroundPosition,
    '--widget-bg-repeat': widget.style.backgroundRepeat, '--widget-color': widget.style.color,
    '--widget-radius': `${widget.style.radius}px`, '--widget-font': `${widget.style.fontSize}px`,
    '--widget-opacity': widget.style.opacity / 100, '--widget-padding': `${widget.style.padding}px`,
    '--widget-margin': `${widget.style.margin}px`, '--widget-flex-dir': widget.style.flexDirection,
    '--container-dir': widget.props.direction ?? 'column', '--container-justify': widget.props.justify ?? 'flex-start',
    '--container-align': widget.props.align ?? 'stretch', '--container-gap': `${widget.props.gap ?? 10}px`,
    '--container-wrap': widget.props.wrap ?? 'nowrap',
  } as CSSProperties
  const h = { onClick: () => void onRun(widget, 'click'), onDoubleClick: () => void onRun(widget, 'doubleClick'), onMouseEnter: () => void onRun(widget, 'mouseEnter'), onMouseLeave: () => void onRun(widget, 'mouseLeave') }

  if (widget.type === 'modal') return (
    <div className="widget-content widget-modal modal-centered" style={s}>
      <div className="modal-head"><strong>{widget.props.title}</strong>{widget.props.showClose !== 'false' && <button className="modal-close" type="button" onClick={onClose}>&times;</button>}</div>
      <div className="modal-body">{widget.props.content}</div>
      <div className="modal-foot"><button className="modal-confirm" type="button" onClick={onClose}>{widget.props.confirmText}</button></div>
    </div>
  )
  if (widget.type === 'container') return (
    <div className="widget-content widget-container" style={s} {...h}>
      {widget.children?.map((c) => <div key={c.id} className="container-child"><RenderWidget widget={c} onRun={onRun} onClose={onClose} /></div>)}
    </div>
  )
  if (widget.type === 'text') return <div className="widget-content widget-text" style={s} {...h}>{widget.props.text}</div>
  if (widget.type === 'image') return <div className="widget-content widget-image" style={s} {...h}><img src={widget.props.src} alt={widget.props.alt} /></div>
  if (widget.type === 'button') return <button className="widget-content widget-button" style={s} type="button" {...h}>{widget.props.text}</button>
  if (widget.type === 'list') return <div className="widget-content widget-list" style={s} {...h}><header><strong>{widget.props.title}</strong></header>{[widget.props.itemOne, widget.props.itemTwo, widget.props.itemThree].map((i) => <p key={i}>{i}<span>查看</span></p>)}</div>
  if (widget.type === 'notice') return <div className="widget-content widget-notice" style={s} {...h}><strong>公告</strong><span>{widget.props.text}</span></div>
  return <div className="widget-content widget-form" style={s}><input placeholder={widget.props.placeholder} /><button type="button" onClick={() => void onRun(widget, 'submit')}>{widget.props.submitText}</button></div>
}
