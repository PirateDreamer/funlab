import { useState, useEffect } from 'react';
import {
  Card, Tabs, Descriptions, Tag, Button, Space, Typography, message, Table, Modal, Upload,
  Form, Input, Popconfirm, Switch, Skeleton,
} from 'antd';
import {
  ArrowLeftOutlined, CodeOutlined, UploadOutlined, PlusOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { mcpApi } from '../api';
import type { MCPService, MCPTool } from '../api';
import type { UploadProps } from 'antd';

const { Title, Paragraph, Text } = Typography;

export default function ServiceDetail() {
  const { id } = useParams();
  const [service, setService] = useState<MCPService | null>(null);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [toolModal, setToolModal] = useState(false);
  const [toolForm] = Form.useForm();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [svcRes, toolsRes] = await Promise.all([
        mcpApi.getService(Number(id)),
        mcpApi.listTools(Number(id)),
      ]);
      setService(svcRes.data.data);
      setTools(toolsRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    try {
      const res = await mcpApi.uploadTools(Number(id), options.file as File);
      message.success(res.data.message || '导入成功');
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.error || '导入失败');
    }
  };

  const handleAddTool = async () => {
    try {
      const values = await toolForm.validateFields();
      await mcpApi.createTool(Number(id), values);
      message.success('工具添加成功');
      setToolModal(false);
      toolForm.resetFields();
      fetchData();
    } catch { }
  };

  const handleDeleteTool = async (toolId: number) => {
    await mcpApi.deleteTool(Number(id), toolId);
    message.success('已删除');
    fetchData();
  };

  const handleToggleAuth = async (checked: boolean) => {
    try {
      await mcpApi.updateService(Number(id), { auth_enabled: checked } as any);
      setService(prev => prev ? { ...prev, auth_enabled: checked } : prev);
      message.success(checked ? '认证已启用' : '认证已禁用');
    } catch {
      message.error('操作失败');
    }
  };

  if (loading) return <Skeleton active />;

  if (!service) return <div>未找到该服务</div>;

  const toolColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '方法', dataIndex: 'http_method', key: 'http_method', render: (m: string) => <Tag>{m}</Tag> },
    { title: '路径', dataIndex: 'http_path', key: 'http_path', ellipsis: true },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '操作', key: 'actions',
      render: (_: any, record: MCPTool) => (
        <Popconfirm title="确认删除此工具？" onConfirm={() => handleDeleteTool(record.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/services')}>返回</Button>
        <Title level={3} style={{ margin: 0 }}>{service.name}</Title>
      </Space>

      <Tabs defaultActiveKey="info" items={[
        {
          key: 'info',
          label: '基本信息',
          children: (
            <Card>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="ID">{service.id}</Descriptions.Item>
                <Descriptions.Item label="名称">{service.name}</Descriptions.Item>
                <Descriptions.Item label="域名">{service.domain}</Descriptions.Item>
                <Descriptions.Item label="路径">{service.path}</Descriptions.Item>
                <Descriptions.Item label="类型">
                  <Tag color={service.service_type === 'http_to_mcp' ? 'blue' : 'green'}>
                    {service.service_type === 'http_to_mcp' ? 'HTTP 转 MCP' : '直连 MCP'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="传输协议"><Tag>{service.transport_type === 'streamable_http' ? '流式 HTTP' : 'SSE'}</Tag></Descriptions.Item>
                <Descriptions.Item label="后端地址"><Text copyable>{service.backend_url}</Text></Descriptions.Item>
                <Descriptions.Item label="描述">{service.description || '-'}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={service.status === 'active' ? 'green' : 'red'}>{service.status === 'active' ? '活跃' : '停用'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="认证">
                  <Switch checked={service.auth_enabled} onChange={handleToggleAuth} />
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">{new Date(service.created_at).toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="更新时间">{new Date(service.updated_at).toLocaleString()}</Descriptions.Item>
              </Descriptions>
            </Card>
          ),
        },
        {
          key: 'access',
          label: '访问信息',
          children: (
            <Card>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="访问地址">
                  <Text copyable style={{ fontSize: 16 }}>
                    http://{service.domain}{service.path}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="cURL 示例 — 初始化">
                  <Paragraph copyable code style={{ whiteSpace: 'pre-wrap' }}>
                    {`curl -X POST http://${service.domain}${service.path} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'`}
                  </Paragraph>
                </Descriptions.Item>
                <Descriptions.Item label="cURL 示例 — 列出工具">
                  <Paragraph copyable code>
                    {`curl -X POST http://${service.domain}${service.path} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`}
                  </Paragraph>
                </Descriptions.Item>
                {service.auth_enabled && (
                  <Descriptions.Item label="认证头信息">
                    <Paragraph copyable code>
                      -H "X-API-Key: your-api-key"
                    </Paragraph>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          ),
        },
        {
          key: 'tools',
          label: `MCP 工具 (${tools.length})`,
          children: (
            <Card
              extra={
                <Space>
                  <Upload customRequest={handleUpload} showUploadList={false} accept=".json,.yaml,.yml">
                    <Button icon={<UploadOutlined />}>导入 Swagger</Button>
                  </Upload>
                  <Button icon={<PlusOutlined />} type="primary" onClick={() => setToolModal(true)}>
                    添加工具
                  </Button>
                </Space>
              }
            >
              <Table
                dataSource={tools}
                columns={toolColumns}
                rowKey="id"
                pagination={false}
                locale={{ emptyText: '暂无工具。请上传 Swagger 文件或手动添加工具。' }}
              />
            </Card>
          ),
        },
        {
          key: 'test',
          label: '测试',
          icon: <CodeOutlined />,
          children: (
            <Card>
              <Title level={5}>MCP 调试</Title>
              <Paragraph>
                您可以使用 MCP Inspector 或任意 MCP 客户端进行连接测试：
              </Paragraph>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="MCP 端点">
                  <Text copyable>http://{service.domain}{service.path}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="传输协议">
                  <Tag>{service.transport_type === 'sse' ? 'SSE' : '流式 HTTP'}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          ),
        },
      ]} />

      <Modal
        title="添加 MCP 工具"
        open={toolModal}
        onOk={handleAddTool}
        onCancel={() => { setToolModal(false); toolForm.resetFields(); }}
      >
        <Form form={toolForm} layout="vertical">
          <Form.Item name="name" label="工具名称" rules={[{ required: true, message: '请输入工具名称' }]}>
            <Input placeholder="tool_name" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="工具描述" />
          </Form.Item>
          <Form.Item name="http_method" label="HTTP 方法" rules={[{ required: true, message: '请选择 HTTP 方法' }]}>
            <Input placeholder="GET / POST / PUT / DELETE" />
          </Form.Item>
          <Form.Item name="http_path" label="HTTP 路径" rules={[{ required: true, message: '请输入 HTTP 路径' }]}>
            <Input placeholder="/api/v1/resource" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
