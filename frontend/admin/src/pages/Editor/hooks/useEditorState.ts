import { useReducer, useCallback } from 'react'
import type { PageSchema, ComponentNode } from '../../../core/protocol'
import type { EditorState, EditorAction, EditorMode } from '../types'

/** 生成唯一 ID */
function genId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** 递归查找节点 */
function findNode(node: ComponentNode, id: string): ComponentNode | null {
  if (node.id === id) return node
  if (node.children) {
    for (const child of node.children) {
      if (typeof child !== 'string') {
        const found = findNode(child, id)
        if (found) return found
      }
    }
  }
  if (node.slots) {
    for (const nodes of Object.values(node.slots)) {
      for (const n of nodes) {
        const found = findNode(n, id)
        if (found) return found
      }
    }
  }
  return null
}

/** 递归更新节点 */
function updateNode(node: ComponentNode, id: string, updates: Partial<ComponentNode>): ComponentNode {
  if (node.id === id) return { ...node, ...updates }
  if (node.children && node.children.length > 0) {
    const first = node.children[0]
    if (typeof first === 'string') {
      // string[] — 不递归
      return node
    }
    return {
      ...node,
      children: (node.children as ComponentNode[]).map((child) => updateNode(child, id, updates)),
    }
  }
  return node
}

/** 递归移除节点 */
function removeNode(node: ComponentNode, id: string): ComponentNode | null {
  if (node.id === id) return null
  if (node.children && node.children.length > 0) {
    const first = node.children[0]
    if (typeof first === 'string') {
      return node
    }
    const newChildren = (node.children as ComponentNode[])
      .map((child) => removeNode(child, id))
      .filter((c): c is ComponentNode => c !== null)
    return { ...node, children: newChildren }
  }
  return node
}

/** 递归添加子节点 */
function addChildNode(
  node: ComponentNode,
  parentId: string,
  newNode: ComponentNode,
  index?: number
): ComponentNode {
  if (node.id === parentId) {
    const children: ComponentNode[] = [...((node.children || []).filter((c) => typeof c !== 'string') as ComponentNode[])]
    if (index !== undefined && index >= 0) {
      children.splice(index, 0, newNode)
    } else {
      children.push(newNode)
    }
    return { ...node, children }
  }
  if (node.children && node.children.length > 0) {
    const first = node.children[0]
    if (typeof first === 'string') {
      return node
    }
    return {
      ...node,
      children: (node.children as ComponentNode[]).map((child) => addChildNode(child, parentId, newNode, index)),
    }
  }
  return node
}

/** 移动节点：先从原位置删除，再添加到新位置 */
function moveNode(
  root: ComponentNode,
  nodeId: string,
  newParentId: string,
  index: number
): ComponentNode {
  const nodeToMove = findNode(root, nodeId)
  if (!nodeToMove) return root
  const withoutNode = removeNode(root, nodeId)
  if (!withoutNode) return root
  return addChildNode(withoutNode, newParentId, nodeToMove, index)
}

/** 默认页面 Schema */
function createDefaultSchema(): PageSchema {
  return {
    meta: { id: genId(), name: 'Untitled', title: '未命名页面' },
    componentTree: {
      id: 'root',
      componentName: 'div',
      className: 'page-root',
      children: [],
    },
    state: [],
    methods: [],
    dataSources: [],
  }
}

/** 最大历史记录数 */
const MAX_HISTORY = 50

function pushHistory(state: EditorState, newSchema: PageSchema): EditorState {
  const newHistory = state.history.slice(0, state.historyIndex + 1)
  newHistory.push(newSchema)
  if (newHistory.length > MAX_HISTORY) newHistory.shift()
  return {
    ...state,
    pageSchema: newSchema,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  }
}

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SELECT_NODE':
      return { ...state, selectedId: action.payload }

    case 'UPDATE_NODE': {
      const { id, updates } = action.payload
      const newSchema = {
        ...state.pageSchema,
        componentTree: updateNode(state.pageSchema.componentTree, id, updates),
      }
      return pushHistory(state, newSchema)
    }

    case 'ADD_NODE': {
      const { parentId, node, index } = action.payload
      const newSchema = {
        ...state.pageSchema,
        componentTree: addChildNode(state.pageSchema.componentTree, parentId, node, index),
      }
      return pushHistory(state, newSchema)
    }

    case 'REMOVE_NODE': {
      const newTree = removeNode(state.pageSchema.componentTree, action.payload)
      if (!newTree) return state
      return pushHistory(state, { ...state.pageSchema, componentTree: newTree })
    }

    case 'MOVE_NODE': {
      const { id, newParentId, index } = action.payload
      const newTree = moveNode(state.pageSchema.componentTree, id, newParentId, index)
      return pushHistory(state, { ...state.pageSchema, componentTree: newTree })
    }

    case 'SET_SCHEMA':
      return pushHistory(state, action.payload)

    case 'SET_MODE':
      return { ...state, mode: action.payload }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state
      const newIndex = state.historyIndex - 1
      return {
        ...state,
        pageSchema: state.history[newIndex],
        historyIndex: newIndex,
      }
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state
      const newIndex = state.historyIndex + 1
      return {
        ...state,
        pageSchema: state.history[newIndex],
        historyIndex: newIndex,
      }
    }

    default:
      return state
  }
}

export function useEditorState(initialSchema?: PageSchema) {
  const initial = initialSchema || createDefaultSchema()
  const [state, dispatch] = useReducer(reducer, {
    pageSchema: initial,
    selectedId: null,
    mode: 'design',
    history: [initial],
    historyIndex: 0,
  })

  const selectNode = useCallback((id: string | null) => dispatch({ type: 'SELECT_NODE', payload: id }), [])
  const updateNodeAction = useCallback(
    (id: string, updates: Partial<ComponentNode>) =>
      dispatch({ type: 'UPDATE_NODE', payload: { id, updates } }),
    []
  )
  const addNode = useCallback(
    (parentId: string, node: ComponentNode, index?: number) =>
      dispatch({ type: 'ADD_NODE', payload: { parentId, node, index } }),
    []
  )
  const removeNodeAction = useCallback((id: string) => dispatch({ type: 'REMOVE_NODE', payload: id }), [])
  const moveNodeAction = useCallback(
    (id: string, newParentId: string, index: number) =>
      dispatch({ type: 'MOVE_NODE', payload: { id, newParentId, index } }),
    []
  )
  const setSchema = useCallback((schema: PageSchema) => dispatch({ type: 'SET_SCHEMA', payload: schema }), [])
  const setMode = useCallback((mode: EditorMode) => dispatch({ type: 'SET_MODE', payload: mode }), [])
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), [])
  const redo = useCallback(() => dispatch({ type: 'REDO' }), [])

  return {
    state,
    selectNode,
    updateNode: updateNodeAction,
    addNode,
    removeNode: removeNodeAction,
    moveNode: moveNodeAction,
    setSchema,
    setMode,
    undo,
    redo,
    dispatch,
  }
}
