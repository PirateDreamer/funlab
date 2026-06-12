import { useCallback, useEffect } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { useState } from 'react'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'

import { useEditorState } from './hooks/useEditorState'
import { useCustomBlocks } from './hooks/useCustomBlocks'
import ComponentPanel from './components/ComponentPanel'
import TreePanel from './components/TreePanel'
import Canvas from './components/Canvas'
import PropertyPanel from './components/PropertyPanel'
import JsonEditor from './components/JsonEditor'
import PreviewPanel from './components/PreviewPanel'
import Toolbar from './components/Toolbar'
import ResizeHandle from './components/ResizeHandle'
import ImportModal from './components/ImportModal'
import type { PaletteItem, DevicePreset } from './types'
import { DEVICE_PRESETS } from './types'
import type { ComponentNode } from '../../core/protocol'
import styles from './style.module.css'

/** 生成唯一 ID */
function genId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** 从画布节点树中查找节点（用于选中展示） */
function findNodeInTree(node: ComponentNode, id: string): ComponentNode | null {
  if (node.id === id) return node
  if (node.children) {
    for (const child of node.children) {
      if (typeof child !== 'string') {
        const found = findNodeInTree(child, id)
        if (found) return found
      }
    }
  }
  return null
}

export default function Editor() {
  const {
    state,
    selectNode,
    updateNode,
    addNode,
    removeNode,
    setSchema,
    setMode,
    undo,
    redo,
  } = useEditorState()

  const { blocks: customBlocks, saveBlock, deleteBlock, instantiate } = useCustomBlocks()
  const [activeDragItem, setActiveDragItem] = useState<PaletteItem | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [device, setDevice] = useState<DevicePreset>(DEVICE_PRESETS[0])
  const [leftWidth, setLeftWidth] = useState(240)
  const [rightWidth, setRightWidth] = useState(300)

  // 拖拽传感器 - 需要移动 8px 才触发，避免误触点击
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // 从 localStorage 恢复草稿
  useEffect(() => {
    try {
      const draft = localStorage.getItem('funlab-editor-draft')
      if (draft) {
        const schema = JSON.parse(draft)
        if (schema?.meta?.id) {
          setSchema(schema)
        }
      }
    } catch {
      // ignore
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedId && state.selectedId !== 'root') {
          // 避免在输入框中误删
          const target = e.target as HTMLElement
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
          e.preventDefault()
          removeNode(state.selectedId)
          selectNode(null)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.selectedId, undo, redo, removeNode, selectNode])

  // 拖拽开始
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current
    if (data?.type === 'palette') {
      setActiveDragItem(data.item as PaletteItem)
    }
  }, [])

  // 拖拽结束
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragItem(null)
      const { active, over } = event
      if (!over) return

      const dragData = active.data.current
      const dropData = over.data.current
      const dragId = active.id as string

      if (dragData?.type === 'palette') {
        const parentId = (dropData?.nodeId as string) || 'root'

        // 自定义区块：从 block-{id} 中提取 block ID
        if (dragId.startsWith('block-')) {
          const blockId = dragId.replace('block-', '')
          const newNode = instantiate(blockId)
          if (newNode) {
            addNode(parentId, newNode)
          }
          return
        }

        // 内置组件
        const item = dragData.item as PaletteItem
        const newNode: ComponentNode = {
          id: genId(),
          componentName: item.name,
          props: item.defaultProps ? (item.defaultProps as Record<string, import('../../core/protocol').BindValue>) : undefined,
          children: item.defaultChildren
            ? typeof item.defaultChildren === 'string'
              ? [item.defaultChildren]
              : item.defaultChildren
            : undefined,
        }

        addNode(parentId, newNode)
      }
    },
    [addNode, instantiate]
  )

  // 面板拉伸回调
  const handleLeftResize = useCallback((delta: number) => {
    setLeftWidth((w) => Math.min(500, Math.max(160, w + delta)))
  }, [])
  const handleRightResize = useCallback((delta: number) => {
    setRightWidth((w) => Math.min(500, Math.max(200, w + delta)))
  }, [])

  // 获取选中节点
  const selectedNode = state.selectedId
    ? findNodeInTree(state.pageSchema.componentTree, state.selectedId)
    : null

  return (
    <ConfigProvider locale={zhCN} theme={{ algorithm: theme.defaultAlgorithm }}>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className={styles.editor}>
          <Toolbar
            mode={state.mode}
            onModeChange={setMode}
            canUndo={state.historyIndex > 0}
            canRedo={state.historyIndex < state.history.length - 1}
            onUndo={undo}
            onRedo={redo}
            schema={state.pageSchema}
            device={device}
            onDeviceChange={setDevice}
            onImport={() => setImportOpen(true)}
          />

          <div className={styles.body}>
            {state.mode === 'design' && (
              <>
                <div className={styles.leftPanel} style={{ width: leftWidth }}>
                  <ComponentPanel customBlocks={customBlocks} onDeleteBlock={deleteBlock} />
                  <div className={styles.treePanel}>
                    <div className={styles.panelTitle}>组件树</div>
                    <TreePanel
                      root={state.pageSchema.componentTree}
                      selectedId={state.selectedId}
                      onSelect={selectNode}
                      onDelete={(id) => {
                        removeNode(id)
                        selectNode(null)
                      }}
                    />
                  </div>
                </div>
                <ResizeHandle direction="left" onResize={handleLeftResize} />
                <Canvas
                  schema={state.pageSchema}
                  selectedId={state.selectedId}
                  onSelect={selectNode}
                  device={device}
                />
                <ResizeHandle direction="right" onResize={handleRightResize} />
                <PropertyPanel
                  node={selectedNode}
                  onUpdate={updateNode}
                  onDelete={(id) => {
                    removeNode(id)
                    selectNode(null)
                  }}
                  onSaveBlock={(node, name) => saveBlock(node, name)}
                  width={rightWidth}
                />
              </>
            )}

            {state.mode === 'json' && (
              <JsonEditor
                schema={state.pageSchema}
                onChange={setSchema}
              />
            )}

            {state.mode === 'preview' && (
              <PreviewPanel schema={state.pageSchema} />
            )}
          </div>

          <DragOverlay>
            {activeDragItem && (
              <div className={styles.dragOverlay}>
                {activeDragItem.name}
              </div>
            )}
          </DragOverlay>
        </div>

        {/* 导入组件弹窗 */}
        <ImportModal
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onImport={(nodes) => {
            // 多个节点包装为 div 容器，或单个直接添加
            if (nodes.length === 1) {
              addNode('root', nodes[0])
            } else {
              const container: ComponentNode = {
                id: genId(),
                componentName: 'div',
                children: nodes,
              }
              addNode('root', container)
            }
          }}
          onSaveBlock={(node, name) => saveBlock(node, name)}
        />
      </DndContext>
    </ConfigProvider>
  )
}
