import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Typography, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  DatePicker, 
  Select, 
  Button, 
  Space, 
  Flex, 
  Pagination, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  message,
  Grid
} from 'antd';
import type { DatePickerProps, RangePickerProps } from 'antd/es/date-picker';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { 
  useGetPettyCashQuery, 
  useGetAllTransactionsQuery,
  useTopUpPettyCashMutation
} from '../../redux/features/management/pettyCashApi';
import formatDate from '../../utils/formatDate';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { useBreakpoint } = Grid;

interface TransactionPerformedBy {
  _id: string;
  name: string;
  email: string;
}

interface TransactionExpense {
  _id: string;
  title: string;
  category: string;
}

interface Transaction {
  _id: string;
  date: string;
  amount: number;
  description: string;
  performedBy: TransactionPerformedBy;
  expenseId?: TransactionExpense;
}

interface QueryParams {
  page: number;
  limit: number;
  transactionType?: 'topup' | 'expense';
  startDate?: string;
  endDate?: string;
}

interface TopUpFormValues {
  amount: number;
  description: string;
}

const PettyCashTransactionsPage: React.FC = () => {
  const screens = useBreakpoint();
  
  // State for query parameters
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    limit: 10,
  });

  // State for top-up modal
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpForm] = Form.useForm<TopUpFormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  // Fetch petty cash summary
  const { 
    data: pettyCashData, 
    isLoading: isLoadingPettyCash,
    refetch: refetchPettyCash
  } = useGetPettyCashQuery(undefined);

  // Fetch transactions
  const { 
    data: transactionsData, 
    isLoading: isLoadingTransactions,
    refetch: refetchTransactions
  } = useGetAllTransactionsQuery(queryParams);

  // Top-up mutation
  const [topUpPettyCash, { isLoading: isTopping }] = useTopUpPettyCashMutation();

  // Handle date range change
  const handleDateRangeChange = (
    dates: RangePickerProps['value'], 
    dateStrings: [string, string]
  ) => {
    if (dates && dateStrings[0] && dateStrings[1]) {
      setQueryParams({
        ...queryParams,
        startDate: dateStrings[0],
        endDate: dateStrings[1],
        page: 1, // Reset to first page when filters change
      });
    } else {
      setQueryParams({
        ...queryParams,
        startDate: undefined,
        endDate: undefined,
        page: 1,
      });
    }
  };

  // Handle transaction type change
  const handleTypeChange = (value: 'topup' | 'expense' | undefined) => {
    setQueryParams({
      ...queryParams,
      transactionType: value,
      page: 1, // Reset to first page when filters change
    });
  };

  // Handle pagination change
  const handlePageChange = (page: number, pageSize: number) => {
    setQueryParams({
      ...queryParams,
      page,
      limit: pageSize,
    });
  };

  // Handle top-up modal
  const showTopUpModal = () => {
    setIsTopUpModalOpen(true);
  };

  const handleTopUpCancel = () => {
    setIsTopUpModalOpen(false);
    topUpForm.resetFields();
  };

  const handleTopUpSubmit = async () => {
    try {
      const values = await topUpForm.validateFields();
      await topUpPettyCash({
        amount: values.amount,
        description: values.description,
      }).unwrap();
      
      messageApi.success('Petty cash topped up successfully');
      setIsTopUpModalOpen(false);
      topUpForm.resetFields();
      
      // Refresh data
      refetchPettyCash();
      refetchTransactions();
    } catch (error) {
      console.error('Failed to top up petty cash:', error);
      messageApi.error('Failed to top up petty cash');
    }
  };

  // Responsive table columns based on screen size
  const getColumns = (): TableColumnsType<Transaction> => {
    // Base columns for all screen sizes
    const baseColumns: TableColumnsType<Transaction> = [
      {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        render: (date: string) => formatDate(date),
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        align: 'right',
        render: (amount: number) => (
          <Text 
            style={{ 
              color: amount > 0 ? 'green' : 'red',
              fontWeight: 'bold'
            }}
          >
            {amount > 0 ? '+' : ''}{amount.toFixed(2)} frw
          </Text>
        ),
      },
      {
        title: 'Type',
        key: 'type',
        render: (_: any, record: Transaction) => (
          <Text>{record.amount > 0 ? 'Top-up' : 'Expense'}</Text>
        ),
      }
    ];
    
    // Additional columns for medium screens and up
    if (screens.md) {
      baseColumns.push(
        {
          title: 'Description',
          dataIndex: 'description',
          key: 'description',
          ellipsis: !screens.lg,
        }
      );
    }
    
    // Additional columns for large screens and up
    if (screens.lg) {
      baseColumns.push(
        {
          title: 'Performed By',
          dataIndex: 'performedBy',
          key: 'performedBy',
          render: (user: TransactionPerformedBy) => (
            <div>
              <div>{user?.name}</div>
              <div style={{ fontSize: '0.8em', color: 'gray' }}>{user?.email}</div>
            </div>
          ),
        }
      );
    }
    
    // Additional columns for extra large screens
    if (screens.xl) {
      baseColumns.push(
        {
          title: 'Related Expense',
          key: 'expense',
          render: (_: any, record: Transaction) => (
            record.expenseId ? record.expenseId.title : '-'
          ),
        }
      );
    }
    
    return baseColumns;
  };

  // Handle expandable row content for smaller screens
  const expandableConfig = !screens.lg ? {
    expandedRowRender: (record: Transaction) => (
      <div style={{ paddingLeft: 8 }}>
        <p><strong>Description:</strong> {record.description}</p>
        <p><strong>Performed By:</strong> {record.performedBy?.name} ({record.performedBy?.email})</p>
        {record.expenseId && <p><strong>Related Expense:</strong> {record.expenseId.title}</p>}
      </div>
    ),
  } : undefined;

  // Get petty cash balance and last top-up date
  const pettyCashBalance = pettyCashData?.data?.pettyCash?.balance || 0;
  const lastTopupDate = pettyCashData?.data?.pettyCash?.lastTopup 
    ? formatDate(pettyCashData.data.pettyCash.lastTopup)
    : 'N/A';

  // Handle transactions data safely
  const transactions = transactionsData?.data?.transactions || [];
  const totalItems = transactionsData?.data?.pagination?.totalItems || 0;

  return (
    <>
      {contextHolder}
      
      <Card loading={isLoadingPettyCash} style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title="Current Balance"
              value={pettyCashBalance}
              precision={2}
              suffix="frw"
              valueStyle={{ color: pettyCashBalance > 0 ? 'green' : 'red' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title="Last Top-up Date"
              value={lastTopupDate}
            />
          </Col>
          <Col xs={24} md={8}>
            <Flex justify={screens.md ? "end" : "start"} align="center">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showTopUpModal}
              >
                Top-up Petty Cash
              </Button>
            </Flex>
          </Col>
        </Row>
      </Card>
      
      {/* Filters Section */}
      <Card style={{ marginBottom: 16, overflowX: 'auto' }}>
        <Space 
          direction={screens.md ? "horizontal" : "vertical"} 
          size="middle" 
          style={{ 
            marginBottom: 16,
            width: screens.md ? 'auto' : '100%',
            display: 'flex'
          }}
        >
          <RangePicker 
            style={{ width: screens.xs ? '100%' : 'auto' }} 
            onChange={handleDateRangeChange} 
          />
          
          <Select<'topup' | 'expense' | undefined>
            placeholder="Transaction Type"
            allowClear
            style={{ width: screens.xs ? '100%' : 150 }}
            onChange={handleTypeChange}
          >
            <Option value="topup">Top-up Only</Option>
            <Option value="expense">Expense Only</Option>
          </Select>
          
          <Button
            icon={<ReloadOutlined />}
            style={{ width: screens.xs ? '100%' : 'auto' }}
            onClick={() => {
              setQueryParams({
                page: 1,
                limit: 10,
              });
              refetchTransactions();
            }}
          >
            Reset Filters
          </Button>
        </Space>
      </Card>
      
      {/* Transactions Table */}
      <div style={{ overflowX: 'auto' }}>
        <Table<Transaction>
          columns={getColumns()}
          dataSource={transactions}
          rowKey="_id"
          loading={isLoadingTransactions}
          pagination={false}
          expandable={expandableConfig}
          scroll={{ x: 'max-content' }}
        />
      </div>
      
      {/* Fixed Pagination */}
      <Card style={{ marginTop: 16 }}>
        <Flex 
          justify="space-between" 
          align="center"
          wrap="wrap"
          gap={16}
        >
          <Text>
            {totalItems > 0 
              ? `Showing ${((queryParams.page - 1) * queryParams.limit) + 1}-${Math.min(queryParams.page * queryParams.limit, totalItems)} of ${totalItems} items` 
              : 'No items to display'
            }
          </Text>
          
          <Pagination
            current={queryParams.page}
            pageSize={queryParams.limit}
            total={totalItems}
            onChange={handlePageChange}
            onShowSizeChange={handlePageChange}
            pageSizeOptions={['10', '20', '50', '100']}
            showSizeChanger
            showQuickJumper={screens.md}
            showTotal={null}
            size={screens.sm ? "default" : "small"}
            // Ensure page numbers are always visible
            showLessItems={!screens.md}
            // Default 5 pages shown on desktop, 3 on mobile
            defaultPageSize={10}
          />
        </Flex>
      </Card>
      
      {/* Top-up Modal */}
      <Modal
        title="Top-up Petty Cash"
        open={isTopUpModalOpen}
        onOk={handleTopUpSubmit}
        onCancel={handleTopUpCancel}
        confirmLoading={isTopping}
        width={screens.md ? 520 : "95%"}
        centered
      >
        <Form<TopUpFormValues>
          form={topUpForm}
          layout="vertical"
        >
          <Form.Item
            name="amount"
            label="Amount (frw)"
            rules={[
              { required: true, message: 'Please enter the amount' },
              { type: 'number', min: 1, message: 'Amount must be positive' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <Input placeholder="Purpose of this top-up" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default PettyCashTransactionsPage;