import { useDroppable } from '@dnd-kit/core'
import type { PageSchema } from '../../../core/protocol'
import type { DevicePreset } from '../types'
import CanvasNode from './CanvasNode'
import styles from '../style.module.css'

interface CanvasProps {
  schema: PageSchema
  selectedId: string | null
  onSelect: (id: string | null) => void
  device: DevicePreset
}

export default function Canvas({ schema, selectedId, onSelect, device }: CanvasProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'canvas-root',
    data: { nodeId: 'root' },
  })

  const isMobile = device.deviceType !== 'pc'

  return (
    <div className={styles.canvasWrapper}>
      <div
        className={[styles.canvas, isOver ? styles.canvasOver : ''].filter(Boolean).join(' ')}
        ref={setNodeRef}
        onClick={() => onSelect(null)}
      >
        <div
          className={styles.canvasFrame}
          style={{
            width: isMobile ? device.width : '100%',
            maxWidth: isMobile ? device.width : '100%',
            minHeight: isMobile ? device.height : '100%',
            margin: isMobile ? '0 auto' : undefined,
            transition: 'width 0.3s ease, max-width 0.3s ease',
            border: isMobile ? '8px solid #1a1a1a' : undefined,
            borderRadius: isMobile ? 24 : undefined,
            boxShadow: isMobile ? '0 8px 24px rgba(0,0,0,0.15)' : undefined,
          }}
        >
          {/* 手机外框装饰 */}
          {isMobile && (
            <div className={styles.phoneFrame}>
              <div className={styles.phoneNotch} />
            </div>
          )}

          <div className={styles.canvasInner}>
            <CanvasNode
              node={schema.componentTree}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          </div>

          {/* 设备信息 */}
          {isMobile && (
            <div className={styles.deviceInfo}>
              {device.name} · {device.width} × {device.height}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
