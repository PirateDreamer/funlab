import { useDroppable, useDraggable } from '@dnd-kit/core'
import type { ComponentNode } from '../../../core/protocol'
import styles from '../style.module.css'

interface CanvasNodeProps {
  node: ComponentNode
  selectedId: string | null
  onSelect: (id: string) => void
}

/** 可拖拽+可放置的画布节点 */
export default function CanvasNode({ node, selectedId, onSelect }: CanvasNodeProps) {
  const isSelected = selectedId === node.id

  // 使节点可拖拽（用于画布内排序/移动）
  const { attributes: dragAttrs, listeners: dragListeners, setNodeRef: setDragRef } = useDraggable({
    id: `canvas-${node.id}`,
    data: { type: 'canvas', nodeId: node.id },
  })

  // 使节点可作为放置目标（接收子节点）
  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `drop-${node.id}`,
    data: { nodeId: node.id },
  })

  // 合并 ref
  const setRefs = (el: HTMLElement | null) => {
    setDragRef(el)
    setDropRef(el)
  }

  const hasChildren = node.children && node.children.length > 0

  // CSS 属性名转 camelCase（用户可能输入 font-size 而非 fontSize）
  const rawStyle = node.style || {}
  const normalizedStyle: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(rawStyle)) {
    const camelKey = k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
    let val = v as string | number

    // background-image 自动包裹 url()
    if (camelKey === 'backgroundImage' && typeof val === 'string' && val && !val.startsWith('url(')) {
      val = `url("${val}")`
    }

    normalizedStyle[camelKey] = val
  }

  const inlineStyle: React.CSSProperties = {
    ...normalizedStyle,
    minHeight: hasChildren ? undefined : 48,
  }

  // 无子节点时，把背景色同步到内容区，避免被占位 div 遮住
  const contentStyle: React.CSSProperties = !hasChildren && normalizedStyle.backgroundColor
    ? { backgroundColor: normalizedStyle.backgroundColor as string }
    : {}

  return (
    <div
      ref={setRefs}
      className={[
        styles.canvasNode,
        isSelected ? styles.canvasNodeSelected : '',
        isOver ? styles.canvasNodeDropOver : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={inlineStyle}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(node.id)
      }}
      {...dragAttrs}
      {...dragListeners}
    >
      <span className={styles.canvasNodeLabel}>{node.componentName}</span>

      {hasChildren ? (
        node.children!.map((child, i) =>
          typeof child === 'string' ? (
            <span key={i}>{child}</span>
          ) : (
            <CanvasNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          )
        )
      ) : (
        <div className={styles.canvasNodeEmpty} style={contentStyle}>
          {node.props?.text != null && node.props.text !== ''
            ? String(node.props.text)
            : `拖放子组件到 ${node.componentName}`}
        </div>
      )}
    </div>
  )
}
