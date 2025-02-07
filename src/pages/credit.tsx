import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  message,
  DatePicker,
  Pagination,
  Modal,
  Form,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useGetAllCreditsQuery, useCreateCreditMutation, useUpdateCreditMutation } from '../redux/features/management/creditApi';
import { useGetAllProductsQuery } from '../redux/features/management/productApi';
import dayjs from 'dayjs';
import type { TableColumnsType } from 'antd';
import getUserFromPersistedAuth from '../utils/GetUserId';
import { toast } from 'sonner';

interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
}

interface CreditFormData {
  id: string;
  productId: string;
  totalAmount: number;
  downPayment: number;
  creditAmount: number;
  paymentDueDate: string;
  customerDetails: CustomerDetails;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
}

interface Credit extends CreditFormData {
  _id: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'OVERDUE', label: 'Overdue' },
];

const CreditManagementPage: React.FC = () => {
  const [form] = Form.useForm();
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: 'PENDING',
  });
  const handleMarkAsDone = async (id) => {
    try {
  
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    
      toast.success('Task marked as completed!');
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCredit, setEditingCredit] = useState<Credit | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const { data, isFetching } = useGetAllCreditsQuery(query);
  const [createCredit, { isLoading: isCreating }] = useCreateCreditMutation();
  const [updateCredit, { isLoading: isUpdating }] = useUpdateCreditMutation();
  const { data: productsData } = useGetAllProductsQuery({});

  const userId = getUserFromPersistedAuth();

  useEffect(() => {
    if (editingCredit) {
      // Format the date using dayjs for the DatePicker
      const formattedCredit = {
        ...editingCredit,
        paymentDueDate: dayjs(editingCredit.paymentDueDate),
      };
      form.setFieldsValue(formattedCredit);
    }
  }, [editingCredit, form]);

  const handleSubmit = async (values: CreditFormData) => {
    try {
      // Validate amounts
      const total = Number(values.totalAmount);
      const downPayment = Number(values.downPayment);
      const creditAmount = total - downPayment;

      if (downPayment > total) {
        messageApi.error('Down payment must be less than or equal to the total amount');
        return;
    }
    
    

      const formattedValues = {
        ...values,
        totalAmount: total,
        downPayment: downPayment,
        creditAmount: creditAmount,
        status: values.status || 'PENDING',
      };

      if (editingCredit?._id) {
        await updateCredit({
          id: editingCredit._id,
          payload: formattedValues
        }).unwrap();
        messageApi.success('Credit record updated successfully');
      } else {
        await createCredit({
          ...formattedValues,
          createdBy: userId,
        }).unwrap();
        messageApi.success('Credit record created successfully');
      }
      form.resetFields();
      setIsModalOpen(false);
      setEditingCredit(null);
    } catch (error) {
      messageApi.error(editingCredit ? 'Failed to update credit record' : 'Failed to create credit record');
      console.error('Error:', error);
    }
  };

  const columns: TableColumnsType<Credit> = [
    {
      title: 'Customer Name',
      dataIndex: ['customerDetails', 'name'],
      key: 'customerName',
      className: 'text-sm font-medium',
    },
    {
      title: 'Contact',
      dataIndex: ['customerDetails', 'phone'],
      key: 'contact',
      className: 'text-sm',
      render: (phone: string, record: Credit) => (
        <div>
          <div>{phone}</div>
          <div className="text-gray-500 text-xs">{record.customerDetails.email}</div>
        </div>
      ),
    },
    {
      title: 'Product',
      dataIndex: 'productId',
      key: 'product',
      className: 'text-sm',
      render: (productId: string) => {
        const product = productsData?.data?.find((p: any) => p._id === productId);
        return <span className="font-medium">{product?.name || 'Product not found'}</span>;
      },
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      className: 'text-sm',
      render: (amount: number) => (
        <span className="font-medium">{amount.toLocaleString()} RWF</span>
      ),
    },
    {
      title: 'Down Payment',
      dataIndex: 'downPayment',
      key: 'downPayment',
      align: 'right',
      className: 'text-sm',
      render: (amount: number) => (
        <span className="font-medium">{amount.toLocaleString()} RWF</span>
      ),
    },
    {
      title: 'Credit Amount',
      dataIndex: 'creditAmount',
      key: 'creditAmount',
      align: 'right',
      className: 'text-sm',
      render: (amount: number) => (
        <span className="font-medium text-red-600">{amount.toLocaleString()} RWF</span>
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'paymentDueDate',
      key: 'paymentDueDate',
      className: 'text-sm',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      className: 'text-sm',
      render: (status: string) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === 'COMPLETED'
              ? 'bg-green-100 text-green-800'
              : status === 'PENDING'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {status}
        </span>
      ),
    },
    {
        title: 'Actions',
        key: 'actions',
        className: 'text-sm',
        render: (_, record) => (
          record.status !== 'COMPLETED' ? (
            <Button
              type="link"
              onClick={() => {
                setEditingCredit({
                  ...record,
                  id: record._id
                });
                setIsModalOpen(true);
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Update
            </Button>
          ) : (
            <Button
              type="link"
              onClick={() => {
                // Code to mark as done or take any relevant action for completed tasks
                handleMarkAsDone(record._id);
              }}
              className="text-green-600 hover:text-green-800"
            >
              Done
            </Button>
          )
        ),
      }
      
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow h-[90vh]">
      {contextHolder}
      
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Select
              defaultValue="PENDING"
              style={{ width: 120 }}
              onChange={(value) => setQuery((prev) => ({ ...prev, status: value, page: 1 }))}
              options={STATUS_OPTIONS}
              className="min-w-[150px]"
            />
            <Input.Search
              placeholder="Search credits..."
              onSearch={(value) => setQuery((prev) => ({ ...prev, search: value, page: 1 }))}
              className="w-64"
            />
          </div>
          <Button
            type="primary"
            onClick={() => setIsModalOpen(true)}
            icon={<PlusOutlined />}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add New Credit
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={data?.data || []}
          loading={isFetching}
          rowKey="_id"
          pagination={false}
          className="border rounded-lg"
          scroll={{ x: true }}
        />

        <div className="flex justify-center mt-6">
          <Pagination
            current={data?.pagination?.currentPage || 1}
            total={data?.pagination?.totalItems || 0}
            pageSize={query.limit}
            onChange={(page) => setQuery((prev) => ({ ...prev, page }))}
            showSizeChanger={false}
          />
        </div>

        <Modal
          title={editingCredit ? "Update Credit" : "Add New Credit"}
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingCredit(null);
            form.resetFields();
          }}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            className="mt-4"
            initialValues={{ status: 'PENDING' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Information Section */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Customer Information</h3>
                <Form.Item
                  name={['customerDetails', 'name']}
                  label="Customer Name"
                  rules={[{ required: true, message: 'Please enter customer name' }]}
                >
                  <Input placeholder="Enter customer name" />
                </Form.Item>

                <Form.Item
                  name={['customerDetails', 'phone']}
                  label="Phone Number"
                  rules={[{ required: true, message: 'Please enter phone number' }]}
                >
                  <Input placeholder="Enter phone number" />
                </Form.Item>

                <Form.Item
                  name={['customerDetails', 'email']}
                  label="Email"
                  rules={[
                    { required: true, message: 'Please enter email' },
                    { type: 'email', message: 'Please enter a valid email' }
                  ]}
                >
                  <Input placeholder="Enter email" />
                </Form.Item>
              </div>

              {/* Payment Information Section */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Payment Information</h3>
                <Form.Item
                  name="productId"
                  label="Product"
                  rules={[{ required: true, message: 'Please select a product' }]}
                >
                  <Select
                    placeholder="Select a product"
                    options={productsData?.data?.map((product: any) => ({
                      value: product._id,
                      label: product.name,
                    }))}
                  />
                </Form.Item>

                <Form.Item
                  name="totalAmount"
                  label="Total Amount"
                  rules={[{ required: true, message: 'Please enter total amount' }]}
                >
                  <Input type="number" min={0} placeholder="Enter total amount"   disabled/>
                </Form.Item>
                <Form.Item
  name="downPayment"
  label="Down Payment"
  rules={[
    { required: true, message: 'Please enter down payment' },
    ({ getFieldValue }) => ({
      validator(_, value) {
        if (!value || value <= getFieldValue('totalAmount')) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('Down payment must be less than or equal to the total amount'));
      },
    }),
  ]}
>
  <Input type="number" min={0} placeholder="Enter down payment" />
</Form.Item>


                <Form.Item
                  name="paymentDueDate"
                  label="Due Date"
                  rules={[{ required: true, message: 'Please select due date' }]}
                >
                  <DatePicker className="w-full" />
                </Form.Item>

                <Form.Item
                  name="status"
                  label="Status"
                  rules={[{ required: true, message: 'Please select status' }]}
                >
                  <Select options={STATUS_OPTIONS} />
                </Form.Item>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCredit(null);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isCreating || isUpdating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editingCredit ? 'Update' : 'Submit'}
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default CreditManagementPage;