
import { DeleteOutlined, FileAddOutlined, PlusOutlined, PrinterOutlined, UnorderedListOutlined } from '@ant-design/icons';import React, { useState, useEffect } from 'react';
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
import { useGetAllDebitsQuery, useCreateDebitMutation, useUpdateDebitMutation } from '../../redux/features/management/debitApi';
import dayjs from 'dayjs';
import type { TableColumnsType } from 'antd';
import getUserFromPersistedAuth from '../../utils/GetUserId';
import Title from 'antd/es/skeleton/Title';

interface DebitFormData {
  productName: string;
  buyerName: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  description?: string;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
}

interface Debit extends DebitFormData {
  _id: string;
  remainingAmount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'OVERDUE', label: 'Overdue' },
];

const DebitManagementPage: React.FC = () => {
  const [isListView, setIsListView] = useState(false);
  const toggleView = () => {
    setIsListView(!isListView);
  };
  const [form] = Form.useForm();
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: 'PENDING',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebit, setEditingDebit] = useState<Debit | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const { data, isFetching } = useGetAllDebitsQuery(query);
  const [createDebit, { isLoading: isCreating }] = useCreateDebitMutation();
  const [updateDebit, { isLoading: isUpdating }] = useUpdateDebitMutation();

  const userId = getUserFromPersistedAuth();

  useEffect(() => {
    if (editingDebit) {
      form.setFieldsValue({
        ...editingDebit,
        dueDate: dayjs(editingDebit.dueDate),
      });
    }
  }, [editingDebit, form]);

  const handleSubmit = async (values: DebitFormData) => {
    try {
      const remainingAmount = values.totalAmount - values.paidAmount;
      const status = remainingAmount <= 0 ? 'COMPLETED' : values.status;

      if (editingDebit) {
        await updateDebit({
          id: editingDebit._id,
          payload: {
            ...values,
            remainingAmount,
            status,
          },
        }).unwrap();
        messageApi.success('Debit record updated successfully');
      } else {
        await createDebit({
          ...values,
          remainingAmount,
          status,
          createdBy: userId,
        }).unwrap();
        messageApi.success('Debit record created successfully');
      }
      form.resetFields();
      setIsModalOpen(false);
      setEditingDebit(null);
    } catch (error) {
      messageApi.error(editingDebit ? 'Failed to update debit record' : 'Failed to create debit record');
      console.error('Error:', error);
    }
  };

  const columns: TableColumnsType<Debit> = [
    {
      title: 'Buyer Name',
      dataIndex: 'buyerName',
      key: 'buyerName',
      className: 'text-sm font-medium',
    },
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
      className: 'text-sm',
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
      title: 'Paid Amount',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      align: 'right',
      className: 'text-sm',
      render: (amount: number) => (
        <span className="font-medium">{amount.toLocaleString()} RWF</span>
      ),
    },
    {
      title: 'Remaining',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      align: 'right',
      className: 'text-sm',
      render: (amount: number) => (
        <span className="font-medium text-red-600">{amount.toLocaleString()} RWF</span>
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
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
        <Button
          type="link"
          onClick={() => {
            setEditingDebit(record);
            setIsModalOpen(true);
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          Update
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow h-[90vh]">

      {contextHolder}
      <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '16px' 
        }}>
          <div  style={{ margin: 0 }}>
            {isListView ? 'credit List' : 'Debits List'}
          </div>
          <Button 
            onClick={toggleView} 
            type="primary" 
            icon={isListView ? <FileAddOutlined /> : <UnorderedListOutlined />}
          >
            {isListView ? 'Create New Invoice' : 'View Invoices List'}
          </Button>
        </div>

        {isListView ? (
          
          <div>
            hello cardit
          </div>
        ) : (
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
            placeholder="Search debits..."
            onSearch={(value) => setQuery((prev) => ({ ...prev, search: value, page: 1 }))}
            className="w-64"
          />
        </div>
       
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
        title={editingDebit ? "Update Debit" : "Add New Debit"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingDebit(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          className="mt-4"
          initialValues={{ status: 'PENDING' }}
        >
          <Form.Item
            name="buyerName"
            label="Buyer Name"
            rules={[{ required: true, message: 'Please enter buyer name' }]}
          >
            <Input placeholder="Enter buyer name" />
          </Form.Item>

          <Form.Item
            name="productName"
            label="Product Name"
            rules={[{ required: true, message: 'Please enter product name' }]}
          >
            <Input placeholder="Enter product name" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="totalAmount"
              label="Total Amount"
              rules={[{ required: true, message: 'Please enter total amount' }]}
            >
              <Input type="number" min={0} placeholder="Enter total amount" />
            </Form.Item>

            <Form.Item
              name="paidAmount"
              label="Paid Amount"
              rules={[
                { required: true, message: 'Please enter paid amount' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('totalAmount') >= value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Paid amount cannot exceed total amount'));
                  },
                }),
              ]}
            >
              <Input type="number" min={0} placeholder="Enter paid amount" />
            </Form.Item>
          </div>

          <Form.Item
            name="dueDate"
            label="Due Date"
            rules={[{ required: true, message: 'Please select due date' }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item name="status" label="Status">
            <Select options={STATUS_OPTIONS} />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setIsModalOpen(false);
                setEditingDebit(null);
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
              {editingDebit ? 'Update' : 'Submit'}
            </Button>
          </div>
        </Form>
      </Modal>
      </div>
        )}
    </div>
  );
};

export default DebitManagementPage;