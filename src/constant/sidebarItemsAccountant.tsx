import {
  AimOutlined,
  AntDesignOutlined,
  ApartmentOutlined,
  DashboardOutlined,
  AreaChartOutlined,
  MoneyCollectFilled,
  ProfileFilled,
  UserOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import React from 'react';
import { NavLink } from 'react-router-dom';

export const sidebarItems = [
 
  {
    key: 'Manage Cases',
    label: <NavLink to='/accountant/cases'>DASHBOARD CASES</NavLink>,
    icon: React.createElement(AimOutlined),
  },
   
  
 

    {
      key: 'Manage Products',
      label: <NavLink to='/accountant/products'>MANAGE PRODUCTS</NavLink>,
      icon: <MoneyCollectFilled />,
    },
  {
    key: 'Manage Pettycash',
    label: <NavLink to='/accountant/pettycash'>MANAGE PETTYCASH</NavLink>,
    icon: React.createElement(MoneyCollectFilled),
  },
  {
      key: 'Manage Seller',
      label: <NavLink to='/accountant/sellers'>MANAGE SUPPIERS</NavLink>,
      icon: <ApartmentOutlined />,
    },
  {
    key: 'Manage Sales',
    label: <NavLink to='/accountant/sales'>MANAGE SALES</NavLink>,
    icon: React.createElement(AreaChartOutlined),
  },
  // {
  //   key: 'Manage Seller',
  //   label: <NavLink to='/accountant/sellers'>MANAGE SUPPIERS</NavLink>,
  //   icon: React.createElement(ApartmentOutlined),
  // },
  {
    key: 'Manage Purchase',
    label: <NavLink to='/accountant/purchases'>MANAGE PURCHASES</NavLink>,
    icon: React.createElement(AimOutlined),
  },
  {
    key: 'Manage Expenses',
    label: <NavLink to='/accountant/expense'>MANAGE EXPENSES</NavLink>,
    icon: React.createElement(AimOutlined),
  },
  {
    key: 'Manage report',
    label: <NavLink to='/accountant/accreport'>MANAGE REPORT</NavLink>,
    icon: React.createElement(AimOutlined),
  },
  
  {
    key: 'Manage Debits',
    label: <NavLink to='/accountant/debits'>MANAGE DEBIT</NavLink>,
    icon: React.createElement(AimOutlined),
  },
  // {report
  //   key: 'users',
  //   label: <NavLink to='/accountant/users'>ALL USERS</NavLink>,
  //   icon: React.createElement(AimOutlined),
  // },

  {
    key: 'Profile',
    label: <NavLink to='/accountant/profile'>PROFILE</NavLink>,
    icon: React.createElement(UserOutlined),
  },
  
];