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
  { name: 'div', icon: 'BlockOutlined', category: '布局' },
  { name: 'section', icon: 'ContainerOutlined', category: '布局' },
  { name: 'header', icon: 'ContainerOutlined', category: '布局' },
  { name: 'footer', icon: 'ContainerOutlined', category: '布局' },
  { name: 'nav', icon: 'ContainerOutlined', category: '布局' },
  { name: 'Button', icon: 'ButtonOutlined', category: '基础', defaultProps: { type: 'primary', text: '按钮' } },
  { name: 'Text', icon: 'FontSizeOutlined', category: '基础', defaultProps: { text: '文本内容' } },
  { name: 'Link', icon: 'LinkOutlined', category: '基础', defaultProps: { href: '#', text: '链接' } },
  { name: 'Image', icon: 'PictureOutlined', category: '基础', defaultProps: { src: '', alt: '' } },
  { name: 'Input', icon: 'EditOutlined', category: '表单', defaultProps: { placeholder: '请输入' } },
  { name: 'Textarea', icon: 'FormOutlined', category: '表单', defaultProps: { placeholder: '请输入', rows: 4 } },
  { name: 'List', icon: 'UnorderedListOutlined', category: '数据' },
  { name: 'Table', icon: 'TableOutlined', category: '数据' },
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
