import { useRef, useState } from 'react'
import type { FlowGraph, FlowEdge, FlowNodeType } from './flowEngine'
import { createFlowNode, getNodeColor, getNodeLabel } from './flowEngine'
import FlowNodeComponent from './FlowNode'
import FlowConnection, { TempConnection } from './FlowConnection'
import './index.css'

const NODE_TYPES: FlowNodeType[] = ['trigger', 'condition', 'action', 'variable', 'end']

const ACTION_TYPES = [
  { value: 'toast', label: '提示' },
  { value: 'modal', label: '弹窗' },
  { value: 'showModal', label: '显示弹窗组件' },
  { value: 'request', label: '调用接口' },
  { value: 'openUrl', label: '打开链接' },
]

const OPERATORS = [
  { value: '===', label: '等于' },
  { value: '!==', label: '不等于' },
  { value: '>', label: '大于' },
  { value: '<', label: '小于' },
  { value: '>=', label: '大于等于' },
  { value: '<=', label: '小于等于' },
  { value: 'contains', label: '包含' },
  { value: 'empty', label: '为空' },
  { value: 'notEmpty', label: '不为空' },
]

export default function FlowEditor({
  flow,
  onChange,
  widgetNames,
}: {
  flow: FlowGraph
  onChange: (flow: FlowGraph) => void
  widgetNames: { id: string; name: string }[]
}) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState<{ nodeId: string; dx: number; dy: number } | null>(null)
  const [panning, setPanning] = useState<{ dx: number; dy: number } | null>(null)
  const [connecting, setConnecting] = useState<{ fromNode: string; fromPort: string; x1: number; y1: number; x2: number; y2: number } | null>(null)

  const selectedNode = flow.nodes.find((n) => n.id === selectedNodeId) ?? null

  const updateNodeConfig = (id: string, key: string, value: string) => {
    onChange({
      ...flow,
      nodes: flow.nodes.map((n) => (n.id === id ? { ...n, config: { ...n.config, [key]: value } } : n)),
    })
  }

  const addNode = (type: FlowNodeType) => {
    const node = createFlowNode(type, 100 - pan.x + Math.random() * 100, 100 - pan.y + Math.random() * 100)
    onChange({ ...flow, nodes: [...flow.nodes, node] })
    setSelectedNodeId(node.id)
    setSelectedEdgeId(null)
  }

  const deleteSelected = () => {
    if (selectedNodeId) {
      onChange({
        nodes: flow.nodes.filter((n) => n.id !== selectedNodeId),
        edges: flow.edges.filter((e) => e.from !== selectedNodeId && e.to !== selectedNodeId),
      })
      setSelectedNodeId(null)
    }
    if (selectedEdgeId) {
      onChange({ ...flow, edges: flow.edges.filter((e) => e.id !== selectedEdgeId) })
      setSelectedEdgeId(null)
    }
  }

  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('flow-canvas-inner')) {
      setSelectedNodeId(null)
      setSelectedEdgeId(null)
      setPanning({ dx: e.clientX - pan.x, dy: e.clientY - pan.y })
    }
  }

  const onCanvasMouseMove = (e: React.MouseEvent) => {
    if (panning) {
      setPan({ x: e.clientX - panning.dx, y: e.clientY - panning.dy })
      return
    }
    if (dragging) {
      onChange({
        ...flow,
        nodes: flow.nodes.map((n) =>
          n.id === dragging.nodeId
            ? { ...n, x: Math.round(e.clientX - dragging.dx - pan.x), y: Math.round(e.clientY - dragging.dy - pan.y) }
            : n,
        ),
      })
      return
    }
    if (connecting) {
      setConnecting({ ...connecting, x2: e.clientX - pan.x, y2: e.clientY - pan.y })
    }
  }

  const onCanvasMouseUp = () => {
    setDragging(null)
    setPanning(null)
    setConnecting(null)
  }

  const onPortMouseDown = (nodeId: string, portId: string, x: number, y: number) => {
    setConnecting({ fromNode: nodeId, fromPort: portId, x1: x - pan.x, y1: y - pan.y, x2: x - pan.x, y2: y - pan.y })
  }

  const onPortMouseUp = (nodeId: string, portId: string) => {
    if (!connecting || connecting.fromNode === nodeId) { setConnecting(null); return }
    const exists = flow.edges.some((e) => e.fromPort === connecting.fromPort && e.toPort === portId)
    if (!exists) {
      const edge: FlowEdge = {
        id: `fe-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        from: connecting.fromNode,
        fromPort: connecting.fromPort,
        to: nodeId,
        toPort: portId,
      }
      onChange({ ...flow, edges: [...flow.edges, edge] })
    }
    setConnecting(null)
  }

  return (
    <div className="flow-editor">
      <div className="flow-toolbar">
        {NODE_TYPES.map((type) => (
          <button key={type} type="button" className="flow-add-btn" style={{ borderColor: getNodeColor(type) }} onClick={() => addNode(type)}>
            + {getNodeLabel(type)}
          </button>
        ))}
        {(selectedNodeId || selectedEdgeId) && (
          <button type="button" className="flow-delete-btn" onClick={deleteSelected}>删除</button>
        )}
      </div>
      <div
        className="flow-canvas"
        ref={canvasRef}
        onMouseDown={onCanvasMouseDown}
        onMouseMove={onCanvasMouseMove}
        onMouseUp={onCanvasMouseUp}
      >
        <div className="flow-canvas-inner" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
          <svg className="flow-connections">
            {flow.edges.map((edge) => (
              <FlowConnection
                key={edge.id}
                edge={edge}
                nodes={flow.nodes}
                selected={selectedEdgeId === edge.id}
                onSelect={() => { setSelectedEdgeId(edge.id); setSelectedNodeId(null) }}
              />
            ))}
            {connecting && <TempConnection x1={connecting.x1} y1={connecting.y1} x2={connecting.x2} y2={connecting.y2} />}
          </svg>
          {flow.nodes.map((node) => (
            <FlowNodeComponent
              key={node.id}
              node={node}
              selected={selectedNodeId === node.id}
              onPortMouseDown={onPortMouseDown}
              onPortMouseUp={onPortMouseUp}
              onSelect={() => { setSelectedNodeId(node.id); setSelectedEdgeId(null) }}
              onDragStart={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                setDragging({ nodeId: node.id, dx: e.clientX - rect.left, dy: e.clientY - rect.top })
              }}
            />
          ))}
        </div>
      </div>
      {selectedNode && (
        <div className="flow-props">
          <strong>{getNodeLabel(selectedNode.type)}</strong>
          {selectedNode.type === 'trigger' && (
            <label>
              触发事件
              <select value={selectedNode.config.event} onChange={(e) => updateNodeConfig(selectedNode.id, 'event', e.target.value)}>
                <option value="click">点击</option>
                <option value="doubleClick">双击</option>
                <option value="mouseEnter">鼠标进入</option>
                <option value="mouseLeave">鼠标离开</option>
                <option value="submit">提交</option>
              </select>
            </label>
          )}
          {selectedNode.type === 'condition' && (
            <>
              <label>
                变量名
                <input value={selectedNode.config.variable} onChange={(e) => updateNodeConfig(selectedNode.id, 'variable', e.target.value)} />
              </label>
              <label>
                运算符
                <select value={selectedNode.config.operator} onChange={(e) => updateNodeConfig(selectedNode.id, 'operator', e.target.value)}>
                  {OPERATORS.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
                </select>
              </label>
              {selectedNode.config.operator !== 'empty' && selectedNode.config.operator !== 'notEmpty' && (
                <label>
                  比较值
                  <input value={selectedNode.config.value} onChange={(e) => updateNodeConfig(selectedNode.id, 'value', e.target.value)} />
                </label>
              )}
            </>
          )}
          {selectedNode.type === 'action' && (
            <>
              <label>
                动作类型
                <select value={selectedNode.config.actionType} onChange={(e) => updateNodeConfig(selectedNode.id, 'actionType', e.target.value)}>
                  {ACTION_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </label>
              {(selectedNode.config.actionType === 'toast' || selectedNode.config.actionType === 'modal') && (
                <>
                  <label>标题<input value={selectedNode.config.title} onChange={(e) => updateNodeConfig(selectedNode.id, 'title', e.target.value)} /></label>
                  <label>内容<textarea value={selectedNode.config.message} onChange={(e) => updateNodeConfig(selectedNode.id, 'message', e.target.value)} /></label>
                </>
              )}
              {selectedNode.config.actionType === 'request' && (
                <>
                  <label>
                    请求方式
                    <select value={selectedNode.config.method} onChange={(e) => updateNodeConfig(selectedNode.id, 'method', e.target.value)}>
                      <option value="GET">GET</option><option value="POST">POST</option>
                    </select>
                  </label>
                  <label>地址<input value={selectedNode.config.url} onChange={(e) => updateNodeConfig(selectedNode.id, 'url', e.target.value)} /></label>
                  <label>请求体<textarea value={selectedNode.config.body} onChange={(e) => updateNodeConfig(selectedNode.id, 'body', e.target.value)} /></label>
                </>
              )}
              {selectedNode.config.actionType === 'openUrl' && (
                <label>链接<input value={selectedNode.config.url} onChange={(e) => updateNodeConfig(selectedNode.id, 'url', e.target.value)} /></label>
              )}
              {selectedNode.config.actionType === 'showModal' && (
                <label>
                  目标弹窗
                  <select value={selectedNode.config.targetWidgetId} onChange={(e) => updateNodeConfig(selectedNode.id, 'targetWidgetId', e.target.value)}>
                    <option value="">请选择</option>
                    {widgetNames.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </label>
              )}
            </>
          )}
          {selectedNode.type === 'variable' && (
            <>
              <label>变量名<input value={selectedNode.config.name} onChange={(e) => updateNodeConfig(selectedNode.id, 'name', e.target.value)} /></label>
              <label>值<input value={selectedNode.config.value} onChange={(e) => updateNodeConfig(selectedNode.id, 'value', e.target.value)} /></label>
            </>
          )}
        </div>
      )}
    </div>
  )
}
