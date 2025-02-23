import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button, Layout, Menu } from 'antd';
import { MenuOutlined, LogoutOutlined } from '@ant-design/icons';
import { sidebarItems } from '../../constant/sidebarItemsAdmin';
import { useAppDispatch } from '../../redux/hooks';
import { logoutUser } from '../../redux/services/authSlice';
import log from '../../../public/color-spectrum-1192509_1280.png';

const { Content, Sider } = Layout;

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState(window.innerWidth <= 768);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClick = () => {
    dispatch(logoutUser());
    navigate('/');
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {mobileView && (
        <Button
          type="primary"
          onClick={toggleCollapsed}
          style={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            zIndex: 1001,
            backgroundColor: '#164863'
          }}
          icon={<MenuOutlined />}
        />
      )}
      <Sider
        breakpoint="lg"
        collapsedWidth={mobileView ? 0 : 80}
        collapsed={collapsed}
        onCollapse={(collapsed, type) => {
          if (type === 'responsive') {
            setCollapsed(collapsed);
          }
        }}
        width={220}
        style={{
          backgroundColor: '#164863',
          position: mobileView ? 'fixed' : 'relative',
          height: '100vh',
          zIndex: 1000,
          left: 0,
          top: 0,
          transition: 'all 0.2s ease-in-out',
          transform: mobileView && collapsed ? 'translateX(-100%)' : 'translateX(0)',
        }}
      >
        <div className="demo-logo-vertical ml-8 md:ml-0 flex items-center p-4 space-x-2 md:relative">
          <img src={log} className="w-[28px] h-[28px]" alt="Logo" />
          {!collapsed && !mobileView && (
            <h1 className="text-white font-extrabold text-[1.2rem]">
              STOCKXI
            </h1>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          style={{
            backgroundColor: '#164863',
            fontWeight: '700',
            paddingBottom: '64px',
          }}
          defaultSelectedKeys={['Dashboard']}
          items={sidebarItems}
        />

        <Button
          type="primary"
          style={{
            width: '80%',
            backgroundColor: 'cyan',
            color: '#000',
            fontWeight: 600,
            textTransform: 'uppercase',
            position: 'absolute',
            
            bottom: 10,
            left: 10,
            borderRadius: 10,
            height: '32px',
          }}
          onClick={handleClick}
          icon={<LogoutOutlined />}
          className=' rounded-md'
        >
          {!collapsed && 'Logout'}
        </Button>
      </Sider>

      <Layout>
        <Content 
          style={{
            backgroundColor: 'white'
          }}
        >
          <div
            style={{
              padding: '1rem',
              maxHeight: 'calc(100vh - 2rem)',
              minHeight: 'calc(100vh - 16rem)',
              background: '#fff',
              overflow: 'auto'
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminSidebar;