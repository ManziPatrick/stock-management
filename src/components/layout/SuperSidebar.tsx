import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button, Layout, Menu } from 'antd';
import { MenuOutlined, LogoutOutlined } from '@ant-design/icons';
import { sidebarItems } from '../../constant/SidebarSuper';
import { useAppDispatch } from '../../redux/hooks';
import { logoutUser } from '../../redux/services/authSlice';
import log from '../../assets/Marube_log.png';

const { Content, Sider } = Layout;

const SuperAdminSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState(window.innerWidth <= 768);
  const [openKeys, setOpenKeys] = useState([]);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Get the active key based on the current path
  const getActiveKey = () => {
    const path = location.pathname;
    
    // Handle root admin path
    if (path === '/superadmin') {
      return 'Dashboard';
    }
    
    // For other paths, first check top-level items
    const matchingItem = sidebarItems.find(item => {
      // Handle items with direct NavLink
      //@ts-ignore
      if (item.label?.props?.to) {
        //@ts-ignore
        return path === item.label.props.to;
      }
      return false;
    });
    
    if (matchingItem) {
      return matchingItem.key;
    }
    
    // If no top-level match, check for children
    const itemWithMatchingChild = sidebarItems.find(item => {
      if (!item.children) return false;
      
      return item.children.some(child => {
        return child.label?.props?.to === path;
      });
    });
    
    // If we found a parent with matching child
    if (itemWithMatchingChild) {
      // Find the actual child for its key
      const matchingChild = itemWithMatchingChild.children.find(
        child => child.label?.props?.to === path
      );
      
      // REMOVED the automatic opening of parent menu
      // This was causing the issue with not being able to collapse
      
      return matchingChild ? matchingChild.key : 'Dashboard';
    }
    
    return 'Dashboard'; // Default
  };

  // Set initial openKeys on component mount
  useEffect(() => {
    const path = location.pathname;
    
    // Check if current path matches any child route
    sidebarItems.forEach(item => {
      if (item.children) {
        const hasMatchingChild = item.children.some(child => 
          child.label?.props?.to === path
        );
        
        if (hasMatchingChild && !openKeys.includes(item.key)) {
          setOpenKeys([item.key]);
        }
      }
    });
  }, []); // Only run once on mount

  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setCollapsed(false);
      }
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

  const handleOpenChange = (keys) => {
    setOpenKeys(keys);
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
        onCollapse={(value, type) => {
          if (type === 'responsive') {
            setCollapsed(value);
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
          overflow: 'auto'
        }}
      >
        <div className="demo-logo-vertical ml-8 md:ml-0 flex items-center p-4 space-x-2 md:relative">
          <img src={log} className="w-[28px] h-[28px]" alt="Logo" />
          {!collapsed && !mobileView && (
            <h1 className="text-white font-extrabold text-[1.2rem]">
              MARUBE
            </h1>
          )}
        </div>

        <div style={{ height: 'calc(100vh - 120px)', overflowY: 'auto', paddingBottom: '60px' }}>
          <Menu
            theme="dark"
            mode="inline"
            style={{
              backgroundColor: '#164863',
              fontWeight: '700',
            }}
            selectedKeys={[getActiveKey()]}
            openKeys={openKeys}
            onOpenChange={handleOpenChange}
            items={sidebarItems}
          />
        </div>

        <div
          style={{
            position: 'fixed',
            bottom: 10,
            left: collapsed ? (mobileView ? -100 : 10) : 10,
            width: collapsed ? (mobileView ? 0 : 60) : 180,
            zIndex: 1000,
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <Button
            type="primary"
            style={{
              width: '100%',
              backgroundColor: 'cyan',
              color: '#000',
              fontWeight: 600,
              textTransform: 'uppercase',
              borderRadius: 10,
              height: '32px',
            }}
            onClick={handleClick}
            icon={<LogoutOutlined />}
            className='rounded-md'
          >
            {!collapsed && 'Logout'}
          </Button>
        </div>
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

export default SuperAdminSidebar;