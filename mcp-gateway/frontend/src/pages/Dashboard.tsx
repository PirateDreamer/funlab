import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Table, Tag } from 'antd';
import { ApiOutlined, ToolOutlined, TeamOutlined, KeyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { mcpApi } from '../api';
import type { MCPService } from '../api';

const { Title } = Typography;

export default function Dashboard() {
  const [services, setServices] = useState<MCPService[]>([]);
  const [stats, setStats] = useState({ services: 0, httpToMcp: 0, directMcp: 0, authEnabled: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    mcpApi.listServices().then(res => {
      const list = res.data.data;
      setServices(list);
      setStats({
        services: list.length,
        httpToMcp: list.filter(s => s.service_type === 'http_to_mcp').length,
        directMcp: list.filter(s => s.service_type === 'direct_mcp').length,
        authEnabled: list.filter(s => s.auth_enabled).length,
      });
    });
  }, []);

  const recentColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'service_type', key: 'service_type', render: (t: string) => <Tag>{t === 'http_to_mcp' ? 'HTTP 转 MCP' : '直连 MCP'}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '活跃' : '停用'}</Tag> },
  ];

  return (
    <div>
      <Title level={3}>MCP 网关控制台</Title>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/services')}>
            <Statistic title="服务总数" value={stats.services} prefix={<ApiOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="HTTP 转 MCP" value={stats.httpToMcp} prefix={<ToolOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="直连 MCP" value={stats.directMcp} prefix={<TeamOutlined />} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已启用认证" value={stats.authEnabled} prefix={<KeyOutlined />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
      </Row>

      <Card title="最近服务" style={{ marginTop: 16 }}>
        <Table
          dataSource={services.slice(0, 5)}
          columns={recentColumns}
          rowKey="id"
          pagination={false}
          onRow={record => ({
            onClick: () => navigate(`/services/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  );
}
