import { useState, useEffect } from 'react';
import {
  Form, Input, Select, Switch, Button, Card, message, Typography, Space, Divider,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { mcpApi } from '../api';

const { Title } = Typography;

export default function ServiceForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      mcpApi.getService(Number(id)).then(res => {
        form.setFieldsValue(res.data.data);
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await mcpApi.updateService(Number(id), values);
        message.success('更新成功');
      } else {
        await mcpApi.createService(values);
        message.success('创建成功');
      }
      navigate('/services');
    } catch (err: any) {
      message.error(err?.response?.data?.error || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const serviceType = Form.useWatch('service_type', form);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/services')}>返回</Button>
        <Title level={3} style={{ margin: 0 }}>{isEdit ? '编辑' : '创建'} MCP 服务</Title>
      </Space>

      <Card loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            service_type: 'http_to_mcp',
            transport_type: 'streamable_http',
            path: '/mcp',
            status: 'active',
            auth_enabled: false,
          }}
        >
          <Title level={5}>基本信息</Title>
          <Divider />
          <Form.Item name="name" label="服务名称" rules={[{ required: true, message: '请输入服务名称' }]}>
            <Input placeholder="my-mcp-service" />
          </Form.Item>

          <Form.Item name="description" label="描述信息">
            <Input.TextArea rows={3} placeholder="服务描述" />
          </Form.Item>

          <Form.Item name="domain" label="域名" rules={[{ required: true, message: '请输入域名' }]}>
            <Input placeholder="example.com 或使用自动生成" />
          </Form.Item>

          <Form.Item name="path" label="访问路径" rules={[{ required: true, message: '请输入访问路径' }]}>
            <Input placeholder="/mcp" />
          </Form.Item>

          <Space size="large">
            <Form.Item name="service_type" label="服务类型" rules={[{ required: true }]}>
              <Select style={{ width: 200 }}>
                <Select.Option value="http_to_mcp">HTTP 转 MCP</Select.Option>
                <Select.Option value="direct_mcp">直连 MCP</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="transport_type" label="传输协议" rules={[{ required: true }]}>
              <Select style={{ width: 200 }}>
                <Select.Option value="streamable_http">流式 HTTP</Select.Option>
                <Select.Option value="sse">SSE</Select.Option>
              </Select>
            </Form.Item>
          </Space>

          <Title level={5} style={{ marginTop: 24 }}>后端配置</Title>
          <Divider />
          <Form.Item
            name="backend_url"
            label="后端地址"
            rules={[{ required: true, message: '请输入后端地址' }]}
            extra={serviceType === 'http_to_mcp' ? 'HTTP 后端服务的 URL' : 'MCP 服务的 URL'}
          >
            <Input placeholder="http://backend-service:8080" />
          </Form.Item>

          <Title level={5} style={{ marginTop: 24 }}>认证配置</Title>
          <Divider />
          <Form.Item name="auth_enabled" label="启用 API Key 认证" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item hidden name="status">
            <Input />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<SaveOutlined />}
            size="large"
          >
            {isEdit ? '更新' : '创建'}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
