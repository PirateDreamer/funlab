import { useCallback, useRef } from 'react'

interface ResizeHandleProps {
  direction: 'left' | 'right'
  onResize: (delta: number) => void
  onResizeEnd?: () => void
}

export default function ResizeHandle({ direction, onResize, onResizeEnd }: ResizeHandleProps) {
  const dragging = useRef(false)
  const startX = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const delta = ev.clientX - startX.current
      startX.current = ev.clientX
      // 左侧面板拉伸：向右为正；右侧面板拉伸：向左为正
      onResize(direction === 'left' ? delta : -delta)
    }

    const handleMouseUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      onResizeEnd?.()
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [direction, onResize, onResizeEnd])

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        width: 5,
        cursor: 'col-resize',
        background: 'transparent',
        flexShrink: 0,
        position: 'relative',
        zIndex: 20,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#1677ff')}
      onMouseLeave={(e) => {
        if (!dragging.current) e.currentTarget.style.background = 'transparent'
      }}
    />
  )
}
