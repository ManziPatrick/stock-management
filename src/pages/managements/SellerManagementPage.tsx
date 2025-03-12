
import { DeleteFilled, EditFilled } from '@ant-design/icons';
import type { PaginationProps, TableColumnsType } from 'antd';
import { Button, Flex, Form, Input, Modal, Pagination, Table } from 'antd';
import { useState } from 'react';
import { Controller, FieldValues, useForm } from 'react-hook-form';
import {
  useDeleteSellerMutation,
  useGetAllSellerQuery,
  useUpdateSellerMutation,
} from '../../redux/features/management/sellerApi';
import { IProduct, ISeller } from '../../types/product.types';
import toastMessage from '../../lib/toastMessage';
import SearchInput from '../../components/SearchInput';

const SellerManagementPage = () => {
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
  });

  const { data, isFetching } = useGetAllSellerQuery(query);

  const onChange: PaginationProps['onChange'] = (page) => {
    setQuery((prev) => ({ ...prev, page: page }));
  };

  const tableData = data?.data?.map((seller: ISeller) => ({
    key: seller._id,
    name: seller.name,
    email: seller.email,
    contactNo: seller.contactNo,
  }));

  const columns: TableColumnsType<any> = [
    {
      title: 'suppliers Name',
      key: 'name',
      dataIndex: 'name',
    },
    {
      title: 'Email',
      key: 'email',
      dataIndex: 'email',
      align: 'center',
    },
    {
      title: 'Contact Number',
      key: 'contactNo',
      dataIndex: 'contactNo',
      align: 'center',
    },
    {
      title: 'Action',
      key: 'x',
      align: 'center',
      render: (item) => {
        return (
          <div style={{ display: 'flex' }}>
            <UpdateModal seller={item} />
            <DeleteModal id={item.key} />
          </div>
        );
      },
      width: '1%',
    },
  ];

  return (
    <div className='p-6 bg-white rounded-lg shadow h-[90vh]'>
      <Flex justify='end' style={{ margin: '5px' }}>
        <SearchInput setQuery={setQuery} placeholder='Search Seller...' />
      </Flex>
      <Table
        size='small'
        loading={isFetching}
        columns={columns}
        className='rounded-lg border'
        dataSource={tableData}
        pagination={false}
      />
      <Flex justify='center' style={{ marginTop: '1rem' }}>
        <Pagination
          current={query.page}
          onChange={onChange}
          defaultPageSize={query.limit}
          total={data?.meta?.total}
        />
      </Flex>
    </div>
  );
};

/**
 * Update Modal
 */
const UpdateModal = ({ seller }: { seller: ISeller }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      name: seller.name,
      email: seller.email,
      contactNo: seller.contactNo,
    },
  });
  
  const [updateSeller, { isLoading }] = useUpdateSellerMutation();

  const onSubmit = async (data: FieldValues) => {
    try {
      const res = await updateSeller({
      //@ts-ignore
        id: seller.key,
        updateData: data
      }).unwrap();
      
      if (res.statusCode === 200) {
        toastMessage({ icon: 'success', text: res.message || 'Seller updated successfully' });
        handleCancel();
      }
    } catch (error: any) {
      toastMessage({ icon: 'error', text: error.data?.message || 'Failed to update seller' });
    }
  };

  const showModal = () => {
    // Reset form with current seller data
    reset({
      name: seller.name,
      email: seller.email,
      contactNo: seller.contactNo,
    });
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
        style={{ backgroundColor: 'green', marginRight: '8px' }}
      >
        <EditFilled />
      </Button>
      <Modal title='Update Seller Info' open={isModalOpen} onCancel={handleCancel} footer={null}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: '16px' }}>
            <label>Name</label>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Name is required' }}
              render={({ field, fieldState }) => (
                <Input 
                  {...field} 
                  placeholder="Enter seller name" 
                  status={fieldState.error ? 'error' : undefined}
                />
              )}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label>Email</label>
            <Controller
              name="email"
              control={control}
              rules={{ 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              }}
              render={({ field, fieldState }) => (
                <Input 
                  {...field} 
                  placeholder="Enter email address" 
                  type="email"
                  status={fieldState.error ? 'error' : undefined}
                />
              )}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label>Contact Number</label>
            <Controller
              name="contactNo"
              control={control}
              rules={{ required: 'Contact number is required' }}
              render={({ field, fieldState }) => (
                <Input 
                  {...field} 
                  placeholder="Enter contact number" 
                  status={fieldState.error ? 'error' : undefined}
                />
              )}
            />
          </div>
          
          <Flex justify="end" gap="small">
            <Button onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Update Seller
            </Button>
          </Flex>
        </form>
      </Modal>
    </>
  );
};

/**
 * Delete Modal
 */
const DeleteModal = ({ id }: { id: string }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteSeller] = useDeleteSellerMutation();

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteSeller(id).unwrap();
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
      <Modal title='Delete Seller' open={isModalOpen} onCancel={handleCancel} footer={null}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Are you want to delete this seller?</h2>
          <h4>You won't be able to revert it.</h4>
          <div
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}
          >
            <Button
              onClick={handleCancel}
              type='primary'
              style={{ backgroundColor: 'lightseagreen' }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleDelete(id)}
              type='primary'
              style={{ backgroundColor: 'red' }}
            >
              Yes! Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SellerManagementPage;