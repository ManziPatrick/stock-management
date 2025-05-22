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
    key: 'Dashboard',
    label: <NavLink to='/accountant'>DASHBOARD</NavLink>,
    icon: React.createElement(DashboardOutlined),
  },
  {
    key: 'Manage Cases',
    label: <NavLink to='/accountant/cases'>DASHBOARD CASES</NavLink>,
    icon: React.createElement(AimOutlined),
  },
   {
      key: 'BusinessDocuments',
      label: 'BUSINESS DOCUMENTS',
      icon: <FileTextOutlined />,
      // Use regular string instead of NavLink component to make it clickable for collapse
      children: [
        {
          key: 'proforma',
          label: <NavLink to='/accountant/proforma'>PROFORMA</NavLink>,
          icon: <ProfileFilled />,
        },
        {
          key: 'delivery note',
          label: <NavLink to='/accountant/delivery'>DELIVERY NOTE</NavLink>,
          icon: <AimOutlined />,
        },
      ],
      // Properties to ensure it can collapse even when children are active
      popupClassName: 'business-documents-submenu'
    },
  // {
  //   key: 'New User',
  //   label: <NavLink to='/accountant/register'>NEW USER</NavLink>,
  //   icon: React.createElement(ProfileFilled),
  // },
  {
    
    key: 'Add Product',
    label: <NavLink to='/accountant/create-product'>ADD PRODUCT</NavLink>,
    icon: React.createElement(AntDesignOutlined),
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