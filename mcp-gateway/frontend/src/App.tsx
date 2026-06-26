import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import ServiceList from './pages/ServiceList';
import ServiceForm from './pages/ServiceForm';
import ServiceDetail from './pages/ServiceDetail';
import ConsumerManagement from './pages/ConsumerManagement';

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/services" element={<ServiceList />} />
            <Route path="/services/new" element={<ServiceForm />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/consumers" element={<ConsumerManagement />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
