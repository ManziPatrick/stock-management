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
    label: <NavLink to='/admin'>DASHBOARD</NavLink>,
    icon: <DashboardOutlined />,
  },
  {
    key: 'Manage Cases',
    label: <NavLink to='/admin/cases'>DASHBOARD CASES</NavLink>,
    icon: <AimOutlined />,
  },
  {
    key: 'BusinessDocuments',
    label: 'BUSINESS DOCUMENTS',
    icon: <FileTextOutlined />,
    children: [
      {
        key: 'proforma',
        label: <NavLink to='/admin/proforma'>PROFORMA</NavLink>,
        icon: <ProfileFilled />,
      },
      {
        key: 'delivery note',
        label: <NavLink to='/admin/delivery'>DELIVERY NOTE</NavLink>,
        icon: <AimOutlined />,
      },
    ]
  },
  {
    key: 'New User',
    label: <NavLink to='/admin/register'>NEW USER</NavLink>,
    icon: <ProfileFilled />,
  },
  {
    key: 'Add Product',
    label: <NavLink to='/admin/create-product'>ADD PRODUCT</NavLink>,
    icon: <AntDesignOutlined />,
  },
  {
    key: 'Manage Products',
    label: <NavLink to='/admin/products'>MANAGE PRODUCTS</NavLink>,
    icon: <MoneyCollectFilled />,
  },
  {
    key: 'Manage Sales',
    label: <NavLink to='/admin/sales'>MANAGE SALES</NavLink>,
    icon: <AreaChartOutlined />,
  },
  {
    key: 'Manage Seller',
    label: <NavLink to='/admin/sellers'>MANAGE SUPPIERS</NavLink>,
    icon: <ApartmentOutlined />,
  },
  {
    key: 'Manage Purchase',
    label: <NavLink to='/admin/purchases'>MANAGE PURCHASES</NavLink>,
    icon: <AimOutlined />,
  },
  {
    key: 'Manage Expenses',
    label: <NavLink to='/admin/expense'>MANAGE EXPENSES</NavLink>,
    icon: <AimOutlined />,
  },
  {
    key: 'Manage report',
    label: <NavLink to='/admin/report'>MANAGE REPORT</NavLink>,
    icon: <AimOutlined />,
  },
  {
    key: 'Manage Debits',
    label: <NavLink to='/admin/debits'>MANAGE DEBIT</NavLink>,
    icon: <AimOutlined />,
  },
  {
    key: 'Profile',
    label: <NavLink to='/admin/profile'>PROFILE</NavLink>,
    icon: <UserOutlined />,
  },
];