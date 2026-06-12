import { createElement } from 'react'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import type { ComponentNode } from '../../../core/protocol'
import styles from '../style.module.css'

/** 可作为画布标签的 HTML 元素 */
const HTML_TAGS = new Set([
  'div', 'section', 'header', 'footer', 'nav', 'main', 'aside', 'article', 'span', 'p',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'button',
  'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'form', 'label',
])

interface CanvasNodeProps {
  node: ComponentNode
  selectedId: string | null
  onSelect: (id: string) => void
}

/** 可拖拽+可放置的画布节点 */
export default function CanvasNode({ node, selectedId, onSelect }: CanvasNodeProps) {
  const isSelected = selectedId === node.id

  const { attributes: dragAttrs, listeners: dragListeners, setNodeRef: setDragRef } = useDraggable({
    id: `canvas-${node.id}`,
    data: { type: 'canvas', nodeId: node.id },
  })

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `drop-${node.id}`,
    data: { nodeId: node.id },
  })

  const setRefs = (el: HTMLElement | null) => {
    setDragRef(el)
    setDropRef(el)
  }

  const hasChildren = node.children && node.children.length > 0

  // CSS 属性名转 camelCase
  const rawStyle = node.style || {}
  const normalizedStyle: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(rawStyle)) {
    const camelKey = k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
    let val = v as string | number
    if (camelKey === 'backgroundImage' && typeof val === 'string' && val && !val.startsWith('url(')) {
      val = `url("${val}")`
    }
    // 100vw 溢出风险，转为 100%
    if (val === '100vw') val = '100%'
    normalizedStyle[camelKey] = val
  }

  // 组件默认外观（画布预览用，用户设置的样式会覆盖）
  const defaultStyles: Record<string, React.CSSProperties> = {
    Button: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4px 16px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      border: '1px solid #1677ff',
      backgroundColor: normalizedStyle.backgroundColor ? undefined : '#1677ff',
      color: normalizedStyle.color ? undefined : '#fff',
      cursor: 'pointer',
      minHeight: '32px',
    },
    Input: {
      padding: '4px 11px',
      borderRadius: '6px',
      border: '1px solid #d9d9d9',
      fontSize: '14px',
      minHeight: '32px',
      backgroundColor: '#fff',
    },
    TextArea: {
      padding: '4px 11px',
      borderRadius: '6px',
      border: '1px solid #d9d9d9',
      fontSize: '14px',
      minHeight: '64px',
      backgroundColor: '#fff',
    },
    Switch: {
      width: '44px',
      height: '22px',
      borderRadius: '11px',
      backgroundColor: normalizedStyle.backgroundColor ? undefined : '#1677ff',
      position: 'relative',
    },
    Tag: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      backgroundColor: '#e6f4ff',
      color: '#1677ff',
      border: '1px solid #91caff',
    },
    NavBar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '45px',
      backgroundColor: '#fff',
      borderBottom: '1px solid #f0f0f0',
      fontSize: '16px',
      fontWeight: '600',
    },
    NoticeBar: {
      padding: '8px 12px',
      backgroundColor: '#fffbe6',
      color: '#faad14',
      fontSize: '13px',
      borderRadius: '4px',
    },
    Empty: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 0',
      color: '#999',
      fontSize: '14px',
    },
  }

  const componentDefault = defaultStyles[node.componentName] || {}

  const inlineStyle: React.CSSProperties = {
    ...componentDefault,
    ...normalizedStyle,
    minHeight: hasChildren ? undefined : (normalizedStyle.minHeight || componentDefault.minHeight || 48),
  }

  // 无子节点时，背景色同步到内容区
  const contentStyle: React.CSSProperties = !hasChildren && normalizedStyle.backgroundColor
    ? { backgroundColor: normalizedStyle.backgroundColor as string }
    : {}

  // 选择 HTML 标签（原生标签用对应标签，组件用 div）
  const tag = HTML_TAGS.has(node.componentName) ? node.componentName : 'div'

  const className = [
    styles.canvasNode,
    isSelected ? styles.canvasNodeSelected : '',
    isOver ? styles.canvasNodeDropOver : '',
  ].filter(Boolean).join(' ')

  const childContent = hasChildren ? (
    node.children!.map((child, i) =>
      typeof child === 'string' ? (
        <span key={i}>{child}</span>
      ) : (
        <CanvasNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} />
      )
    )
  ) : (
    <div className={styles.canvasNodeEmpty} style={contentStyle}>
      {node.props?.text != null && node.props.text !== ''
        ? String(node.props.text)
        : `拖放子组件到 ${node.componentName}`}
    </div>
  )

  return createElement(
    tag,
    {
      ref: setRefs,
      className,
      style: inlineStyle,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        onSelect(node.id)
      },
      ...dragAttrs,
      ...dragListeners,
    },
    <span className={styles.canvasNodeLabel}>{node.componentName}</span>,
    childContent,
  )
}
