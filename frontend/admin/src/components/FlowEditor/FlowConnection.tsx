import type { FlowEdge, FlowNode } from './flowEngine'

export default function FlowConnection({
  edge,
  nodes,
  selected,
  onSelect,
}: {
  edge: FlowEdge
  nodes: FlowNode[]
  selected: boolean
  onSelect: () => void
}) {
  const fromNode = nodes.find((n) => n.id === edge.from)
  const toNode = nodes.find((n) => n.id === edge.to)
  if (!fromNode || !toNode) return null

  const NODE_W = 180
  const fromPortIdx = fromNode.ports.filter((p) => p.type === 'out').findIndex((p) => p.id === edge.fromPort)
  const toPortIdx = toNode.ports.filter((p) => p.type === 'in').findIndex((p) => p.id === edge.toPort)

  const x1 = fromNode.x + NODE_W
  const y1 = fromNode.y + 36 + 28 + fromPortIdx * 26 + 10
  const x2 = toNode.x
  const y2 = toNode.y + 36 + 28 + toPortIdx * 26 + 10

  const dx = Math.abs(x2 - x1) * 0.5
  const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`

  return (
    <g onClick={(e) => { e.stopPropagation(); onSelect() }}>
      <path d={path} fill="none" stroke={selected ? '#1677ff' : '#8a94a6'} strokeWidth={selected ? 3 : 2} />
      {selected && <path d={path} fill="none" stroke="#1677ff" strokeWidth={6} opacity={0.15} />}
    </g>
  )
}

export function TempConnection({
  x1, y1, x2, y2,
}: {
  x1: number; y1: number; x2: number; y2: number
}) {
  const dx = Math.abs(x2 - x1) * 0.5
  const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
  return <path d={path} fill="none" stroke="#1677ff" strokeWidth={2} strokeDasharray="6 4" />
}
