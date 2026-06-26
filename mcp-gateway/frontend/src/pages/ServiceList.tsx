import { useState, useEffect } from 'react';
import {
  Table, Button, Card, Space, Tag, Modal, message, Popconfirm, Typography, Descriptions, Tooltip,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, InfoCircleOutlined, ApiOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { mcpApi } from '../api';
import type { MCPService } from '../api';

const { Title, Text, Paragraph } = Typography;

export default function ServiceList() {
  const [services, setServices] = useState<MCPService[]>([]);
  const [loading, setLoading] = useState(false);
  const [accessModal, setAccessModal] = useState<{ visible: boolean; data: any; name: string }>({
    visible: false, data: null, name: '',
  });
  const navigate = useNavigate();

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await mcpApi.listServices();
      setServices(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const handleDelete = async (id: number) => {
    await mcpApi.deleteService(id);
    message.success('已删除');
    fetchServices();
  };

  const handleAccess = async (id: number, name: string) => {
    try {
      const res = await mcpApi.getServiceAccess(id);
      setAccessModal({ visible: true, data: res.data.data, name });
    } catch {
      message.error('获取访问信息失败');
    }
  };

  const typeTag = (t: string) => {
    const colors: Record<string, string> = {
      http_to_mcp: 'blue',
      direct_mcp: 'green',
    };
    const labels: Record<string, string> = {
      http_to_mcp: 'HTTP → MCP',
      direct_mcp: '直连 MCP',
    };
    return <Tag color={colors[t]}>{labels[t] || t}</Tag>;
  };

  const columns = [
    {
      title: '名称', dataIndex: 'name', key: 'name',
      render: (name: string, record: MCPService) => (
        <a onClick={() => navigate(`/services/${record.id}`)}>
          <ApiOutlined style={{ marginRight: 6 }} />{name}
        </a>
      ),
    },
    { title: '域名', dataIndex: 'domain', key: 'domain', ellipsis: true },
    { title: '路径', dataIndex: 'path', key: 'path' },
    { title: '类型', dataIndex: 'service_type', key: 'service_type', render: typeTag },
    {
      title: '传输协议', dataIndex: 'transport_type', key: 'transport_type',
      render: (t: string) => <Tag>{t === 'streamable_http' ? '流式 HTTP' : 'SSE'}</Tag>,
    },
    {
      title: '认证', dataIndex: 'auth_enabled', key: 'auth_enabled',
      render: (v: boolean) => v ? <Tag color="orange">已启用</Tag> : <Tag>已禁用</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: string) => {
        const color = s === 'active' ? 'green' : s === 'inactive' ? 'red' : 'default';
        return <Tag color={color}>{s === 'active' ? '活跃' : '停用'}</Tag>;
      },
    },
    {
      title: '操作', key: 'actions',
      render: (_: any, record: MCPService) => (
        <Space>
          <Tooltip title="查看访问信息">
            <Button size="small" icon={<InfoCircleOutlined />} onClick={() => handleAccess(record.id, record.name)} />
          </Tooltip>
          <Popconfirm title="确认删除此服务？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3}>MCP 服务</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/services/new')}>
          创建 MCP 服务
        </Button>
      </div>

      <Card>
        <Table
          dataSource={services}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={`访问信息 - ${accessModal.name}`}
        open={accessModal.visible}
        onCancel={() => setAccessModal({ visible: false, data: null, name: '' })}
        footer={null}
        width={640}
      >
        {accessModal.data && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="访问地址">
              <Text copyable>{accessModal.data.access_url}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="域名">{accessModal.data.domain}</Descriptions.Item>
            <Descriptions.Item label="路径">{accessModal.data.path}</Descriptions.Item>
            <Descriptions.Item label="服务类型">
              {typeTag(accessModal.data.service_type)}
            </Descriptions.Item>
            <Descriptions.Item label="传输协议">
              <Tag>{accessModal.data.transport === 'streamable_http' ? '流式 HTTP' : 'SSE'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="cURL 示例">
              <Paragraph copyable code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {accessModal.data.curl_example}
              </Paragraph>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
