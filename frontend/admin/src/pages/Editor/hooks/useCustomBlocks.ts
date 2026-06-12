import { useState, useCallback, useEffect } from 'react'
import type { ComponentNode } from '../../../core/protocol'

const STORAGE_KEY = 'funlab-custom-blocks'

/** 自定义区块 */
export interface CustomBlock {
  /** 唯一 ID */
  id: string
  /** 区块名称 */
  name: string
  /** 区块图标（emoji 或 antd icon 名） */
  icon: string
  /** 区块的组件树快照 */
  tree: ComponentNode
  /** 创建时间 */
  createdAt: number
}

/** 生成唯一 ID */
function genId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** 深拷贝节点并重新生成所有 ID（避免复用时 ID 冲突） */
function cloneWithNewIds(node: ComponentNode): ComponentNode {
  const newId = genId()
  const cloned: ComponentNode = { ...node, id: newId }

  if (node.children && node.children.length > 0) {
    const first = node.children[0]
    if (typeof first !== 'string') {
      cloned.children = (node.children as ComponentNode[]).map((child) => cloneWithNewIds(child))
    }
  }

  if (node.slots) {
    const newSlots: Record<string, ComponentNode[]> = {}
    for (const [key, nodes] of Object.entries(node.slots)) {
      newSlots[key] = nodes.map((n) => cloneWithNewIds(n))
    }
    cloned.slots = newSlots
  }

  return cloned
}

/** 从 localStorage 加载 */
function loadBlocks(): CustomBlock[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CustomBlock[]
  } catch {
    return []
  }
}

/** 保存到 localStorage */
function saveBlocks(blocks: CustomBlock[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks))
}

export function useCustomBlocks() {
  const [blocks, setBlocks] = useState<CustomBlock[]>(loadBlocks)

  // 同步到 localStorage
  useEffect(() => {
    saveBlocks(blocks)
  }, [blocks])

  /** 保存选中节点为自定义区块 */
  const saveBlock = useCallback((node: ComponentNode, name: string, icon?: string) => {
    const block: CustomBlock = {
      id: genId(),
      name,
      icon: icon || '🧩',
      tree: JSON.parse(JSON.stringify(node)), // 深拷贝
      createdAt: Date.now(),
    }
    setBlocks((prev) => [...prev, block])
    return block
  }, [])

  /** 删除自定义区块 */
  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
  }, [])

  /** 重命名自定义区块 */
  const renameBlock = useCallback((id: string, newName: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, name: newName } : b)))
  }, [])

  /** 将区块实例化为新节点（深拷贝 + 重新生成 ID） */
  const instantiate = useCallback((blockId: string): ComponentNode | null => {
    const block = blocks.find((b) => b.id === blockId)
    if (!block) return null
    return cloneWithNewIds(block.tree)
  }, [blocks])

  return {
    blocks,
    saveBlock,
    deleteBlock,
    renameBlock,
    instantiate,
  }
}
