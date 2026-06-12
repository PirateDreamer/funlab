import type { PageSchema, ComponentNode } from '../../core/protocol'

/** 编辑模式 */
export type EditorMode = 'design' | 'json' | 'preview'

/** 设备类型 */
export type DeviceType = 'pc' | 'tablet' | 'mobile'

/** 手机型号预设 */
export interface DevicePreset {
  name: string
  width: number
  height: number
  deviceType: DeviceType
}

/** 设备预设列表 */
export const DEVICE_PRESETS: DevicePreset[] = [
  // PC
  { name: 'PC (1440)', width: 1440, height: 900, deviceType: 'pc' },
  { name: 'PC (1920)', width: 1920, height: 1080, deviceType: 'pc' },
  // 平板
  { name: 'iPad mini', width: 768, height: 1024, deviceType: 'tablet' },
  { name: 'iPad Air', width: 820, height: 1180, deviceType: 'tablet' },
  { name: 'iPad Pro 11"', width: 834, height: 1194, deviceType: 'tablet' },
  { name: 'iPad Pro 12.9"', width: 1024, height: 1366, deviceType: 'tablet' },
  // 手机
  { name: 'iPhone SE', width: 375, height: 667, deviceType: 'mobile' },
  { name: 'iPhone 13 mini', width: 375, height: 812, deviceType: 'mobile' },
  { name: 'iPhone 14', width: 390, height: 844, deviceType: 'mobile' },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932, deviceType: 'mobile' },
  { name: 'iPhone 15', width: 393, height: 852, deviceType: 'mobile' },
  { name: 'iPhone 15 Pro Max', width: 440, height: 956, deviceType: 'mobile' },
  { name: 'Samsung Galaxy S23', width: 360, height: 780, deviceType: 'mobile' },
  { name: 'Samsung Galaxy S23 Ultra', width: 384, height: 824, deviceType: 'mobile' },
  { name: 'Pixel 7', width: 412, height: 915, deviceType: 'mobile' },
  { name: 'Pixel 7 Pro', width: 412, height: 892, deviceType: 'mobile' },
  { name: '小米 14', width: 393, height: 873, deviceType: 'mobile' },
  { name: '华为 Mate 60', width: 360, height: 800, deviceType: 'mobile' },
]

/** 编辑器全局状态 */
export interface EditorState {
  /** 当前页面 DSL */
  pageSchema: PageSchema
  /** 选中的节点 ID */
  selectedId: string | null
  /** 编辑模式 */
  mode: EditorMode
  /** 撤销栈 */
  history: PageSchema[]
  /** 当前历史索引 */
  historyIndex: number
}

/** 编辑器 Action 类型 */
export type EditorAction =
  | { type: 'SELECT_NODE'; payload: string | null }
  | { type: 'UPDATE_NODE'; payload: { id: string; updates: Partial<ComponentNode> } }
  | { type: 'ADD_NODE'; payload: { parentId: string; node: ComponentNode; index?: number } }
  | { type: 'REMOVE_NODE'; payload: string }
  | { type: 'MOVE_NODE'; payload: { id: string; newParentId: string; index: number } }
  | { type: 'SET_SCHEMA'; payload: PageSchema }
  | { type: 'SET_MODE'; payload: EditorMode }
  | { type: 'UNDO' }
  | { type: 'REDO' }

/** 组件面板项 */
export interface PaletteItem {
  name: string
  icon: string
  category: string
  defaultProps?: Record<string, unknown>
  defaultChildren?: string | ComponentNode[]
  /** 组件来源包 */
  package?: string
}

/** 拖拽数据 */
export interface DragData {
  type: 'palette' | 'canvas'
  item?: PaletteItem
  nodeId?: string
}
