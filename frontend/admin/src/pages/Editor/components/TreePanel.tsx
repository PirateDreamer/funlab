import { useMemo } from 'react'
import { Tree } from 'antd'
import type { DataNode, TreeProps } from 'antd/es/tree'
import {
  BlockOutlined,
  SendOutlined,
  FontSizeOutlined,
  EditOutlined,
  PictureOutlined,
  LinkOutlined,
  UnorderedListOutlined,
  FormOutlined,
  TableOutlined,
  ContainerOutlined,
} from '@ant-design/icons'
import type { ComponentNode } from '../../../core/protocol'

/** 组件名 → 图标映射 */
const ICON_MAP: Record<string, React.ReactNode> = {
  div: <BlockOutlined style={{ fontSize: 12 }} />,
  section: <ContainerOutlined style={{ fontSize: 12 }} />,
  header: <ContainerOutlined style={{ fontSize: 12 }} />,
  footer: <ContainerOutlined style={{ fontSize: 12 }} />,
  nav: <ContainerOutlined style={{ fontSize: 12 }} />,
  Button: <SendOutlined style={{ fontSize: 12, color: '#1677ff' }} />,
  Text: <FontSizeOutlined style={{ fontSize: 12, color: '#52c41a' }} />,
  Link: <LinkOutlined style={{ fontSize: 12, color: '#1677ff' }} />,
  Image: <PictureOutlined style={{ fontSize: 12, color: '#fa8c16' }} />,
  Input: <EditOutlined style={{ fontSize: 12, color: '#722ed1' }} />,
  Textarea: <FormOutlined style={{ fontSize: 12, color: '#722ed1' }} />,
  List: <UnorderedListOutlined style={{ fontSize: 12 }} />,
  Table: <TableOutlined style={{ fontSize: 12 }} />,
}

interface TreePanelProps {
  root: ComponentNode
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

/** 递归将 ComponentNode 转为 antd DataNode */
function toTreeData(node: ComponentNode): DataNode {
  const icon = ICON_MAP[node.componentName] || <BlockOutlined style={{ fontSize: 12 }} />

  // 取文本标签：优先 props.text，再取第一个 string child
  const label =
    (node.props?.text != null && node.props.text !== ''
      ? String(node.props.text)
      : node.children?.length === 1 && typeof node.children[0] === 'string'
        ? node.children[0]
        : '') || ''

  const title = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontWeight: 500 }}>{node.componentName}</span>
      {label && (
        <span style={{ color: '#999', fontSize: 11, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
      )}
    </span>
  )

  // 收集子节点（跳过 string 子节点）
  const childNodes: DataNode[] = []
  if (node.children) {
    for (const child of node.children) {
      if (typeof child !== 'string') {
        childNodes.push(toTreeData(child))
      }
    }
  }

  // 收集插槽子节点
  if (node.slots) {
    for (const [, slotNodes] of Object.entries(node.slots)) {
      for (const slotNode of slotNodes) {
        childNodes.push(toTreeData(slotNode))
      }
    }
  }

  return {
    key: node.id,
    title,
    icon,
    children: childNodes.length > 0 ? childNodes : undefined,
    isLeaf: childNodes.length === 0,
  }
}

export default function TreePanel({ root, selectedId, onSelect }: TreePanelProps) {
  const treeData = useMemo(() => [toTreeData(root)], [root])

  const handleSelect: TreeProps['onSelect'] = (selectedKeys) => {
    if (selectedKeys.length > 0) {
      onSelect(selectedKeys[0] as string)
    }
  }

  return (
    <div style={{ padding: '8px 0' }}>
      <Tree
        showIcon
        blockNode
        defaultExpandAll
        selectedKeys={selectedId ? [selectedId] : []}
        treeData={treeData}
        onSelect={handleSelect}
        style={{ fontSize: 12, background: 'transparent' }}
      />
    </div>
  )
}
