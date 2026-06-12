import { useMemo, useState } from 'react'
import { Segmented } from 'antd'
import { EyeOutlined, CodeOutlined } from '@ant-design/icons'
import Editor from '@monaco-editor/react'
import type { PageSchema } from '../../../core/protocol'
import type { DevicePreset } from '../types'
import { generatePreviewCode } from '../../../core/previewGen'
import styles from '../style.module.css'

interface PreviewPanelProps {
  schema: PageSchema
  device: DevicePreset
}

/** 检查 schema 中是否用到了 antd-mobile 组件 */
function hasMobileComponents(schema: PageSchema): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const check = (node: any): boolean => {
    if (node.meta?.package === 'antd-mobile') return true
    if (node.children) {
      return node.children.some((c: unknown) => typeof c !== 'string' && check(c))
    }
    return false
  }
  return check(schema.componentTree)
}

/** 构建 iframe srcdoc */
function buildPreviewHtml(code: string, needMobile: boolean): string {
  const mobileJS = needMobile
    ? `<script crossorigin src="https://unpkg.com/antd-mobile@5.42.3/umd/antd-mobile.js"><\/script>`
    : ''
  const mobileInit = needMobile
    ? `var antdMobile = window.antdMobile || {};`
    : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px; }
    .page-root { min-height: 100%; }
    .preview-error { color: #ff4d4f; padding: 16px; background: #fff2f0; border-radius: 4px; white-space: pre-wrap; font-family: monospace; font-size: 13px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  ${mobileJS}
  <script>
    ${mobileInit}
    try {
      ${code}
    } catch (err) {
      document.getElementById('root').innerHTML =
        '<div class="preview-error"><b>预览错误:</b>\\n' + err.message + '\\n\\n' + (err.stack || '') + '</div>';
    }
  <\/script>
</body>
</html>`
}

export default function PreviewPanel({ schema, device }: PreviewPanelProps) {
  const [view, setView] = useState<'preview' | 'code'>('preview')

  const code = useMemo(() => {
    try {
      return generatePreviewCode(schema)
    } catch {
      return '// 代码生成失败'
    }
  }, [schema])

  const html = useMemo(() => {
    try {
      const needMobile = hasMobileComponents(schema)
      return buildPreviewHtml(code, needMobile)
    } catch (err) {
      return `<html><body><pre style="color:red;padding:16px">${String(err)}</pre></body></html>`
    }
  }, [schema, code])

  const isMobile = device.deviceType !== 'pc'

  return (
    <div className={styles.previewWrapper}>
      {/* 顶部切换栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '8px 0',
        background: '#fff',
        borderBottom: '1px solid #e8e8e8',
        flexShrink: 0,
      }}>
        <Segmented
          size="small"
          value={view}
          onChange={(v) => setView(v as 'preview' | 'code')}
          options={[
            { label: '预览', value: 'preview', icon: <EyeOutlined /> },
            { label: '代码', value: 'code', icon: <CodeOutlined /> },
          ]}
        />
      </div>

      {/* 内容区 */}
      {view === 'preview' ? (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'stretch',
          justifyContent: 'center',
          padding: isMobile ? '24px 0' : 0,
          overflow: 'auto',
          background: '#f0f2f5',
          position: 'relative',
        }}>
          <div style={{
            width: isMobile ? device.width : '100%',
            height: isMobile ? device.height : '100%',
            maxWidth: isMobile ? device.width : '100%',
            border: isMobile ? '8px solid #1a1a1a' : 'none',
            borderRadius: isMobile ? 24 : 0,
            boxShadow: isMobile ? '0 8px 24px rgba(0,0,0,0.15)' : 'none',
            overflow: 'hidden',
            background: '#fff',
            position: 'relative',
            transition: 'width 0.3s ease, height 0.3s ease',
          }}>
            {/* 手机刘海 */}
            {isMobile && (
              <div style={{
                height: 36,
                background: '#1a1a1a',
                borderRadius: '24px 24px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: 100,
                  height: 22,
                  background: '#000',
                  borderRadius: '0 0 14px 14px',
                }} />
              </div>
            )}

            <iframe
              style={{
                width: '100%',
                height: isMobile ? 'calc(100% - 36px)' : '100%',
                border: 'none',
                display: 'block',
              }}
              srcDoc={html}
              title="页面预览"
            />
          </div>

          {/* 设备信息 */}
          {isMobile && (
            <div style={{
              position: 'absolute',
              bottom: 8,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 11,
              color: '#999',
              pointerEvents: 'none',
            }}>
              {device.name} · {device.width} × {device.height}
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Editor
            height="100%"
            language="javascript"
            value={code}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 2,
              automaticLayout: true,
              domReadOnly: true,
              contextmenu: true,
              copyWithSyntaxHighlighting: true,
            }}
            theme="vs-dark"
          />
        </div>
      )}
    </div>
  )
}
