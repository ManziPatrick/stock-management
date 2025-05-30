//@ts-nocheck
import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button, Layout, Menu } from 'antd';
import { MenuOutlined, LogoutOutlined } from '@ant-design/icons';
import { sidebarItems } from '../../constant/sidebarItemsAccountant';
import { useAppDispatch } from '../../redux/hooks';
import { logoutUser } from '../../redux/services/authSlice';
import log from '../../assets/Marube_log.png';

const { Content, Sider } = Layout;

const AccountantDashboard = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);
  const [mobileView, setMobileView] = useState(window.innerWidth <= 768);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  // Get the active key based on the current path
  const getActiveKey = () => {
     const path = location.pathname;
     
     if (path === '/accountant') {
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
        
     });
     
     // If we found a parent with matching child
     if (itemWithMatchingChild) {
       // Find the actual child for its key
       const matchingChild = itemWithMatchingChild.children.find(
         child => child.label?.props?.to === path
       );
       
       return matchingChild ? matchingChild.key : 'Dashboard';
     }
     
     return 'Dashboard'; // Default
   };

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
    }, []); 

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

export default AccountantDashboard;