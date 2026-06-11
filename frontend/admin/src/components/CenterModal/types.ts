/** 中间弹窗 DSL 类型定义 */

export type ModalAnimation = 'fadeIn' | 'slideUp' | 'zoomIn'

export type CenterModalDSL = {
  props: {
    title: string
    content: string
    confirmText: string
    showClose: boolean
  }
  style: {
    backdropColor: string
    headerBg: string
    headerColor: string
    headerBorderColor: string
    bodyColor: string
    confirmBg: string
    confirmColor: string
    confirmRadius: number
    closeColor: string
    modalShadow: string
    modalBorderColor: string
    radius: number
    padding: number
  }
  animation: {
    name: ModalAnimation
    duration: number
  }
}

/** 默认 DSL 模板 */
export const DEFAULT_MODAL_DSL: CenterModalDSL = {
  props: {
    title: '提示',
    content: '这里是弹窗内容，可在 DSL 中自定义。',
    confirmText: '确定',
    showClose: true,
  },
  style: {
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
    radius: 12,
    padding: 20,
  },
  animation: {
    name: 'fadeIn',
    duration: 300,
  },
}

/** 预置模板 DSL — 营销风格 */
export const MARKETING_MODAL_DSL: CenterModalDSL = {
  props: {
    title: '🎉 限时福利',
    content: '新用户专享优惠券，立即领取享折扣！',
    confirmText: '立即领取',
    showClose: true,
  },
  style: {
    backdropColor: 'rgba(0,0,0,0.55)',
    headerBg: '#fff7e6',
    headerColor: '#d46b08',
    headerBorderColor: '#ffe7ba',
    bodyColor: '#595959',
    confirmBg: '#fa8c16',
    confirmColor: '#ffffff',
    confirmRadius: 20,
    closeColor: '#bfbfbf',
    modalShadow: '0 12px 40px rgba(0,0,0,0.25)',
    modalBorderColor: '#ffd591',
    radius: 16,
    padding: 24,
  },
  animation: {
    name: 'zoomIn',
    duration: 350,
  },
}

/** 预置模板 DSL — 确认对话框 */
export const CONFIRM_MODAL_DSL: CenterModalDSL = {
  props: {
    title: '确认操作',
    content: '确定要执行此操作吗？此操作不可撤销。',
    confirmText: '确认',
    showClose: true,
  },
  style: {
    backdropColor: 'rgba(0,0,0,0.4)',
    headerBg: '#ffffff',
    headerColor: '#111827',
    headerBorderColor: '#f0f0f0',
    bodyColor: '#666666',
    confirmBg: '#ff4d4f',
    confirmColor: '#ffffff',
    confirmRadius: 6,
    closeColor: '#999999',
    modalShadow: '0 6px 24px rgba(0,0,0,0.18)',
    modalBorderColor: 'transparent',
    radius: 10,
    padding: 20,
  },
  animation: {
    name: 'slideUp',
    duration: 280,
  },
}
