import Editor from '@monaco-editor/react'
import type { PageSchema } from '../../../core/protocol'
import styles from '../style.module.css'

interface JsonEditorProps {
  schema: PageSchema
  onChange: (schema: PageSchema) => void
}

export default function JsonEditor({ schema, onChange }: JsonEditorProps) {
  const handleEditorChange = (value: string | undefined) => {
    if (!value) return
    try {
      const parsed = JSON.parse(value) as PageSchema
      onChange(parsed)
    } catch {
      // JSON 格式错误时不更新，避免丢失状态
    }
  }

  return (
    <div className={styles.jsonEditorWrapper}>
      <Editor
        height="100%"
        language="json"
        value={JSON.stringify(schema, null, 2)}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          formatOnPaste: true,
          tabSize: 2,
          automaticLayout: true,
        }}
        theme="vs-dark"
      />
    </div>
  )
}
