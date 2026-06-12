import { useMemo } from 'react'
import type { PageSchema } from '../../../core/protocol'
import { generatePreviewCode } from '../../../core/previewGen'
import styles from '../style.module.css'

interface PreviewPanelProps {
  schema: PageSchema
}

/** 构建 iframe srcdoc（纯 JS，不需要 Babel） */
function buildPreviewHtml(code: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; padding: 16px; }
    .page-root { min-height: 100%; }
    .preview-error { color: #ff4d4f; padding: 16px; background: #fff2f0; border-radius: 4px; white-space: pre-wrap; font-family: monospace; font-size: 13px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script>
    try {
      ${code}
    } catch (err) {
      document.getElementById('root').innerHTML =
        '<div class="preview-error"><b>预览错误:</b>\\n' + err.message + '</div>';
    }
  <\/script>
</body>
</html>`
}

export default function PreviewPanel({ schema }: PreviewPanelProps) {
  const html = useMemo(() => {
    try {
      const code = generatePreviewCode(schema)
      return buildPreviewHtml(code)
    } catch (err) {
      return `<html><body><pre style="color:red;padding:16px">${String(err)}</pre></body></html>`
    }
  }, [schema])

  return (
    <div className={styles.previewWrapper}>
      <iframe
        className={styles.previewIframe}
        srcDoc={html}
        title="页面预览"
      />
    </div>
  )
}
