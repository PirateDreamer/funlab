import { useState } from 'react';
import { Layout, Menu, Typography, theme } from 'antd';
import {
  DashboardOutlined, ApiOutlined, KeyOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '控制台' },
  { key: '/services', icon: <ApiOutlined />, label: 'MCP 服务' },
  { key: '/consumers', icon: <KeyOutlined />, label: '认证 & 消费者' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  const selectedKey = '/' + location.pathname.split('/').filter(Boolean)[0] || '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{ background: colorBgContainer }}
      >
        <div style={{
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <Title level={4} style={{ margin: 0, color: '#1677ff' }}>
            {collapsed ? 'M' : 'MCP 网关'}
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>MCP 网关</Title>
        </Header>
        <Content style={{ margin: 24 }}>
          <div style={{ padding: 24, background: colorBgContainer, borderRadius: borderRadiusLG }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
