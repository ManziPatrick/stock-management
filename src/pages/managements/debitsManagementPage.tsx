import {FileAddOutlined, PlusOutlined, PrinterOutlined, UnorderedListOutlined } from '@ant-design/icons';
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
  Space,
  Row,
  Col,
  Typography,
  Card,
} from 'antd';
import { useGetAllDebitsQuery, useCreateDebitMutation, useUpdateDebitMutation } from '../../redux/features/management/debitApi';
import dayjs from 'dayjs';
import type { TableColumnsType } from 'antd';
import getUserFromPersistedAuth from '../../utils/GetUserId';
import Credit from '../credit';
import { useMediaQuery } from 'react-responsive';

const { Title } = Typography;

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

  // Responsive breakpoints
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1024px)' });
  const isMobile = useMediaQuery({ query: '(max-width: 640px)' });

  const { data, isFetching } = useGetAllDebitsQuery(query);
  const [createDebit, { isLoading: isCreating }] = useCreateDebitMutation();
  const [updateDebit, { isLoading: isUpdating }] = useUpdateDebitMutation();

  const userId = getUserFromPersistedAuth();

  const toggleView = () => {
    setIsListView(!isListView);
  };

  useEffect(() => {
    if (editingDebit) {
      form.setFieldsValue({
        ...editingDebit,
        dueDate: dayjs(editingDebit.dueDate),
      });
    }
  }, [editingDebit, form]);

  const handleSubmit = async (values: any) => {
    try {
      const currentPaid = editingDebit?.paidAmount || 0;
      const topUp = Number(values.topUpPaidAmount) || 0;
      const totalAmount = editingDebit?.totalAmount || 0;
  
      const newPaidAmount = currentPaid + topUp;
  
      if (newPaidAmount > totalAmount) {
        return messageApi.error('Total paid amount cannot exceed the total amount');
      }
  
      const remainingAmount = totalAmount - newPaidAmount;
      const status = remainingAmount <= 0 ? 'COMPLETED' : 'PENDING';
  
      const payload = {
        ...values,
        buyerName: values.buyerName,
        productName: values.productName,
        description: values.description,
        dueDate: values.dueDate,
        totalAmount,
        paidAmount: newPaidAmount,
        remainingAmount,
        status,
      };
  
      if (editingDebit) {
        await updateDebit({
          id: editingDebit._id,
          payload,
        }).unwrap();
        messageApi.success('Payment updated successfully');
      } else {
        await createDebit({
          ...payload,
          createdBy: userId,
        }).unwrap();
        messageApi.success('Debit created successfully');
      }
  
      form.resetFields();
      setIsModalOpen(false);
      setEditingDebit(null);
    } catch (error) {
      messageApi.error('Failed to process debit');
      console.error(error);
    }
  };
  

  // Responsive columns configuration
  const getColumns = (): TableColumnsType<Debit> => {
    const baseColumns: TableColumnsType<Debit> = [
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
        responsive: ['md'],
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
        responsive: ['lg'],
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
        responsive: ['md'],
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

    return baseColumns;
  };

  // Expandable row configuration for mobile view
  const expandableConfig = isMobile
    ? {
        expandedRowRender: (record: Debit) => (
          <div className="p-4">
            <p className="mb-2"><strong>Product:</strong> {record.productName}</p>
            <p className="mb-2"><strong>Paid Amount:</strong> {record.paidAmount.toLocaleString()} RWF</p>
            <p className="mb-2"><strong>Due Date:</strong> {dayjs(record.dueDate).format('YYYY-MM-DD')}</p>
            <p><strong>Description:</strong> {record.description || 'N/A'}</p>
          </div>
        ),
        expandRowByClick: true,
      }
    : {};

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white rounded-lg shadow h-full md:h-[90vh] overflow-auto">
      {contextHolder}
      
      <Row justify="space-between" align="middle" className="mb-4 md:mb-6">
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            {isListView ? 'Credit List' : 'Debits List'}
          </Title>
        </Col>
        <Col>
          <Button
            onClick={toggleView}
            type="primary"
            icon={isListView ? <FileAddOutlined /> : <UnorderedListOutlined />}
          >
            {isListView ? 'Debits List' : 'Credit List'}
          </Button>
        </Col>
      </Row>

      {isListView ? (
        <div>
          <Credit />
        </div>
      ) : (
        <div>
          <Card className="mb-4">
            <Row gutter={[16, 16]} justify="space-between" align="middle">
              <Col xs={24} sm={24} md={12} lg={16}>
                <Space direction={isMobile ? 'vertical' : 'horizontal'} className="w-full">
                  <Select
                    defaultValue="PENDING"
                    style={{ width: isMobile ? '100%' : 120 }}
                    onChange={(value) => setQuery((prev) => ({ ...prev, status: value, page: 1 }))}
                    options={STATUS_OPTIONS}
                  />
                  <Input.Search
                    placeholder="Search debits..."
                    onSearch={(value) => setQuery((prev) => ({ ...prev, search: value, page: 1 }))}
                    style={{ width: isMobile ? '100%' : 250 }}
                  />
                </Space>
              </Col>
              {/* <Col xs={24} sm={24} md={12} lg={8} className="flex justify-end">
                <Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingDebit(null);
                      setIsModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isMobile ? '' : 'Add Debit'}
                  </Button>
                  <Button icon={<PrinterOutlined />}>
                    {isMobile ? '' : 'Print'}
                  </Button>
                </Space>
              </Col> */}
            </Row>
          </Card>

          <div className="overflow-x-auto">
            <Table
              columns={getColumns()}
              dataSource={data?.data || []}
              loading={isFetching}
              rowKey="_id"
              pagination={false}
              className="border rounded-lg"
              scroll={{ x: 'max-content' }}
              {...expandableConfig}
              size={isTabletOrMobile ? "small" : "middle"}
            />
          </div>

          <Row justify="center" className="mt-6">
            <Pagination
              current={data?.pagination?.currentPage || 1}
              total={data?.pagination?.totalItems || 0}
              pageSize={query.limit}
              onChange={(page) => setQuery((prev) => ({ ...prev, page }))}
              showSizeChanger={false}
              size={isMobile ? "small" : "default"}
              responsive
            />
          </Row>

          <Modal
            title={editingDebit ? "Update Debit" : "Add New Debit"}
            open={isModalOpen}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingDebit(null);
              form.resetFields();
            }}
            footer={null}
            width={isMobile ? "95%" : 600}
            centered
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

              <Row gutter={16}>
  <Col xs={24} sm={12}>
    <Form.Item
      name="totalAmount"
      label="Total Amount"
    >
      <Input type="number" disabled />
    </Form.Item>
  </Col>

  <Col xs={24} sm={12}>
    <Form.Item
      name="paidAmount"
      label="Current Paid Amount"
    >
      <Input type="number" disabled />
    </Form.Item>
  </Col>
</Row>

<Form.Item
  name="topUpPaidAmount"
  label="Add Payment Amount"
  rules={[
    {
      type: 'number',
      min: 0,
      message: 'Please enter a valid number',
    },
  ]}
  normalize={(value) => (value ? Number(value) : 0)}
>
  <Input type="number" placeholder="Add to paid amount" />
</Form.Item>

              <Form.Item
                name="dueDate"
                label="Due Date"
                rules={[{ required: true, message: 'Please select due date' }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>

              <Form.Item
                name="description"
                label="Description"
              >
                <Input.TextArea placeholder="Enter description (optional)" rows={3} />
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