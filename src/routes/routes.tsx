import { createBrowserRouter } from 'react-router-dom';
import ProtectRoute from '../components/layout/ProtectRoute';
import Sidebar from '../components/layout/Sidebar';
import CreateProduct from '../pages/CreateProduct';
import Dashboard from '../pages/Dashboard';
import NotFound from '../pages/NotFound';
import ProfilePage from '../pages/ProfilePage';
import SaleHistoryPage from '../pages/SaleHistoryPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ProductManagePage from '../pages/managements/ProductManagePage';
import PurchaseManagementPage from '../pages/managements/PurchaseManagementPage';
import SaleManagementPage from '../pages/managements/SaleManagementPage';
import SellerManagementPage from '../pages/managements/SellerManagementPage';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import EditProfilePage from '../pages/EditProfilePage';
import AdminSidebar from '../components/layout/AdminSidebar';
import KeeperSidebar  from '../components/layout/KeeperSidebar';
import UserManagementPage from '../pages/managements/UserManagement';
import ProductManagePageuser from '../pages/managements/productManagepageUser';
import GetExpensesManagePage from '../pages/managements/getexpenseManagePage';
import ExpensesManagePage from '../pages/managements/expensesManagePage';
import ProductManagePageKeeper from '../pages/managements/productManagePageKeeper';
import SaleManagementPageKepper from '../pages/managements/SaleManagementPageKeeper';
export const router = createBrowserRouter([
  {
    path: '/seller',
    element: <Sidebar />,
    children: [
      // {
      //   path: '',
      //   element: (
      //     <ProtectRoute>
      //       <Dashboard />
      //     </ProtectRoute>
      //   ),
      // },
      // {
      //   path: 'create-product',
      //   element: (
      //     <ProtectRoute>
      //       <CreateProduct />
      //     </ProtectRoute>
      //   ),
      // },
      {
        path: 'profile',
        element: (
          <ProtectRoute>
            <ProfilePage />
          </ProtectRoute>
        ),
      },
      {
        path: 'products',
        element: (
          <ProtectRoute>
            <ProductManagePageuser />
          </ProtectRoute>
        ),
      },
      {
        path: 'sales',
        element: (
          <ProtectRoute>
            <SaleManagementPage />
          </ProtectRoute>
        ),
      },
      { 
        path: 'register', 
        element: (
          <ProtectRoute>
            <RegisterPage />
          </ProtectRoute>
        ),
      },
      {
        path: 'purchases',
        element: (
          <ProtectRoute>
            <PurchaseManagementPage />
          </ProtectRoute>
        ),
      },
      {
        path: 'edit-profile',
        element: (
          <ProtectRoute>
            <EditProfilePage />
          </ProtectRoute>
        ),
      },
      {
        path: 'change-password',
        element: (
          <ProtectRoute>
            <ChangePasswordPage />
          </ProtectRoute>
        ),
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminSidebar />,
    children: [
      {
        path: '',  // This will be /admin
        element: (
          <ProtectRoute>
            <Dashboard />
          </ProtectRoute>
        ),
      },
      {
        path: 'dashboard',  
        element: (
          <ProtectRoute>
            <Dashboard />
          </ProtectRoute>
        ),
      },
      {
        path: 'create-expense',  
        element: (
          <ProtectRoute>
            <ExpensesManagePage />
          </ProtectRoute>
        ),
      },
   
      {
        path: 'create-product',  // This will be /admin/create-product
        element: (
          <ProtectRoute>
            <CreateProduct />
          </ProtectRoute>
        ),
      },
      {
        path: 'expense',  
        element: (
          <ProtectRoute>
            <GetExpensesManagePage />
          </ProtectRoute>
        ),
      },
      {
        path: 'profile',  // This will be /admin/profile
        element: (
          <ProtectRoute>
            <ProfilePage />
          </ProtectRoute>
        ),
      },
      {
        path: 'products',  // This will be /admin/products
        element: (
          <ProtectRoute>
            <ProductManagePage />
          </ProtectRoute>
        ),
      },
      {
        path: 'sales',  // This will be /admin/sales
        element: (
          <ProtectRoute>
            <SaleManagementPage />
          </ProtectRoute>
        ),
      },
      {
        path: 'sellers',  // This will be /admin/sellers
        element: (
          <ProtectRoute>
            <SellerManagementPage />
          </ProtectRoute>
        ),
      },
      { 
        path: 'register',  // This will be /admin/register
        element: (
          <ProtectRoute>
            <RegisterPage />
          </ProtectRoute>
        ),
      },
      {
        path: 'purchases',  // This will be /admin/purchases
        element: (
          <ProtectRoute>
            <PurchaseManagementPage />
          </ProtectRoute>
        ),
      },
      {
        path: 'sales-history',  // This will be /admin/sales-history
        element: (
          <ProtectRoute>
            <SaleHistoryPage />
          </ProtectRoute>
        ),
      },
      {
        path: 'edit-profile',  // This will be /admin/edit-profile
        element: (
          <ProtectRoute>
            <EditProfilePage />
          </ProtectRoute>
        ),
      },
      {
        path: 'change-password',  // This will be /admin/change-password
        element: (
          <ProtectRoute>
            <ChangePasswordPage />
          </ProtectRoute>
        ),
      },
      {
        path: 'users', 
        element: (
          <ProtectRoute>
            <UserManagementPage />
          </ProtectRoute>
        ),
      },
      
    ],
  },
  {
    path: '/keeper',
    element: <KeeperSidebar />,
    children: [
      {
        path: '',
        element: (
          <ProtectRoute>
            <Dashboard />
          </ProtectRoute>
        ),
      },
    
   
      {
        path: 'products',
        element: (
          <ProtectRoute>
            <ProductManagePageKeeper />
          </ProtectRoute>
        ),
      },
     
      {
        path: 'purchases',
        element: (
          <ProtectRoute>
            <PurchaseManagementPage />
          </ProtectRoute>
        ),
      },
      {
        path: 'sales',  // This will be /admin/sales
        element: (
          <ProtectRoute>
            <SaleManagementPageKepper />
          </ProtectRoute>
        ),
      },
      {
        path: 'sales-history',
        element: (
          <ProtectRoute>
            <SaleHistoryPage />
          </ProtectRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectRoute>
            <ProfilePage />
          </ProtectRoute>
        ),
      },
      {
        path: 'edit-profile',
        element: (
          <ProtectRoute>
            <EditProfilePage />
          </ProtectRoute>
        ),
      },
      {
        path: 'change-password',
        element: (
          <ProtectRoute>
            <ChangePasswordPage />
          </ProtectRoute>
        ),
      },
    ],
  },
  { path: '/', element: <LoginPage /> },
  { path: '*', element: <NotFound /> },
]);