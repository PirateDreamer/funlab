import { useState, useEffect } from 'react'
import { Modal, Input, Space, Typography, Switch, message } from 'antd'
import Editor from '@monaco-editor/react'
import type { EventHandler } from '../../../core/protocol'

/** 注册 Monaco 额外类型定义（仅执行一次） */
let typesRegistered = false
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function registerExtraTypes(monaco: any) {
  if (typesRegistered) return
  typesRegistered = true

  // 添加 ES2023 + DOM 类型
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2023,
    lib: ['es2023', 'dom'],
    allowNonTsExtensions: true,
    allowJs: true,
    noEmit: true,
  })

  // 添加内联类型定义，提供 DOM 事件和常用 API 的提示
  const extraLib = `
    /** MouseEvent */
    interface MouseEvent {
      /** 事件类型 */
      readonly type: string;
      /** 触发事件的目标元素 */
      readonly target: EventTarget | null;
      /** 当前正在处理的元素 */
      readonly currentTarget: EventTarget | null;
      /** 鼠标 X 坐标 */
      readonly clientX: number;
      /** 鼠标 Y 坐标 */
      readonly clientY: number;
      /** 阻止默认行为 */
      preventDefault(): void;
      /** 阻止事件冒泡 */
      stopPropagation(): void;
    }
    /** KeyboardEvent */
    interface KeyboardEvent extends MouseEvent {
      /** 按键名 */
      readonly key: string;
      /** 按键码 */
      readonly code: string;
      /** 是否按下 Alt */
      readonly altKey: boolean;
      /** 是否按下 Ctrl */
      readonly ctrlKey: boolean;
      /** 是否按下 Shift */
      readonly shiftKey: boolean;
      /** 是否按下 Meta */
      readonly metaKey: boolean;
    }
    /** InputEvent */
    interface InputEvent {
      readonly type: string;
      readonly target: EventTarget | null;
      readonly data: string | null;
    }
    /** EventTarget */
    interface EventTarget {
      readonly value?: any;
      readonly checked?: boolean;
      readonly name?: string;
      readonly id?: string;
      readonly tagName?: string;
      getAttribute?(name: string): string | null;
      querySelector?(selector: string): Element | null;
      querySelectorAll?(selector: string): NodeListOf<Element>;
    }
    /** 常用全局函数 */
    declare function setTimeout(callback: (...args: any[]) => void, ms?: number): number;
    declare function clearTimeout(id: number): void;
    declare function setInterval(callback: (...args: any[]) => void, ms?: number): number;
    declare function clearInterval(id: number): void;
    declare function fetch(input: string, init?: RequestInit): Promise<Response>;
    declare const console: {
      log(...args: any[]): void;
      warn(...args: any[]): void;
      error(...args: any[]): void;
      info(...args: any[]): void;
    };
    declare const JSON: {
      parse(text: string): any;
      stringify(value: any, replacer?: any, space?: number): string;
    };
    declare const Math: {
      random(): number;
      floor(x: number): number;
      ceil(x: number): number;
      round(x: number): number;
      max(...values: number[]): number;
      min(...values: number[]): number;
    };
    /** localStorage */
    declare const localStorage: {
      getItem(key: string): string | null;
      setItem(key: string, value: string): void;
      removeItem(key: string): void;
      clear(): void;
    };
    /** 常用 React 状态更新模式 */
    type SetStateAction<S> = S | ((prevState: S) => S);
    type Dispatch<A> = (value: A) => void;
  `
  monaco.languages.typescript.javascriptDefaults.addExtraLib(extraLib, 'ts:event-handler.d.ts')

  // 注册代码片段补全
  monaco.languages.registerCompletionItemProvider('javascript', {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const suggestions: any[] = [
        {
          label: 'clg',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'console.log(${1:value})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'console.log()',
          range,
        },
        {
          label: 'fn',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '(${1:params}) => {\n\t${2}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '箭头函数',
          range,
        },
        {
          label: 'afn',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'async (${1:params}) => {\n\t${2}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'async 箭头函数',
          range,
        },
        {
          label: 'try',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'try {\n\t${1}\n} catch (err) {\n\tconsole.error(err)\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'try-catch 块',
          range,
        },
        {
          label: 'setState',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'setState((prev) => ({ ...prev, ${1:key}: ${2:value} }))',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'React setState 更新',
          range,
        },
        {
          label: 'fetch',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "const res = await fetch('${1:url}', {\n\tmethod: '${2:GET}',\n\theaders: { 'Content-Type': 'application/json' },\n})\nconst data = await res.json()",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'fetch 请求模板',
          range,
        },
        {
          label: 'e.target.value',
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: 'e.target.value',
          documentation: '获取输入框的值',
          range,
        },
        {
          label: 'e.preventDefault',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'e.preventDefault()',
          documentation: '阻止默认行为',
          range,
        },
        {
          label: 'e.stopPropagation',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'e.stopPropagation()',
          documentation: '阻止事件冒泡',
          range,
        },
      ]

      return { suggestions }
    },
  })
}

const { Text } = Typography

interface EventEditModalProps {
  open: boolean
  event?: EventHandler | null
  onClose: () => void
  onSave: (event: EventHandler) => void
}

/** 预设事件列表 */
const EVENT_PRESETS = [
  { value: 'click', label: '点击' },
  { value: 'change', label: '值变化' },
  { value: 'submit', label: '提交' },
  { value: 'focus', label: '获取焦点' },
  { value: 'blur', label: '失去焦点' },
  { value: 'keydown', label: '键盘按下' },
  { value: 'mouseover', label: '鼠标移入' },
  { value: 'mouseout', label: '鼠标移出' },
  { value: 'scroll', label: '滚动' },
  { value: 'input', label: '输入' },
]

/** 默认 handler 代码模板 */
const DEFAULT_HANDLER = `(e) => {
  console.log('event triggered', e)
}`

export default function EventEditModal({ open, event, onClose, onSave }: EventEditModalProps) {
  const [eventName, setEventName] = useState('')
  const [handlerCode, setHandlerCode] = useState('')
  const [preventDefault, setPreventDefault] = useState(false)
  const [stopPropagation, setStopPropagation] = useState(false)

  // 打开时填充数据
  useEffect(() => {
    if (open) {
      if (event) {
        setEventName(event.event)
        setHandlerCode(typeof event.handler === 'object' ? event.handler.value : '')
        setPreventDefault(event.preventDefault || false)
        setStopPropagation(event.stopPropagation || false)
      } else {
        setEventName('')
        setHandlerCode(DEFAULT_HANDLER)
        setPreventDefault(false)
        setStopPropagation(false)
      }
    }
  }, [open, event])

  const handleSave = () => {
    if (!eventName.trim()) {
      message.warning('请输入事件名')
      return
    }
    if (!handlerCode.trim()) {
      message.warning('请输入处理函数')
      return
    }

    onSave({
      event: eventName.trim(),
      handler: { type: 'JSFunction', value: handlerCode },
      preventDefault: preventDefault || undefined,
      stopPropagation: stopPropagation || undefined,
    })
    onClose()
  }

  return (
    <Modal
      title={event ? '编辑事件' : '添加事件'}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText="保存"
      cancelText="取消"
      width={860}
      destroyOnClose
    >
      <div style={{ marginTop: 16 }}>
        {/* 事件名 */}
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>事件名</Text>
          <Input
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="如 click、change、submit"
            list="event-presets"
          />
          <datalist id="event-presets">
            {EVENT_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </datalist>
          {/* 快捷标签 */}
          <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {EVENT_PRESETS.map((p) => (
              <span
                key={p.value}
                onClick={() => setEventName(p.value)}
                style={{
                  padding: '2px 8px',
                  fontSize: 11,
                  background: eventName === p.value ? '#e6f4ff' : '#f5f5f5',
                  color: eventName === p.value ? '#1677ff' : '#666',
                  borderRadius: 4,
                  cursor: 'pointer',
                  border: eventName === p.value ? '1px solid #91caff' : '1px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {p.label}
              </span>
            ))}
          </div>
        </div>

        {/* 处理函数 */}
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            处理函数
          </Text>
          <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
            <Editor
              height="360px"
              language="javascript"
              value={handlerCode}
              onChange={(val) => setHandlerCode(val || '')}
              beforeMount={registerExtraTypes}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                tabSize: 2,
                automaticLayout: true,
                suggest: {
                  showKeywords: true,
                  showSnippets: true,
                  showFunctions: true,
                  showClasses: true,
                  showVariables: true,
                  showProperties: true,
                  showMethods: true,
                  preview: true,
                },
                quickSuggestions: {
                  other: true,
                  comments: false,
                  strings: false,
                },
                parameterHints: { enabled: true },
                tabCompletion: 'on',
                wordBasedSuggestions: 'allDocuments',
                snippetSuggestions: 'inline',
              }}
              theme="vs-dark"
            />
          </div>
        </div>

        {/* 选项 */}
        <Space size={24}>
          <Space size={8}>
            <Switch size="small" checked={preventDefault} onChange={setPreventDefault} />
            <Text style={{ fontSize: 12 }}>preventDefault</Text>
          </Space>
          <Space size={8}>
            <Switch size="small" checked={stopPropagation} onChange={setStopPropagation} />
            <Text style={{ fontSize: 12 }}>stopPropagation</Text>
          </Space>
        </Space>
      </div>
    </Modal>
  )
}
