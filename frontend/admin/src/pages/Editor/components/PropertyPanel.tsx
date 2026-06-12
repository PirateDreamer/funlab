import { useState, useEffect } from 'react'
import { Input, Tabs, Button, Space, Typography, Modal, Tag, message } from 'antd'
import { PlusOutlined, DeleteOutlined, SaveOutlined, EditOutlined } from '@ant-design/icons'
import type { ComponentNode, EventHandler, ComponentProps } from '../../../core/protocol'
import EventEditModal from './EventEditModal'
import styles from '../style.module.css'

const { Text } = Typography

interface PropertyPanelProps {
  node: ComponentNode | null
  onUpdate: (id: string, updates: Partial<ComponentNode>) => void
  onDelete: (id: string) => void
  onSaveBlock?: (node: ComponentNode, name: string) => void
  width?: number
}

/** 基础属性编辑 */
function BasicTab({ node, onUpdate }: { node: ComponentNode; onUpdate: PropertyPanelProps['onUpdate'] }) {
  const props = node.props || {}
  const hasText = 'text' in props

  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>组件名</Text>
        <Input
          size="small"
          value={node.componentName}
          onChange={(e) => onUpdate(node.id, { componentName: e.target.value })}
        />
      </div>
      {/* text 属性编辑 */}
      {hasText && (
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>文本内容</Text>
          <Input
            size="small"
            value={String(props.text ?? '')}
            placeholder="输入文本..."
            onChange={(e) => onUpdate(node.id, { props: { ...props, text: e.target.value } })}
          />
        </div>
      )}
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>className</Text>
        <Input
          size="small"
          value={node.className || ''}
          onChange={(e) => onUpdate(node.id, { className: e.target.value || undefined })}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>ref</Text>
        <Input
          size="small"
          value={node.ref || ''}
          onChange={(e) => onUpdate(node.id, { ref: e.target.value || undefined })}
        />
      </div>
    </div>
  )
}

/** Props 编辑 */
function PropsTab({ node, onUpdate }: { node: ComponentNode; onUpdate: PropertyPanelProps['onUpdate'] }) {
  const props = node.props || {}
  const entries = Object.entries(props)

  const handleUpdate = (newProps: ComponentProps) => {
    onUpdate(node.id, { props: Object.keys(newProps).length > 0 ? newProps : undefined })
  }

  return (
    <div style={{ padding: '12px 0' }}>
      {entries.map(([key, value], i) => (
        <Space key={i} style={{ display: 'flex', marginBottom: 8 }} align="start">
          <Input
            size="small"
            value={key}
            placeholder="属性名"
            style={{ width: 80 }}
            onChange={(e) => {
              const newProps = { ...props }
              const val = newProps[key]
              delete newProps[key]
              newProps[e.target.value] = val
              handleUpdate(newProps)
            }}
          />
          <Input
            size="small"
            value={typeof value === 'string' ? value : JSON.stringify(value)}
            placeholder="值"
            onChange={(e) => {
              handleUpdate({ ...props, [key]: e.target.value })
            }}
          />
          <Button
            size="small"
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              const newProps = { ...props }
              delete newProps[key]
              handleUpdate(newProps)
            }}
          />
        </Space>
      ))}
      <Button
        size="small"
        type="dashed"
        block
        icon={<PlusOutlined />}
        onClick={() => handleUpdate({ ...props, '': '' })}
      >
        添加属性
      </Button>
    </div>
  )
}

/** 事件编辑 */
function EventsTab({ node, onUpdate }: { node: ComponentNode; onUpdate: PropertyPanelProps['onUpdate'] }) {
  const events = node.events || []
  const [modalOpen, setModalOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)

  const handleUpdate = (newEvents: EventHandler[]) => {
    onUpdate(node.id, { events: newEvents.length > 0 ? newEvents : undefined })
  }

  const handleAdd = () => {
    setEditIndex(null)
    setModalOpen(true)
  }

  const handleEdit = (index: number) => {
    setEditIndex(index)
    setModalOpen(true)
  }

  const handleSave = (ev: EventHandler) => {
    const newEvents = [...events]
    if (editIndex !== null) {
      newEvents[editIndex] = ev
    } else {
      newEvents.push(ev)
    }
    handleUpdate(newEvents)
  }

  const handleDelete = (index: number) => {
    handleUpdate(events.filter((_, i) => i !== index))
  }

  // 取 handler 预览文本
  const getHandlerPreview = (handler: EventHandler['handler']): string => {
    const code = typeof handler === 'object' ? handler.value : ''
    const firstLine = code.split('\n').find((l) => l.trim() && !l.trim().startsWith('//')) || ''
    return firstLine.trim().slice(0, 40) + (firstLine.length > 40 ? '...' : '')
  }

  return (
    <div style={{ padding: '12px 0' }}>
      {events.map((ev, i) => (
        <div
          key={i}
          style={{
            marginBottom: 8,
            padding: '8px 10px',
            background: '#fafafa',
            borderRadius: 6,
            border: '1px solid #f0f0f0',
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onClick={() => handleEdit(i)}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#91caff')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#f0f0f0')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Space size={4}>
              <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{ev.event || '未命名'}</Tag>
              {ev.preventDefault && <Tag style={{ margin: 0, fontSize: 10 }}>preventDefault</Tag>}
              {ev.stopPropagation && <Tag style={{ margin: 0, fontSize: 10 }}>stopPropagation</Tag>}
            </Space>
            <Space size={0}>
              <Button
                size="small"
                type="text"
                icon={<EditOutlined />}
                style={{ color: '#1677ff', padding: 0, minWidth: 20 }}
                onClick={(e) => { e.stopPropagation(); handleEdit(i) }}
              />
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                style={{ padding: 0, minWidth: 20 }}
                onClick={(e) => { e.stopPropagation(); handleDelete(i) }}
              />
            </Space>
          </div>
          <div style={{ fontSize: 11, color: '#999', fontFamily: 'ui-monospace, Consolas, monospace' }}>
            {getHandlerPreview(ev.handler)}
          </div>
        </div>
      ))}

      <Button
        size="small"
        type="dashed"
        block
        icon={<PlusOutlined />}
        onClick={handleAdd}
      >
        添加事件
      </Button>

      <EventEditModal
        open={modalOpen}
        event={editIndex !== null ? events[editIndex] : null}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}

/** 样式编辑 */
function StyleTab({ node, onUpdate }: { node: ComponentNode; onUpdate: PropertyPanelProps['onUpdate'] }) {
  const style = node.style || {}
  const entries = Object.entries(style)

  const handleUpdate = (newStyle: Record<string, string | number>) => {
    onUpdate(node.id, { style: Object.keys(newStyle).length > 0 ? newStyle : undefined })
  }

  return (
    <div style={{ padding: '12px 0' }}>
      {entries.map(([key, value], i) => (
        <Space key={i} style={{ display: 'flex', marginBottom: 8 }} align="start">
          <Input
            size="small"
            value={key}
            placeholder="样式名"
            style={{ width: 100 }}
            onChange={(e) => {
              const newStyle = { ...style }
              const val = newStyle[key]
              delete newStyle[key]
              newStyle[e.target.value] = val
              handleUpdate(newStyle)
            }}
          />
          <Input
            size="small"
            value={String(value)}
            placeholder="值"
            onChange={(e) => {
              handleUpdate({ ...style, [key]: e.target.value })
            }}
          />
          <Button
            size="small"
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              const newStyle = { ...style }
              delete newStyle[key]
              handleUpdate(newStyle)
            }}
          />
        </Space>
      ))}
      <Button
        size="small"
        type="dashed"
        block
        icon={<PlusOutlined />}
        onClick={() => handleUpdate({ ...style, '': '' })}
      >
        添加样式
      </Button>
    </div>
  )
}

/** 属性面板 */
export default function PropertyPanel({ node, onUpdate, onDelete, onSaveBlock, width }: PropertyPanelProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [blockName, setBlockName] = useState('')

  useEffect(() => {
    setActiveTab('basic')
  }, [node?.id])

  if (!node) {
    return (
      <div className={styles.propertyPanel} style={{ width }}>
        <div className={styles.propertyPanelEmpty}>
          <span>🖱️</span>
          <span>点击画布中的组件进行编辑</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.propertyPanel} style={{ width }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong style={{ fontSize: 13 }}>{node.componentName}</Text>
        <Space size={4}>
          {node.id !== 'root' && onSaveBlock && (
            <Button
              size="small"
              type="text"
              icon={<SaveOutlined />}
              onClick={() => {
                setBlockName(node.componentName)
                setSaveModalOpen(true)
              }}
            >
              存为组件
            </Button>
          )}
          {node.id !== 'root' && (
            <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => onDelete(node.id)}>
              删除
            </Button>
          )}
        </Space>
      </div>

      {/* 保存为组件的弹窗 */}
      <Modal
        title="保存为自定义组件"
        open={saveModalOpen}
        okText="保存"
        cancelText="取消"
        onOk={() => {
          if (!blockName.trim()) {
            message.warning('请输入组件名称')
            return
          }
          onSaveBlock?.(node, blockName.trim())
          setSaveModalOpen(false)
          message.success(`组件「${blockName.trim()}」已保存`)
        }}
        onCancel={() => setSaveModalOpen(false)}
      >
        <div style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>组件名称</Text>
          <Input
            value={blockName}
            onChange={(e) => setBlockName(e.target.value)}
            placeholder="输入组件名称"
            onPressEnter={() => {
              if (blockName.trim()) {
                onSaveBlock?.(node, blockName.trim())
                setSaveModalOpen(false)
                message.success(`组件「${blockName.trim()}」已保存`)
              }
            }}
          />
        </div>
      </Modal>
      <div style={{ padding: '0 16px' }}>
        <Tabs
          size="small"
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'basic', label: '基础', children: <BasicTab node={node} onUpdate={onUpdate} /> },
            { key: 'props', label: 'Props', children: <PropsTab node={node} onUpdate={onUpdate} /> },
            { key: 'events', label: '事件', children: <EventsTab node={node} onUpdate={onUpdate} /> },
            { key: 'style', label: '样式', children: <StyleTab node={node} onUpdate={onUpdate} /> },
          ]}
        />
      </div>
    </div>
  )
}
