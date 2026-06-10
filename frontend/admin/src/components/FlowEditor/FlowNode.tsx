import type { FlowNode as FlowNodeType } from './flowEngine'
import { getNodeColor, getNodeLabel } from './flowEngine'

const NODE_W = 180

export default function FlowNodeComponent({
  node,
  selected,
  onPortMouseDown,
  onPortMouseUp,
  onSelect,
  onDragStart,
}: {
  node: FlowNodeType
  selected: boolean
  onPortMouseDown: (nodeId: string, portId: string, x: number, y: number) => void
  onPortMouseUp: (nodeId: string, portId: string) => void
  onSelect: () => void
  onDragStart: (e: React.MouseEvent) => void
}) {
  const color = getNodeColor(node.type)
  const label = getNodeLabel(node.type)
  const inPorts = node.ports.filter((p) => p.type === 'in')
  const outPorts = node.ports.filter((p) => p.type === 'out')

  return (
    <div
      className={`flow-node ${selected ? 'selected' : ''}`}
      style={{ left: node.x, top: node.y, width: NODE_W, borderColor: color }}
      onMouseDown={(e) => {
        e.stopPropagation()
        onSelect()
        onDragStart(e)
      }}
    >
      <div className="flow-node-head" style={{ background: color }}>
        <span>{label}</span>
      </div>
      <div className="flow-node-body">
        {node.type === 'trigger' && <span className="flow-node-info">事件: {node.config.event}</span>}
        {node.type === 'condition' && (
          <span className="flow-node-info">{node.config.variable} {node.config.operator} {node.config.value}</span>
        )}
        {node.type === 'action' && <span className="flow-node-info">{node.config.actionType}</span>}
        {node.type === 'variable' && <span className="flow-node-info">{node.config.name} = {node.config.value}</span>}
        {node.type === 'end' && <span className="flow-node-info">流程结束</span>}
      </div>
      <div className="flow-node-ports">
        <div className="flow-ports-in">
          {inPorts.map((port) => (
            <div
              className="flow-port flow-port-in"
              key={port.id}
              data-port-id={port.id}
              onMouseDown={(e) => { e.stopPropagation() }}
              onMouseUp={(e) => { e.stopPropagation(); onPortMouseUp(node.id, port.id) }}
            >
              <span className="flow-port-dot" style={{ borderColor: color }} />
              <span className="flow-port-label">{port.label}</span>
            </div>
          ))}
        </div>
        <div className="flow-ports-out">
          {outPorts.map((port) => (
            <div
              className="flow-port flow-port-out"
              key={port.id}
              data-port-id={port.id}
              onMouseDown={(e) => {
                e.stopPropagation()
                const rect = (e.target as HTMLElement).getBoundingClientRect()
                onPortMouseDown(node.id, port.id, rect.left + rect.width / 2, rect.top + rect.height / 2)
              }}
            >
              <span className="flow-port-label">{port.label}</span>
              <span className="flow-port-dot" style={{ borderColor: color }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
