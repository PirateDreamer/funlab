import { type CSSProperties, type ReactNode, useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { type CenterModalDSL, DEFAULT_MODAL_DSL } from './types'
import './CenterModal.css'

export type { CenterModalDSL } from './types'
export { DEFAULT_MODAL_DSL, MARKETING_MODAL_DSL, CONFIRM_MODAL_DSL } from './types'

export type CenterModalProps = {
  /** 是否可见 */
  visible: boolean
  /** DSL 配置，缺省使用 DEFAULT_MODAL_DSL */
  dsl?: Partial<CenterModalDSL>
  /** 确认按钮回调 */
  onConfirm?: () => void
  /** 关闭回调（遮罩点击、关闭按钮、ESC 键） */
  onClose?: () => void
  /** 自定义内容，优先于 dsl.props.content */
  children?: ReactNode
}

/** 合并 DSL：用户传入的部分覆盖默认值 */
function mergeDsl(partial?: Partial<CenterModalDSL>): CenterModalDSL {
  if (!partial) return DEFAULT_MODAL_DSL
  return {
    props: { ...DEFAULT_MODAL_DSL.props, ...partial.props },
    style: { ...DEFAULT_MODAL_DSL.style, ...partial.style },
    animation: { ...DEFAULT_MODAL_DSL.animation, ...partial.animation },
  }
}

/** 中间弹窗组件 — 支持 DSL 配置导入 */
export default function CenterModal({ visible, dsl, onConfirm, onClose, children }: CenterModalProps) {
  const config = mergeDsl(dsl)

  // ESC 键关闭
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    },
    [onClose],
  )

  useEffect(() => {
    if (!visible) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [visible, handleKeyDown])

  if (!visible) return null

  const boxStyle = {
    '--cm-radius': `${config.style.radius}px`,
    '--cm-padding': `${config.style.padding}px`,
    '--cm-shadow': config.style.modalShadow,
    '--cm-border-color': config.style.modalBorderColor,
    '--cm-header-bg': config.style.headerBg,
    '--cm-header-border': config.style.headerBorderColor,
    '--cm-header-color': config.style.headerColor,
    '--cm-close-color': config.style.closeColor,
    '--cm-body-color': config.style.bodyColor,
    '--cm-confirm-bg': config.style.confirmBg,
    '--cm-confirm-color': config.style.confirmColor,
    '--cm-confirm-radius': `${config.style.confirmRadius}px`,
    '--cm-backdrop': config.style.backdropColor,
    '--cm-anim-dur': `${config.animation.duration}ms`,
  } as CSSProperties

  const content = children ?? config.props.content

  return createPortal(
    <>
      <div className="cm-backdrop" onClick={onClose} />
      <div className="cm-wrapper">
        <div className="cm-box" data-anim={config.animation.name} style={boxStyle}>
          <div className="cm-head">
            <strong>{config.props.title}</strong>
            {config.props.showClose && (
              <button className="cm-close" type="button" onClick={onClose}>
                &times;
              </button>
            )}
          </div>
          <div className="cm-body">{content}</div>
          <div className="cm-foot">
            <button className="cm-confirm" type="button" onClick={onConfirm ?? onClose}>
              {config.props.confirmText}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}

/**
 * useCenterModal — 快捷 hook
 *
 * @example
 * ```tsx
 * const { visible, open, close, modalProps } = useCenterModal()
 * <CenterModal {...modalProps} onConfirm={() => { close(); doSomething() }} />
 * ```
 */
export function useCenterModal(dsl?: Partial<CenterModalDSL>) {
  const [visible, setVisible] = useState(false)
  const open = () => setVisible(true)
  const close = () => setVisible(false)

  return {
    visible,
    open,
    close,
    modalProps: { visible, onClose: close, dsl } as CenterModalProps,
  }
}
