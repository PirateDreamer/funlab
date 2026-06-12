import { useMemo } from 'react'
import type { PageSchema } from '../../../core/protocol'
import { generatePageCode } from '../../../core/codegen'
import styles from '../style.module.css'

interface PreviewPanelProps {
  schema: PageSchema
}

/** 构建 iframe srcdoc 内容 */
function buildPreviewHtml(code: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; padding: 16px; }
    .page-root { min-height: 100%; }
    .preview-error { color: #ff4d4f; padding: 16px; background: #fff2f0; border-radius: 4px; white-space: pre-wrap; font-family: monospace; font-size: 13px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="https://unpkg.com/react@19/umd/react.production.min.js"><\/script>
  <script src="https://unpkg.com/react-dom@19/umd/react-dom.production.min.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <script type="text/babel">
    try {
      ${code}

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(${getComponentName(code)}));
    } catch (err) {
      document.getElementById('root').innerHTML = '<div class="preview-error">' + err.message + '</div>';
    }
  <\/script>
</body>
</html>`
}

/** 从生成的代码中提取组件名 */
function getComponentName(code: string): string {
  const match = code.match(/export\s+default\s+(\w+)/)
  return match ? match[1] : 'App'
}

export default function PreviewPanel({ schema }: PreviewPanelProps) {
  const html = useMemo(() => {
    try {
      const code = generatePageCode(schema)
      return buildPreviewHtml(code)
    } catch (err) {
      return `<html><body><pre style="color:red">${String(err)}</pre></body></html>`
    }
  }, [schema])

  return (
    <div className={styles.previewWrapper}>
      <iframe
        className={styles.previewIframe}
        srcDoc={html}
        sandbox="allow-scripts"
        title="页面预览"
      />
    </div>
  )
}
