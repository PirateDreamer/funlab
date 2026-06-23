import { Segmented, Button, Tooltip, Space, Dropdown, message } from 'antd'
import type { MenuProps } from 'antd'
import {
  UndoOutlined,
  RedoOutlined,
  CodeOutlined,
  SaveOutlined,
  ExportOutlined,
  EyeOutlined,
  EditOutlined,
  ImportOutlined,
  DesktopOutlined,
  TabletOutlined,
  MobileOutlined,
  DownOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import type { EditorMode, DeviceType, DevicePreset } from '../types'
import { DEVICE_PRESETS } from '../types'
import type { PageSchema } from '../../../core/protocol'
import { generatePageCode } from '../../../core/codegen'
import { buildPreviewHtml } from '../../../core/previewHtml'
import styles from '../style.module.css'

interface ToolbarProps {
  mode: EditorMode
  onModeChange: (mode: EditorMode) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  schema: PageSchema
  device: DevicePreset
  onDeviceChange: (device: DevicePreset) => void
  onImport?: () => void
  onPublish?: () => void
}

/** 下载文件 */
function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** 保存到 localStorage */
function saveToLocalStorage(schema: PageSchema) {
  try {
    localStorage.setItem('funlab-editor-draft', JSON.stringify(schema))
    message.success('已保存草稿')
  } catch {
    message.error('保存失败')
  }
}

/** 设备类型图标 */
const DEVICE_ICON: Record<DeviceType, React.ReactNode> = {
  pc: <DesktopOutlined />,
  tablet: <TabletOutlined />,
  mobile: <MobileOutlined />,
}

export default function Toolbar({
  mode,
  onModeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  schema,
  device,
  onDeviceChange,
  onImport,
  onPublish,
}: ToolbarProps) {
  const handleExport = () => {
    try {
      const code = generatePageCode(schema)
      downloadFile(`${schema.meta.name || 'page'}.tsx`, code)
      message.success('代码已导出')
    } catch (err) {
      message.error('导出失败: ' + String(err))
    }
  }

  const handleExportJson = () => {
    const json = JSON.stringify(schema, null, 2)
    downloadFile(`${schema.meta.name || 'page'}.json`, json)
    message.success('JSON 已导出')
  }

  const handleDownloadHtml = () => {
    try {
      const html = buildPreviewHtml(schema)
      downloadFile(`${schema.meta.name || 'page'}.html`, html)
      message.success('HTML 已下载')
    } catch (err) {
      message.error('下载失败: ' + String(err))
    }
  }

  // 按设备类型分组的下拉菜单
  const deviceMenuItems: MenuProps['items'] = []
  let lastType: DeviceType | null = null
  for (const preset of DEVICE_PRESETS) {
    if (preset.deviceType !== lastType) {
      if (lastType !== null) {
        deviceMenuItems.push({ type: 'divider' })
      }
      lastType = preset.deviceType
    }
    deviceMenuItems.push({
      key: preset.name,
      label: (
        <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <span>{preset.name}</span>
          <span style={{ color: '#999', fontSize: 11 }}>{preset.width}×{preset.height}</span>
        </span>
      ),
      onClick: () => onDeviceChange(preset),
    })
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        <Space>
          <Tooltip title="撤销">
            <Button size="small" icon={<UndoOutlined />} disabled={!canUndo} onClick={onUndo} />
          </Tooltip>
          <Tooltip title="重做">
            <Button size="small" icon={<RedoOutlined />} disabled={!canRedo} onClick={onRedo} />
          </Tooltip>
        </Space>

        {/* 设备切换器 */}
        {mode === 'design' && (
          <div className={styles.deviceSelector} style={{ marginLeft: 12 }}>
            {(['pc', 'tablet', 'mobile'] as DeviceType[]).map((type) => (
              <Tooltip key={type} title={type === 'pc' ? '桌面端' : type === 'tablet' ? '平板' : '移动端'}>
                <button
                  className={[styles.deviceBtn, device.deviceType === type ? styles.deviceBtnActive : ''].filter(Boolean).join(' ')}
                  onClick={() => {
                    const first = DEVICE_PRESETS.find((p) => p.deviceType === type)
                    if (first) onDeviceChange(first)
                  }}
                >
                  {DEVICE_ICON[type]}
                </button>
              </Tooltip>
            ))}
            <Dropdown menu={{ items: deviceMenuItems }} trigger={['click']}>
              <button className={styles.deviceBtn} style={{ width: 'auto', padding: '0 6px', fontSize: 11, gap: 2, display: 'flex', alignItems: 'center' }}>
                {device.name}
                <DownOutlined style={{ fontSize: 9 }} />
              </button>
            </Dropdown>
          </div>
        )}
      </div>

      <div className={styles.toolbarCenter}>
        <Segmented
          size="small"
          value={mode}
          onChange={(val) => onModeChange(val as EditorMode)}
          options={[
            { label: '设计', value: 'design', icon: <EditOutlined /> },
            { label: 'JSON', value: 'json', icon: <CodeOutlined /> },
            { label: '预览', value: 'preview', icon: <EyeOutlined /> },
          ]}
        />
      </div>

      <div className={styles.toolbarRight}>
        <Space>
          {onImport && (
            <Tooltip title="导入 JSX 组件">
              <Button size="small" icon={<ImportOutlined />} onClick={onImport}>
                导入
              </Button>
            </Tooltip>
          )}
          <Tooltip title="保存草稿">
            <Button size="small" icon={<SaveOutlined />} onClick={() => saveToLocalStorage(schema)} />
          </Tooltip>
          <Tooltip title="导出 JSON">
            <Button size="small" icon={<CodeOutlined />} onClick={handleExportJson} />
          </Tooltip>
          <Tooltip title="下载 HTML 文件">
            <Button size="small" icon={<DownloadOutlined />} onClick={handleDownloadHtml} />
          </Tooltip>
          <Tooltip title="导出 React 代码">
            <Button size="small" icon={<ExportOutlined />} onClick={handleExport}>
              导出代码
            </Button>
          </Tooltip>
          {onPublish && (
            <Tooltip title="发布为独立网页">
              <Button size="small" type="primary" icon={<CloudUploadOutlined />} onClick={onPublish}>
                发布网页
              </Button>
            </Tooltip>
          )}
        </Space>
      </div>
    </div>
  )
}
