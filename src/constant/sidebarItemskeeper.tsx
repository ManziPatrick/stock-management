import {
    AimOutlined,
    AntDesignOutlined,
    ApartmentOutlined,
    AreaChartOutlined,
    MoneyCollectFilled,
    ProfileFilled,
    UserOutlined,
  } from '@ant-design/icons';
  import React from 'react';
  import { NavLink } from 'react-router-dom';
  
  export const sidebarItems = [
 
   
   
    {
      key: 'Manage Products',
      label: <NavLink to='/keeper/products'>REMAINING STOCK</NavLink>,
      icon: React.createElement(MoneyCollectFilled),
    },

    {
      key: 'Manage Sales',
      label: <NavLink to='/keeper/sales'>STOCK OUT</NavLink>,
      icon: React.createElement(AreaChartOutlined),
    },
    {
      key: 'Manage Stock',
      label: <NavLink to='/keeper/purchases'>STOCK IN</NavLink>,
      icon: React.createElement(AreaChartOutlined),
    },
  
    {
      key: 'Profile',
      label: <NavLink to='/keeper/profile'>PROFILE</NavLink>,
      icon: React.createElement(UserOutlined),
    },
  ];