import { useState } from 'react'
import { Modal, Input, Button, Alert, Space, Typography, message } from 'antd'
import { ImportOutlined, CodeOutlined } from '@ant-design/icons'
import { parseJSXMultiple } from '../../../core/jsxParser'
import type { ComponentNode } from '../../../core/protocol'

const { Text } = Typography
const { TextArea } = Input

interface ImportModalProps {
  open: boolean
  onClose: () => void
  onImport: (nodes: ComponentNode[]) => void
  onSaveBlock?: (node: ComponentNode, name: string) => void
}

const EXAMPLE_CODE = `<div className="card">
  <h2>标题</h2>
  <p>这是一段描述文本</p>
  <Button type="primary">确认</Button>
</div>`

export default function ImportModal({ open, onClose, onImport, onSaveBlock }: ImportModalProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ComponentNode[] | null>(null)

  const handleParse = () => {
    if (!code.trim()) {
      setError('请输入 JSX 代码')
      setPreview(null)
      return
    }

    const result = parseJSXMultiple(code)
    if (result.success && result.nodes.length > 0) {
      setError(null)
      setPreview(result.nodes)
    } else {
      setError(result.error || '解析失败，请检查 JSX 语法')
      setPreview(null)
    }
  }

  const handleImportToCanvas = () => {
    if (!preview) return
    onImport(preview)
    message.success(`已导入 ${preview.length} 个组件到画布`)
    handleClose()
  }

  const handleSaveAsBlock = () => {
    if (!preview || preview.length === 0 || !onSaveBlock) return
    // 多个节点包装为 div
    const node = preview.length === 1
      ? preview[0]
      : { id: Math.random().toString(36).slice(2, 10), componentName: 'div', children: preview } as ComponentNode
    onSaveBlock(node, '导入的组件')
    message.success('已保存为自定义组件')
    handleClose()
  }

  const handleClose = () => {
    setCode('')
    setError(null)
    setPreview(null)
    onClose()
  }

  const handleLoadExample = () => {
    setCode(EXAMPLE_CODE)
    setError(null)
    setPreview(null)
  }

  return (
    <Modal
      title={
        <Space>
          <ImportOutlined />
          <span>导入组件</span>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      width={720}
      footer={null}
    >
      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>粘贴 JSX 代码，自动解析为组件树</Text>
          <Button size="small" type="link" icon={<CodeOutlined />} onClick={handleLoadExample}>
            加载示例
          </Button>
        </div>

        <TextArea
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError(null)
            setPreview(null)
          }}
          placeholder={`粘贴 JSX 代码，例如：\n<div className="card">\n  <Button type="primary">按钮</Button>\n</div>`}
          rows={10}
          style={{
            fontFamily: 'ui-monospace, Consolas, monospace',
            fontSize: 13,
            lineHeight: 1.6,
            resize: 'vertical',
          }}
        />

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <Button type="primary" onClick={handleParse} disabled={!code.trim()}>
            解析预览
          </Button>
        </div>

        {/* 错误提示 */}
        {error && (
          <Alert
            type="error"
            message={error}
            style={{ marginTop: 12 }}
            showIcon
          />
        )}

        {/* 预览解析结果 */}
        {preview && preview.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Alert
              type="success"
              message={`解析成功，共 ${preview.length} 个根节点`}
              style={{ marginBottom: 8 }}
              showIcon
            />

            {/* 树形预览 */}
            <div style={{
              background: '#f5f5f5',
              borderRadius: 6,
              padding: 12,
              maxHeight: 200,
              overflow: 'auto',
              fontFamily: 'ui-monospace, Consolas, monospace',
              fontSize: 12,
              lineHeight: 1.8,
            }}>
              {preview.map((node, i) => (
                <TreeNodePreview key={i} node={node} depth={0} />
              ))}
            </div>

            {/* 操作按钮 */}
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <Button type="primary" onClick={handleImportToCanvas}>
                导入到画布
              </Button>
              {onSaveBlock && (
                <Button onClick={handleSaveAsBlock}>
                  保存为自定义组件
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

/** 树形预览节点 */
function TreeNodePreview({ node, depth }: { node: ComponentNode; depth: number }) {
  const pad = '  '.repeat(depth)
  const childCount = node.children?.length || 0
  const propsStr = node.props
    ? ' ' + Object.entries(node.props).map(([k, v]) => `${k}=${typeof v === 'string' ? `"${v}"` : `{${v}}`}`).join(' ')
    : ''

  return (
    <div>
      <span style={{ color: '#999' }}>{pad}</span>
      <span style={{ color: '#1677ff' }}>&lt;{node.componentName}</span>
      <span style={{ color: '#999' }}>{propsStr}</span>
      {childCount === 0 ? (
        <span style={{ color: '#1677ff' }}> /&gt;</span>
      ) : (
        <>
          <span style={{ color: '#1677ff' }}>&gt;</span>
          {node.children?.map((child, i) =>
            typeof child === 'string' ? (
              <span key={i} style={{ color: '#52c41a' }}>{child}</span>
            ) : (
              <TreeNodePreview key={i} node={child} depth={depth + 1} />
            )
          )}
          <span style={{ color: '#999' }}>{pad}</span>
          <span style={{ color: '#1677ff' }}>&lt;/{node.componentName}&gt;</span>
        </>
      )}
    </div>
  )
}
