// 流程执行引擎

export type FlowPort = { id: string; type: 'in' | 'out'; label: string }

export type FlowNodeType = 'trigger' | 'condition' | 'action' | 'variable' | 'end'

export type FlowNode = {
  id: string
  type: FlowNodeType
  x: number
  y: number
  config: Record<string, string>
  ports: FlowPort[]
}

export type FlowEdge = {
  id: string
  from: string
  fromPort: string
  to: string
  toPort: string
}

export type FlowGraph = {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export type FlowActionHandler = (config: Record<string, string>, ctx: Record<string, string>) => Promise<void>

export function createFlowNode(type: FlowNodeType, x: number, y: number): FlowNode {
  const id = `fn-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const base = { id, type, x, y, config: {} as Record<string, string> }

  switch (type) {
    case 'trigger':
      return { ...base, config: { event: 'click' }, ports: [{ id: `${id}-out`, type: 'out', label: '触发' }] }
    case 'condition':
      return {
        ...base,
        config: { variable: '', operator: '===', value: '' },
        ports: [
          { id: `${id}-in`, type: 'in', label: '输入' },
          { id: `${id}-true`, type: 'out', label: '是' },
          { id: `${id}-false`, type: 'out', label: '否' },
        ],
      }
    case 'action':
      return {
        ...base,
        config: { actionType: 'toast', message: '', title: '', url: '', method: 'GET', body: '{}', targetWidgetId: '' },
        ports: [
          { id: `${id}-in`, type: 'in', label: '输入' },
          { id: `${id}-out`, type: 'out', label: '输出' },
        ],
      }
    case 'variable':
      return {
        ...base,
        config: { name: '', value: '' },
        ports: [
          { id: `${id}-in`, type: 'in', label: '输入' },
          { id: `${id}-out`, type: 'out', label: '输出' },
        ],
      }
    case 'end':
      return { ...base, ports: [{ id: `${id}-in`, type: 'in', label: '结束' }] }
  }
}

export async function executeFlow(
  flow: FlowGraph,
  triggerEvent: string,
  handler: FlowActionHandler,
): Promise<Record<string, string>> {
  const ctx: Record<string, string> = {}
  const visited = new Set<string>()

  const triggerNode = flow.nodes.find((n) => n.type === 'trigger' && n.config.event === triggerEvent)
  if (!triggerNode) return ctx

  const outPort = triggerNode.ports.find((p) => p.type === 'out')
  if (!outPort) return ctx

  await walk(flow, outPort.id, ctx, visited, handler)
  return ctx
}

async function walk(
  flow: FlowGraph,
  fromPortId: string,
  ctx: Record<string, string>,
  visited: Set<string>,
  handler: FlowActionHandler,
): Promise<void> {
  const edge = flow.edges.find((e) => e.fromPort === fromPortId)
  if (!edge) return

  const node = flow.nodes.find((n) => n.id === edge.to)
  if (!node || visited.has(node.id)) return
  visited.add(node.id)

  if (node.type === 'condition') {
    const val = ctx[node.config.variable] ?? ''
    const target = node.config.value ?? ''
    let result = false
    switch (node.config.operator) {
      case '===': result = val === target; break
      case '!==': result = val !== target; break
      case '>': result = Number(val) > Number(target); break
      case '<': result = Number(val) < Number(target); break
      case '>=': result = Number(val) >= Number(target); break
      case '<=': result = Number(val) <= Number(target); break
      case 'contains': result = val.includes(target); break
      case 'empty': result = val === ''; break
      case 'notEmpty': result = val !== ''; break
    }
    const portLabel = result ? 'true' : 'false'
    void portLabel
    const outPort = node.ports.find((p) => p.type === 'out' && p.label === (result ? '是' : '否'))
    if (outPort) await walk(flow, outPort.id, ctx, visited, handler)
    return
  }

  if (node.type === 'variable') {
    ctx[node.config.name] = node.config.value ?? ''
  }

  if (node.type === 'action') {
    await handler(node.config, ctx)
  }

  if (node.type === 'end') return

  const outPort = node.ports.find((p) => p.type === 'out')
  if (outPort) await walk(flow, outPort.id, ctx, visited, handler)
}

export function getNodeColor(type: FlowNodeType): string {
  switch (type) {
    case 'trigger': return '#52c41a'
    case 'condition': return '#faad14'
    case 'action': return '#1677ff'
    case 'variable': return '#722ed1'
    case 'end': return '#ff4d4f'
  }
}

export function getNodeLabel(type: FlowNodeType): string {
  switch (type) {
    case 'trigger': return '触发器'
    case 'condition': return '条件判断'
    case 'action': return '执行动作'
    case 'variable': return '设置变量'
    case 'end': return '结束'
  }
}
