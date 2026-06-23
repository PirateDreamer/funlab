/**
 * 预览 HTML 构建器
 *
 * 将预览代码包装为完整的 HTML 页面，供 iframe 渲染或独立发布使用。
 */

import type { PageSchema } from './protocol'
import { generatePreviewCode } from './previewGen'

/** 检查 schema 中是否用到了 antd-mobile 组件 */
export function hasMobileComponents(schema: PageSchema): boolean {
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

/** 构建完整的预览 HTML */
export function buildPreviewHtml(schema: PageSchema): string {
  let code: string
  try {
    code = generatePreviewCode(schema)
  } catch {
    code = 'document.getElementById("root").innerHTML = "<pre style=\\"color:red\\">代码生成失败</pre>"'
  }

  const needMobile = hasMobileComponents(schema)
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
  <title>${schema.meta.title || schema.meta.name || '页面预览'}</title>
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
