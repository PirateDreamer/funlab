import { useDraggable } from '@dnd-kit/core'
import {
  EditOutlined,
  BlockOutlined,
  FontSizeOutlined,
  PictureOutlined,
  UnorderedListOutlined,
  FormOutlined,
  TableOutlined,
  ContainerOutlined,
  LinkOutlined,
  SendOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { Button, Popconfirm } from 'antd'
import type { PaletteItem } from '../types'
import type { CustomBlock } from '../hooks/useCustomBlocks'
import styles from '../style.module.css'

interface ComponentPanelProps {
  customBlocks?: CustomBlock[]
  onDeleteBlock?: (id: string) => void
}

/** 可拖拽的组件列表 */
const PALETTE: PaletteItem[] = [
  // ===== HTML 原生 =====
  { name: 'div', icon: 'BlockOutlined', category: 'HTML' },
  { name: 'section', icon: 'ContainerOutlined', category: 'HTML' },
  { name: 'header', icon: 'ContainerOutlined', category: 'HTML' },
  { name: 'footer', icon: 'ContainerOutlined', category: 'HTML' },
  { name: 'nav', icon: 'ContainerOutlined', category: 'HTML' },
  { name: 'span', icon: 'FontSizeOutlined', category: 'HTML' },
  { name: 'img', icon: 'PictureOutlined', category: 'HTML', defaultProps: { src: '', alt: '' } },
  { name: 'a', icon: 'LinkOutlined', category: 'HTML', defaultProps: { href: '#', text: '链接' } },
  { name: 'ul', icon: 'UnorderedListOutlined', category: 'HTML' },
  { name: 'li', icon: 'UnorderedListOutlined', category: 'HTML' },

  // ===== antd-mobile 移动端 =====
  { name: 'Button', icon: 'ButtonOutlined', category: '移动端', package: 'antd-mobile', defaultProps: { color: 'primary', text: '按钮' } },
  { name: 'Input', icon: 'EditOutlined', category: '移动端', package: 'antd-mobile', defaultProps: { placeholder: '请输入' } },
  { name: 'TextArea', icon: 'FormOutlined', category: '移动端', package: 'antd-mobile', defaultProps: { placeholder: '请输入', rows: 3 } },
  { name: 'Switch', icon: 'FormOutlined', category: '移动端', package: 'antd-mobile' },
  { name: 'Checkbox', icon: 'FormOutlined', category: '移动端', package: 'antd-mobile', defaultProps: { text: '复选框' } },
  { name: 'Radio', icon: 'FormOutlined', category: '移动端', package: 'antd-mobile', defaultProps: { text: '单选框' } },
  { name: 'Stepper', icon: 'FormOutlined', category: '移动端', package: 'antd-mobile', defaultProps: { defaultValue: 0 } },
  { name: 'Slider', icon: 'FormOutlined', category: '移动端', package: 'antd-mobile' },
  { name: 'Rate', icon: 'FormOutlined', category: '移动端', package: 'antd-mobile' },
  { name: 'Picker', icon: 'FormOutlined', category: '移动端', package: 'antd-mobile', defaultProps: { placeholder: '请选择' } },
  { name: 'DatePicker', icon: 'FormOutlined', category: '移动端', package: 'antd-mobile', defaultProps: { placeholder: '请选择日期' } },
  { name: 'SearchBar', icon: 'EditOutlined', category: '移动端', package: 'antd-mobile', defaultProps: { placeholder: '搜索' } },
  { name: 'Tag', icon: 'FontSizeOutlined', category: '移动端', package: 'antd-mobile', defaultProps: { text: '标签', color: 'primary' } },
  { name: 'Badge', icon: 'FontSizeOutlined', category: '移动端', package: 'antd-mobile', defaultProps: { content: 5 } },
  { name: 'Avatar', icon: 'PictureOutlined', category: '移动端', package: 'antd-mobile' },
  { name: 'Image', icon: 'PictureOutlined', category: '移动端', package: 'antd-mobile', defaultProps: { src: '', alt: '' } },
  { name: 'Card', icon: 'BlockOutlined', category: '移动端', package: 'antd-mobile' },
  { name: 'List', icon: 'UnorderedListOutlined', category: '移动端', package: 'antd-mobile' },
  { name: 'Collapse', icon: 'UnorderedListOutlined', category: '移动端', package: 'antd-mobile' },
  { name: 'Tabs', icon: 'ContainerOutlined', category: '移动端', package: 'antd-mobile' },
  { name: 'NavBar', icon: 'ContainerOutlined', category: '移动端', package: 'antd-mobile', defaultProps: { title: '导航栏' } },
  { name: 'TabBar', icon: 'ContainerOutlined', category: '移动端', package: 'antd-mobile' },
  { name: 'Dialog', icon: 'BlockOutlined', category: '移动端', package: 'antd-mobile', defaultProps: { title: '提示', content: '确认操作？' } },
  { name: 'Toast', icon: 'BlockOutlined', category: '移动端', package: 'antd-mobile', defaultProps: { content: '提示信息' } },
  { name: 'NoticeBar', icon: 'FontSizeOutlined', category: '移动端', package: 'antd-mobile', defaultProps: { content: '通知内容' } },
  { name: 'Empty', icon: 'BlockOutlined', category: '移动端', package: 'antd-mobile', defaultProps: { description: '暂无数据' } },
  { name: 'SpinLoading', icon: 'BlockOutlined', category: '移动端', package: 'antd-mobile' },
  { name: 'ProgressCircle', icon: 'BlockOutlined', category: '移动端', package: 'antd-mobile', defaultProps: { percent: 50 } },
  { name: 'Steps', icon: 'ContainerOutlined', category: '移动端', package: 'antd-mobile' },
  { name: 'Grid', icon: 'BlockOutlined', category: '移动端', package: 'antd-mobile' },
  { name: 'FloatingBubble', icon: 'BlockOutlined', category: '移动端', package: 'antd-mobile' },
  { name: 'Swiper', icon: 'ContainerOutlined', category: '移动端', package: 'antd-mobile' },
]

const ICON_MAP: Record<string, React.ReactNode> = {
  BlockOutlined: <BlockOutlined />,
  ContainerOutlined: <ContainerOutlined />,
  ButtonOutlined: <SendOutlined />,
  FontSizeOutlined: <FontSizeOutlined />,
  LinkOutlined: <LinkOutlined />,
  PictureOutlined: <PictureOutlined />,
  EditOutlined: <EditOutlined />,
  FormOutlined: <FormOutlined />,
  UnorderedListOutlined: <UnorderedListOutlined />,
  TableOutlined: <TableOutlined />,
}

/** 按分类分组 */
function groupByCategory(items: PaletteItem[]): Map<string, PaletteItem[]> {
  const map = new Map<string, PaletteItem[]>()
  for (const item of items) {
    if (!map.has(item.category)) map.set(item.category, [])
    map.get(item.category)!.push(item)
  }
  return map
}

/** 单个可拖拽组件项 */
function DraggablePaletteItem({
  item,
  dragId,
  extra,
}: {
  item: PaletteItem
  dragId: string
  extra?: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
    data: { type: 'palette', item },
  })

  return (
    <div
      ref={setNodeRef}
      className={styles.paletteItem}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      {...attributes}
      {...listeners}
    >
      <span className={styles.paletteItemIcon}>
        {ICON_MAP[item.icon] || <BlockOutlined />}
      </span>
      <span style={{ flex: 1 }}>{item.name}</span>
      {extra}
    </div>
  )
}

/** 组件面板 */
export default function ComponentPanel({ customBlocks, onDeleteBlock }: ComponentPanelProps) {
  const groups = groupByCategory(PALETTE)

  return (
    <div className={styles.componentPanel}>
      {/* 自定义区块 */}
      {customBlocks && customBlocks.length > 0 && (
        <div>
          <div className={styles.panelTitle}>自定义</div>
          {customBlocks.map((block) => {
            const paletteItem: PaletteItem = {
              name: block.name,
              icon: block.icon || '🧩',
              category: '自定义',
            }
            return (
              <DraggablePaletteItem
                key={block.id}
                item={paletteItem}
                dragId={`block-${block.id}`}
                extra={
                  onDeleteBlock && (
                    <Popconfirm
                      title="确定删除此组件？"
                      onConfirm={(e) => {
                        e?.stopPropagation()
                        onDeleteBlock(block.id)
                      }}
                      onCancel={(e) => e?.stopPropagation()}
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        style={{ color: '#999', padding: 0, minWidth: 20 }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  )
                }
              />
            )
          })}
        </div>
      )}

      {/* 内置组件 */}
      {Array.from(groups.entries()).map(([category, items]) => (
        <div key={category}>
          <div className={styles.panelTitle}>{category}</div>
          {items.map((item) => (
            <DraggablePaletteItem key={item.name} item={item} dragId={`palette-${item.name}`} />
          ))}
        </div>
      ))}
    </div>
  )
}
