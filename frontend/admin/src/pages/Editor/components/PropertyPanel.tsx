import { useState, useEffect } from 'react'
import { Input, Tabs, Button, Space, Typography, Modal, message } from 'antd'
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons'
import type { ComponentNode, EventHandler, ComponentProps } from '../../../core/protocol'
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

  const handleUpdate = (newEvents: EventHandler[]) => {
    onUpdate(node.id, { events: newEvents.length > 0 ? newEvents : undefined })
  }

  return (
    <div style={{ padding: '12px 0' }}>
      {events.map((ev, i) => (
        <div key={i} style={{ marginBottom: 12, padding: 8, background: '#fafafa', borderRadius: 4 }}>
          <Space style={{ display: 'flex', marginBottom: 4 }}>
            <Input
              size="small"
              value={ev.event}
              placeholder="事件名 (如 click)"
              style={{ width: 100 }}
              onChange={(e) => {
                const newEvents = [...events]
                newEvents[i] = { ...ev, event: e.target.value }
                handleUpdate(newEvents)
              }}
            />
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                const newEvents = events.filter((_, idx) => idx !== i)
                handleUpdate(newEvents)
              }}
            />
          </Space>
          <Input.TextArea
            size="small"
            rows={2}
            value={typeof ev.handler === 'object' ? ev.handler.value : ''}
            placeholder="处理函数: (e) => { ... }"
            onChange={(e) => {
              const newEvents = [...events]
              newEvents[i] = { ...ev, handler: { type: 'JSFunction', value: e.target.value } }
              handleUpdate(newEvents)
            }}
          />
        </div>
      ))}
      <Button
        size="small"
        type="dashed"
        block
        icon={<PlusOutlined />}
        onClick={() =>
          handleUpdate([
            ...events,
            { event: '', handler: { type: 'JSFunction', value: '' } },
          ])
        }
      >
        添加事件
      </Button>
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
