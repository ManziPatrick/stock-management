import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button, Layout, Menu } from 'antd';
import { MenuOutlined, LogoutOutlined } from '@ant-design/icons';
import { sidebarItems } from '../../constant/sidebarItemskeeper';
import { useAppDispatch } from '../../redux/hooks';
import { logoutUser } from '../../redux/services/authSlice';

const { Content, Sider } = Layout;

const KeeperSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState(window.innerWidth <= 768);
  const [showLogoutBtn, setShowLogoutBtn] = useState(true);
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
    setShowLogoutBtn(!collapsed);
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
            setShowLogoutBtn(!collapsed);
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
          transform: mobileView && collapsed ? 'translateX(-100%)' : 'translateX(0)'
        }}
      >
        <div className="demo-logo-vertical">
          <h1
            style={{
              color: '#fff',
              padding: '1rem',
              fontSize: '1.8rem',
              textAlign: 'center'
            }}
          >
            WELCOME
          </h1>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          style={{
            backgroundColor: '#164863',
            fontWeight: '700'
          }}
          defaultSelectedKeys={['Dashboard']}
          items={sidebarItems}
        />

        {showLogoutBtn && (
          <div
            style={{
              margin: 'auto',
              position: 'absolute',
              bottom: 0,
              padding: '1rem',
              display: 'flex',
              width: '100%',
              justifyContent: 'center'
            }}
          >
            <Button
              type="primary"
              style={{
                width: '100%',
                backgroundColor: 'cyan',
                color: '#000',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}
              onClick={handleClick}
              icon={<LogoutOutlined />}
            >
              Logout
            </Button>
          </div>
        )}
      </Sider>

      <Layout>
        <Content style={{ padding: '2rem', background: '#BBE1FA' }}>
          <div
            style={{
              padding: '1rem',
              maxHeight: 'calc(100vh - 4rem)',
              minHeight: 'calc(100vh - 4rem)',
              background: '#fff',
              borderRadius: '1rem',
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

export default KeeperSidebar;