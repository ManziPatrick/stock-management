import { DeleteFilled, EditFilled, FileAddOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { PaginationProps, TableColumnsType } from 'antd';
import { Button, Flex, Modal, Pagination, Table } from 'antd';
import { useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import {
  useDeletePurchaseMutation,
  useGetAllPurchasesQuery,
} from '../../redux/features/management/purchaseApi';
import { IProduct } from '../../types/product.types';
import { IPurchase } from '../../types/purchase.types';
import formatDate from '../../utils/formatDate';
import toastMessage from '../../lib/toastMessage';
import SearchInput from '../../components/SearchInput';
import Typography from 'antd/es/typography/Typography';
import UpdatedProductsTable from './updatedProduct';
import getRole from '../../utils/GetRoles';

const PurchaseManagementPage = () => {
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
  });

  const { data: purchaseResponse, isFetching } = useGetAllPurchasesQuery(query);
  
  const role = getRole();
  console.log('Role:', role);
  
  const isAdminOrSuperAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  
  const totalPurchasedAmount = purchaseResponse?.meta?.totalPurchasedAmount?.stats?.totalPurchasedAmount || 0;

  const onChange: PaginationProps['onChange'] = (page) => {
    setQuery((prev) => ({ ...prev, page: page }));
  };
  
  const [isListView, setIsListView] = useState(false);
  const toggleView = () => {
    setIsListView(!isListView);
  };
  
  const tableData = purchaseResponse?.data?.map((purchase: IPurchase) => ({
    key: purchase._id,
    //@ts-ignore
    sellerName: purchase.seller?.name || purchase.sellerName, // Handle both possible structures
    productName: purchase.productName,
    price: purchase.unitPrice,
    quantity: purchase.quantity,
    totalPrice: purchase.totalPrice,
    date: formatDate(purchase.createdAt),
    // Add flag for zero price to use in row styling
    hasZeroPrice: purchase.unitPrice === 0 || purchase.unitPrice === null || purchase.unitPrice === undefined,
  }));

  // Base columns that are always visible
  const baseColumns: TableColumnsType<any> = [
    {
      title: 'Seller Name',
      key: 'sellerName',
      dataIndex: 'sellerName',
    },
    {
      title: 'Product Name',
      key: 'productName',
      dataIndex: 'productName',
    },
  ];

  // Admin-only columns
  const adminColumns: TableColumnsType<any> = [
    {
      title: 'Price(per unit)',
      key: 'price',
      dataIndex: 'price',
      align: 'center',
      render: (price: number) => (
        <span style={{ 
          color: price === 0 || price === null || price === undefined ? 'red' : 'inherit',
          fontWeight: price === 0 || price === null || price === undefined ? 'bold' : 'normal'
        }}>
          {price === 0 || price === null || price === undefined ? '⚠️ Update Price' : price}
        </span>
      ),
    },
  ];

  // Common columns that come after price columns
  const commonColumns: TableColumnsType<any> = [
    {
      title: 'Quantity',
      key: 'quantity',
      dataIndex: 'quantity',
      align: 'center',
    },
  ];

  // Total price column (admin only)
  const totalPriceColumn: TableColumnsType<any> = [
    {
      title: 'Total Price',
      key: 'totalPrice',
      dataIndex: 'totalPrice',
      align: 'center',
      render: (totalPrice: number, record: any) => (
        <span style={{ 
          color: record.hasZeroPrice ? 'red' : 'inherit',
          fontWeight: record.hasZeroPrice ? 'bold' : 'normal'
        }}>
          {record.hasZeroPrice ? '⚠️ Update Price' : totalPrice}
        </span>
      ),
    },
  ];

  // Date column (always visible)
  const dateColumn: TableColumnsType<any> = [
    {
      title: 'Date',
      key: 'date',
      dataIndex: 'date',
      align: 'center',
    },
  ];

  // Construct columns based on role
  const columns: TableColumnsType<any> = [
    ...baseColumns,
    ...(isAdminOrSuperAdmin ? adminColumns : []),
    ...commonColumns,
    ...(isAdminOrSuperAdmin ? totalPriceColumn : []),
    ...dateColumn,
  ];

  return (
    <div className='p-6 bg-white rounded-lg shadow-md h-[90vh]'>
      {/* <Button 
            onClick={toggleView} 
            type="primary" 
            icon={isListView ? <FileAddOutlined /> : <UnorderedListOutlined  />}
          >
            {isListView ? 'Purchase table':'Updated purchase '}
          </Button> */}
      {isListView ? (
        <UpdatedProductsTable/>
      ) : (
        <div>
          <Flex justify='end' style={{ margin: '5px' }}>
            <SearchInput setQuery={setQuery} placeholder='Search Purchase...' />
          </Flex>
          <Table
            size='small'
            loading={isFetching}
            columns={columns}
            className='rounded-lg border'
            dataSource={tableData}
            pagination={false}
            rowClassName={(record) => {
              // Apply red background only for admin/superAdmin users with zero price
              return isAdminOrSuperAdmin && record.hasZeroPrice ? 'zero-price-row' : '';
            }}
          />

          <Flex justify='center' style={{ marginTop: '1rem' }}>
            <Pagination
              current={query.page}
              onChange={onChange}
              defaultPageSize={query.limit}
              total={purchaseResponse?.meta?.total || 0}
            />
          </Flex>
        </div>
      )}
    </div>
  );
};

const UpdateModal = ({ product }: { product: IProduct }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { handleSubmit } = useForm();

  const onSubmit = (data: FieldValues) => {
    console.log({ data, product });
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        onClick={showModal}
        type='primary'
        className='table-btn-small'
        style={{ backgroundColor: 'green' }}
      >
        <EditFilled />
      </Button>
      <Modal title='Update Product Info' open={isModalOpen} onCancel={handleCancel} footer={null}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <h1>Working on it...!!!</h1>
          <Button htmlType='submit'>Submit</Button>
        </form>
      </Modal>
    </>
  );
};

const DeleteModal = ({ id }: { id: string }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletePurchase] = useDeletePurchaseMutation();

  const handleDelete = async (id: string) => {
    try {
      const res = await deletePurchase(id).unwrap();
      if (res.statusCode === 200) {
        toastMessage({ icon: 'success', text: res.message });
        handleCancel();
      }
    } catch (error: any) {
      handleCancel();
      toastMessage({ icon: 'error', text: error.data.message });
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        onClick={showModal}
        type='primary'
        className='table-btn-small'
        style={{ backgroundColor: 'red' }}
      >
        <DeleteFilled />
      </Button>
      <Modal title='Delete Product' open={isModalOpen} onCancel={handleCancel} footer={null}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Are you want to delete this product?</h2>
          <h4>You won't be able to revert it.</h4>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
            <Button onClick={handleCancel} type='primary' style={{ backgroundColor: 'lightseagreen' }}>
              Cancel
            </Button>
            <Button onClick={() => handleDelete(id)} type='primary' style={{ backgroundColor: 'red' }}>
              Yes! Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PurchaseManagementPage;