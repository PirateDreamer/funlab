import axios from 'axios';

const API_BASE = 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export interface MCPService {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  domain: string;
  path: string;
  service_type: 'http_to_mcp' | 'direct_mcp';
  transport_type: 'streamable_http' | 'sse';
  backend_url: string;
  description: string;
  auth_enabled: boolean;
  status: string;
}

export interface MCPTool {
  id: number;
  service_id: number;
  name: string;
  description: string;
  schema: string;
  http_method: string;
  http_path: string;
  created_at: string;
}

export interface Consumer {
  id: number;
  name: string;
  status: string;
  created_at: string;
}

export interface APIKey {
  id: number;
  consumer_id: number;
  key: string;
  status: string;
  consumer?: Consumer;
  created_at: string;
}

export const mcpApi = {
  listServices: () => api.get<{ data: MCPService[] }>('/mcp-services'),
  getService: (id: number) => api.get<{ data: MCPService }>(`/mcp-services/${id}`),
  createService: (data: Partial<MCPService>) => api.post<{ data: MCPService }>('/mcp-services', data),
  updateService: (id: number, data: Partial<MCPService>) => api.put<{ data: MCPService }>(`/mcp-services/${id}`, data),
  deleteService: (id: number) => api.delete(`/mcp-services/${id}`),
  getServiceAccess: (id: number) => api.get(`/mcp-services/${id}/access`),
  listTools: (serviceId: number) => api.get<{ data: MCPTool[] }>(`/mcp-services/${serviceId}/tools`),
  uploadTools: (serviceId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ data: MCPTool[]; message: string }>(`/mcp-services/${serviceId}/tools/upload`, form);
  },
  createTool: (serviceId: number, data: Partial<MCPTool>) =>
    api.post<{ data: MCPTool }>(`/mcp-services/${serviceId}/tools`, data),
  deleteTool: (serviceId: number, toolId: number) =>
    api.delete(`/mcp-services/${serviceId}/tools/${toolId}`),
  listConsumers: () => api.get<{ data: Consumer[] }>('/consumers'),
  createConsumer: (data: Partial<Consumer>) => api.post<{ data: Consumer }>('/consumers', data),
  deleteConsumer: (id: number) => api.delete(`/consumers/${id}`),
  listAPIKeys: () => api.get<{ data: APIKey[] }>('/api-keys'),
  createAPIKey: (consumerId: number) =>
    api.post<{ data: APIKey }>('/api-keys', { consumer_id: consumerId }),
  deleteAPIKey: (id: number) => api.delete(`/api-keys/${id}`),
};
