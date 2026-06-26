import { useState, useEffect } from 'react';
import {
  Table, Card, Button, Space, Typography, Modal, Form, Input, message, Popconfirm, Tag,
} from 'antd';
import { PlusOutlined, DeleteOutlined, KeyOutlined, CopyOutlined } from '@ant-design/icons';
import { mcpApi } from '../api';
import type { Consumer, APIKey } from '../api';

const { Title, Text } = Typography;

export default function ConsumerManagement() {
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [consumerModal, setConsumerModal] = useState(false);
  const [consumerForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, kRes] = await Promise.all([mcpApi.listConsumers(), mcpApi.listAPIKeys()]);
      setConsumers(cRes.data.data);
      setApiKeys(kRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateConsumer = async () => {
    const values = await consumerForm.validateFields();
    await mcpApi.createConsumer(values);
    message.success('消费者创建成功');
    setConsumerModal(false);
    consumerForm.resetFields();
    fetchData();
  };

  const handleDeleteConsumer = async (id: number) => {
    await mcpApi.deleteConsumer(id);
    message.success('已删除');
    fetchData();
  };

  const handleCreateKey = async (consumerId: number) => {
    const res = await mcpApi.createAPIKey(consumerId);
    message.success('API 密钥生成成功');
    fetchData();
    Modal.success({
      title: 'API 密钥',
      content: (
        <div>
          <Text>请妥善保存此密钥，关闭后将不再显示：</Text>
          <div style={{ margin: '12px 0', padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
            <Text copyable strong style={{ fontSize: 14 }}>{res.data.data.key}</Text>
          </div>
        </div>
      ),
    });
  };

  const handleDeleteKey = async (id: number) => {
    await mcpApi.deleteAPIKey(id);
    message.success('API 密钥已删除');
    fetchData();
  };

  const consumerColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '活跃' : '停用'}</Tag>,
    },
    {
      title: '操作', key: 'actions',
      render: (_: any, record: Consumer) => (
        <Space>
          <Button size="small" icon={<KeyOutlined />} onClick={() => handleCreateKey(record.id)}>
            生成密钥
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDeleteConsumer(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const keyColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    {
      title: '所属消费者', dataIndex: 'consumer', key: 'consumer',
      render: (c: Consumer) => c?.name || '-',
    },
    {
      title: 'API 密钥', dataIndex: 'key', key: 'key', ellipsis: true,
      render: (k: string) => <Text copyable={{ icon: <CopyOutlined /> }} code>{k}</Text>,
    },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag>{s === 'active' ? '活跃' : '停用'}</Tag> },
    {
      title: '操作', key: 'actions',
      render: (_: any, record: APIKey) => (
        <Popconfirm title="确认删除此密钥？" onConfirm={() => handleDeleteKey(record.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>消费者 & API 密钥管理</Title>

      <Card title="消费者" extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setConsumerModal(true)}>
          添加消费者
        </Button>
      } style={{ marginBottom: 16 }}>
        <Table dataSource={consumers} columns={consumerColumns} rowKey="id" loading={loading} pagination={false} />
      </Card>

      <Card title="API 密钥">
        <Table dataSource={apiKeys} columns={keyColumns} rowKey="id" loading={loading} pagination={false} />
      </Card>

      <Modal
        title="创建消费者"
        open={consumerModal}
        onOk={handleCreateConsumer}
        onCancel={() => { setConsumerModal(false); consumerForm.resetFields(); }}
      >
        <Form form={consumerForm} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入消费者名称' }]}>
            <Input placeholder="消费者名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
