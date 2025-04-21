// @ts-nocheck

import { DeleteFilled, EditFilled, KeyOutlined } from '@ant-design/icons';
import type { PaginationProps, TableColumnsType } from 'antd';
import { 
  Button, 
  Flex, 
  Modal, 
  Pagination, 
  Table, 
  Tag, 
  Form, 
  Input, 
  Select, 
  Tabs, 
  Divider,
  message 
} from 'antd';
import { useState } from 'react';
import {
  useGetAllUserQuery,
  useDeleteUserMutation,
  useAdminUpdateUserMutation,
  useAdminUpdatePasswordMutation,
  useUpdateUserRoleMutation
} from '../../redux/features/authApi';
import { IUser } from '../../types/product.types';
import toastMessage from '../../lib/toastMessage';
import SearchInput from '../../components/SearchInput';

const { TabPane } = Tabs;
const { Option } = Select;

const UserManagementPage = () => {
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
  });

  const { data, isFetching } = useGetAllUserQuery(query);

  const onChange: PaginationProps['onChange'] = (page) => {
    setQuery((prev) => ({ ...prev, page: page }));
  };

  const tableData = data?.data?.map((user: IUser) => ({
    key: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    contactNo: user.phone || 'N/A',
    status: user.status || 'ACTIVE',
    address: user.address || '',
    city: user.city || '',
    country: user.country || '',
    title: user.title || '',
    description: user.description || '',
    businessInfo: user.businessInfo || {},
    avatar: user.avatar || '',
    facebook: user.facebook || '',
    twitter: user.twitter || '',
    linkedin: user.linkedin || '',
    instagram: user.instagram || '',
  }));

  const roleTag = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Tag color="blue">{role}</Tag>;
      case 'USER':
        return <Tag color="green">{role}</Tag>;
      case 'KEEPER':
        return <Tag color="orange">{role}</Tag>;
      case 'ACCOUNTANT':
        return <Tag color="purple">{role}</Tag>;
      case 'SUPER_ADMIN':
        return <Tag color="red">{role}</Tag>;
      default:
        return <Tag color="default">{role}</Tag>;
    }
  };

  const statusTag = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Tag color="success">{status}</Tag>;
      case 'INACTIVE':
        return <Tag color="error">{status}</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const columns: TableColumnsType<any> = [
    {
      title: 'User Name',
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
      title: 'Role',
      key: 'role',
      dataIndex: 'role',
      align: 'center',
      render: (role: string) => roleTag(role),
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      align: 'center',
      render: (status: string) => statusTag(status),
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
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <UpdateModal user={item} />
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
        <SearchInput setQuery={setQuery} placeholder='Search User...' />
      </Flex>
      <Table
        size='small'
        loading={isFetching}
        columns={columns}
        dataSource={tableData}
        className='border shadow'
        pagination={false}
        scroll={{ x: 'max-content' }} // Makes the table horizontally scrollable
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
const UpdateModal = ({ user }: { user: IUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  
  // Basic info form
  const [basicForm] = Form.useForm();
  const [adminUpdateUser, { isLoading: isUpdating }] = useAdminUpdateUserMutation();
  
  // Password form
  const [passwordForm] = Form.useForm();
  const [adminUpdatePassword, { isLoading: isUpdatingPassword }] = useAdminUpdatePasswordMutation();
  
  // Role form
  const [roleForm] = Form.useForm();
  const [updateUserRole, { isLoading: isUpdatingRole }] = useUpdateUserRoleMutation();

  // Set initial form values when modal opens
  const showModal = () => {
    setIsModalOpen(true);
    
    // Set initial values for basic info form
    basicForm.setFieldsValue({
      name: user.name,
      email: user.email,
      phone: user.contactNo,
      status: user.status,
      address: user.address,
      city: user.city,
      country: user.country,
      title: user.title,
      description: user.description,
      avatar: user.avatar,
      facebook: user.facebook,
      twitter: user.twitter,
      linkedin: user.linkedin,
      instagram: user.instagram,
      businessName: user.businessInfo?.businessName || '',
      businessAddress: user.businessInfo?.businessAddress || '',
      businessPhone: user.businessInfo?.businessPhone || ''
    });
    
    // Set initial value for role form
    roleForm.setFieldsValue({
      role: user.role
    });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    resetForms();
  };
  
  const resetForms = () => {
    basicForm.resetFields();
    passwordForm.resetFields();
    roleForm.resetFields();
    setActiveTab('1');
  };

  // Handle basic info update
  const handleBasicInfoUpdate = async (values) => {
    try {
      // Transform business info
      const formattedData = {
        ...values,
        businessInfo: {
          businessName: values.businessName,
          businessAddress: values.businessAddress,
          businessPhone: values.businessPhone
        }
      };
      
      // Remove flattened business fields
      delete formattedData.businessName;
      delete formattedData.businessAddress;
      delete formattedData.businessPhone;
      
      const response = await adminUpdateUser({
        userId: user.key,
        data: formattedData
      }).unwrap();
      
      toastMessage({ icon: 'success', text: 'User information updated successfully' });
    } catch (error) {
      toastMessage({ icon: 'error', text: error.data?.message || 'Failed to update user information' });
    }
  };
  
  // Handle password update
  const handlePasswordUpdate = async (values) => {
    try {
      await adminUpdatePassword({
        userId: user.key,
        password: values.password
      }).unwrap();
      
      toastMessage({ icon: 'success', text: 'Password updated successfully' });
      passwordForm.resetFields();
    } catch (error) {
      toastMessage({ icon: 'error', text: error.data?.message || 'Failed to update password' });
    }
  };
  
  // Handle role update
  const handleRoleUpdate = async (values) => {
    try {
      await updateUserRole({
        userId: user.key,
        role: values.role
      }).unwrap();
      
      toastMessage({ icon: 'success', text: 'User role updated successfully' });
    } catch (error) {
      toastMessage({ icon: 'error', text: error.data?.message || 'Failed to update user role' });
    }
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
      <Modal 
        title='Update User Information'
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={650}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          items={[
            {
              key: '1',
              label: 'Basic Information',
              children: (
                <Form
                  form={basicForm}
                  layout="vertical"
                  onFinish={handleBasicInfoUpdate}
                  className="mt-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      name="name"
                      label="Full Name"
                      rules={[{ required: true, message: 'Name is required' }]}
                    >
                      <Input placeholder="Full name" />
                    </Form.Item>
                    
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[
                        { required: true, message: 'Email is required' },
                        { type: 'email', message: 'Please enter a valid email' }
                      ]}
                    >
                      <Input placeholder="Email address" />
                    </Form.Item>
                    
                    <Form.Item
                      name="phone"
                      label="Phone Number"
                    >
                      <Input placeholder="Phone number" />
                    </Form.Item>
                    
                    <Form.Item
                      name="status"
                      label="Status"
                    >
                      <Select placeholder="Select status">
                        <Option value="ACTIVE">Active</Option>
                        <Option value="INACTIVE">Inactive</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      name="title"
                      label="Title"
                    >
                      <Input placeholder="Title/Position" />
                    </Form.Item>
                    
                    <Form.Item
                      name="avatar"
                      label="Avatar URL"
                    >
                      <Input placeholder="Avatar image URL" />
                    </Form.Item>
                  </div>
                  
                  <Divider orientation="left">Address Information</Divider>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <Form.Item
                      name="address"
                      label="Address"
                    >
                      <Input placeholder="Street address" />
                    </Form.Item>
                    
                    <Form.Item
                      name="city"
                      label="City"
                    >
                      <Input placeholder="City" />
                    </Form.Item>
                    
                    <Form.Item
                      name="country"
                      label="Country"
                    >
                      <Input placeholder="Country" />
                    </Form.Item>
                  </div>
                  
                  <Divider orientation="left">Business Information</Divider>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <Form.Item
                      name="businessName"
                      label="Business Name"
                    >
                      <Input placeholder="Business name" />
                    </Form.Item>
                    
                    <Form.Item
                      name="businessAddress"
                      label="Business Address"
                    >
                      <Input placeholder="Business address" />
                    </Form.Item>
                    
                    <Form.Item
                      name="businessPhone"
                      label="Business Phone"
                    >
                      <Input placeholder="Business phone" />
                    </Form.Item>
                  </div>
                  
                  <Divider orientation="left">Social Media</Divider>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      name="facebook"
                      label="Facebook"
                    >
                      <Input placeholder="Facebook profile" />
                    </Form.Item>
                    
                    <Form.Item
                      name="twitter"
                      label="Twitter"
                    >
                      <Input placeholder="Twitter profile" />
                    </Form.Item>
                    
                    <Form.Item
                      name="linkedin"
                      label="LinkedIn"
                    >
                      <Input placeholder="LinkedIn profile" />
                    </Form.Item>
                    
                    <Form.Item
                      name="instagram"
                      label="Instagram"
                    >
                      <Input placeholder="Instagram profile" />
                    </Form.Item>
                  </div>
                  
                  <Form.Item
                    name="description"
                    label="Description"
                  >
                    <Input.TextArea rows={4} placeholder="User description" />
                  </Form.Item>
                  
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={isUpdating}>
                      Update Information
                    </Button>
                  </Form.Item>
                </Form>
              )
            },
            {
              key: '2',
              label: 'Change Password',
              children: (
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordUpdate}
                  className="mt-4"
                >
                  <Form.Item
                    name="password"
                    label="New Password"
                    rules={[
                      { required: true, message: 'Password is required' },
                      { min: 6, message: 'Password must be at least 6 characters' }
                    ]}
                  >
                    <Input.Password placeholder="Enter new password" />
                  </Form.Item>
                  
                  <Form.Item
                    name="confirmPassword"
                    label="Confirm Password"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'Please confirm the password' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Passwords do not match'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password placeholder="Confirm new password" />
                  </Form.Item>
                  
                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<KeyOutlined />}
                      loading={isUpdatingPassword}
                    >
                      Update Password
                    </Button>
                  </Form.Item>
                </Form>
              )
            },
            {
              key: '3',
              label: 'User Role',
              children: (
                <Form
                  form={roleForm}
                  layout="vertical"
                  onFinish={handleRoleUpdate}
                  className="mt-4"
                >
                  <Form.Item
                    name="role"
                    label="User Role"
                    rules={[{ required: true, message: 'Please select a role' }]}
                  >
                    <Select placeholder="Select role">
                      <Option value="ADMIN">Admin</Option>
                      <Option value="KEEPER">Keeper</Option>
                      <Option value="USER">User</Option>
                      <Option value="ACCOUNTANT">Accountant</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={isUpdatingRole}>
                      Update Role
                    </Button>
                  </Form.Item>
                </Form>
              )
            }
          ]}
        />
      </Modal>
    </>
  );
};

/**
 * Delete Modal
 */
const DeleteModal = ({ id }: { id: string }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteUser(id).unwrap();
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
      <Modal title='Delete User' open={isModalOpen} onCancel={handleCancel} footer={null}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Are you want to delete this user?</h2>
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
              loading={isDeleting}
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

export default UserManagementPage;