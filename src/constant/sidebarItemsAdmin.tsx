import {
  AimOutlined,
  AntDesignOutlined,
  ApartmentOutlined,
  DashboardOutlined,
  AreaChartOutlined,
  MoneyCollectFilled,
  ProfileFilled,
  UserOutlined,
} from '@ant-design/icons';
import React from 'react';
import { NavLink } from 'react-router-dom';

export const sidebarItems = [
  {
    key: 'Dashboard',
    label: <NavLink to='/admin'>DASHBOARD</NavLink>,
    icon: React.createElement(DashboardOutlined),
  },
  {
    key: 'Manage Cases',
    label: <NavLink to='/admin/cases'>DASHBOARD CASES</NavLink>,
    icon: React.createElement(AimOutlined),
  },
  {
    key: 'proforma',
    label: <NavLink to='/admin/proforma'>PROFORMA</NavLink>,
    icon: React.createElement(ProfileFilled),
  },
  {
    key: 'New User',
    label: <NavLink to='/admin/register'>NEW USER</NavLink>,
    icon: React.createElement(ProfileFilled),
  },
  {
    
    key: 'Add Product',
    label: <NavLink to='/admin/create-product'>ADD PRODUCT</NavLink>,
    icon: React.createElement(AntDesignOutlined),
  },

  {
    key: 'Manage Products',
    label: <NavLink to='/admin/products'>MANAGE PRODUCTS</NavLink>,
    icon: React.createElement(MoneyCollectFilled),
  },
  {
    key: 'Manage Sales',
    label: <NavLink to='/admin/sales'>MANAGE SALES</NavLink>,
    icon: React.createElement(AreaChartOutlined),
  },
  {
    key: 'Manage Seller',
    label: <NavLink to='/admin/sellers'>MANAGE SUPPIERS</NavLink>,
    icon: React.createElement(ApartmentOutlined),
  },
  {
    key: 'Manage Purchase',
    label: <NavLink to='/admin/purchases'>MANAGE PURCHASES</NavLink>,
    icon: React.createElement(AimOutlined),
  },
  {
    key: 'Manage Expenses',
    label: <NavLink to='/admin/expense'>MANAGE EXPENSES</NavLink>,
    icon: React.createElement(AimOutlined),
  },
  
  {
    key: 'Manage Debits',
    label: <NavLink to='/admin/debits'>MANAGE DEBIT</NavLink>,
    icon: React.createElement(AimOutlined),
  },
  // {
  //   key: 'users',
  //   label: <NavLink to='/admin/users'>ALL USERS</NavLink>,
  //   icon: React.createElement(AimOutlined),
  // },

  {
    key: 'Profile',
    label: <NavLink to='/admin/profile'>PROFILE</NavLink>,
    icon: React.createElement(UserOutlined),
  },
  
];