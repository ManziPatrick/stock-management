import React, { useState, useEffect } from 'react';
import type { PaginationProps, TableColumnsType, TableProps } from 'antd';
import { Flex, Pagination, Table, Button, Input, Select, message, Tag, Badge, Grid, Card, Space, Typography } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import {
  useGetAllExpensesQuery,
  useCreateExpenseMutation,
} from '../../redux/features/management/expenseApi';
import { useGetPettyCashQuery } from '../../redux/features/management/pettyCashApi';
import getUserFromPersistedAuth from '../../utils/GetUserId';
import formatDate from '../../utils/formatDate';
import Modal from 'antd/es/modal/Modal';
import { PlusOutlined, SearchOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

interface ExpenseFormData {
  title: string;
  amount: number;
  description?: string;
  category: 'FOOD' | 'TRANSPORT' | 'UTILITIES' | 'ENTERTAINMENT' | 'OTHER';
  status?: 'ACTIVE' | 'ARCHIVED';
  paymentMethod: 'CASH' | 'CHECK' | 'MOMO' | 'PETTY_CASH';
}

interface Expense extends ExpenseFormData {
  _id: string;
  date: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_OPTIONS = [
  { value: 'FOOD', label: 'Food' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'OTHER', label: 'Other' }
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CHECK', label: 'Check' },
  { value: 'MOMO', label: 'Mobile Money' },
  { value: 'PETTY_CASH', label: 'Petty Cash' }
];

const categoryColors: Record<string, string> = {
  'FOOD': 'green',
  'TRANSPORT': 'blue',
  'UTILITIES': 'purple',
  'ENTERTAINMENT': 'magenta',
  'OTHER': 'orange'
};

const paymentMethodColors: Record<string, string> = {
  'CASH': 'cyan',
  'CHECK': 'geekblue',
  'MOMO': 'gold',
  'PETTY_CASH': 'volcano'
};

const GetExpenseManagementPage: React.FC = () => {
  const screens = useBreakpoint();
  
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: 'ACTIVE',
    sortField: 'date',
    sortOrder: 'desc'
  });

  const [searchValue, setSearchValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string | null>(null);

  const { data, isFetching, refetch } = useGetAllExpensesQuery(query);
  const { data: pettyCashData, isLoading: isLoadingPettyCash } = useGetPettyCashQuery(undefined);
  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // Get real petty cash data
  const pettyCashBalance = pettyCashData?.data?.pettyCash?.balance || 0;
  const lastTopupDate = pettyCashData?.data?.pettyCash?.lastTopup || '';

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<ExpenseFormData>({
    defaultValues: {
      title: '',
      amount: 0,
      description: '',
      category: 'OTHER',
      status: 'ACTIVE',
      paymentMethod: 'CASH'
    }
  });

  const userId = getUserFromPersistedAuth();
  const selectedPaymentMethod = watch('paymentMethod');

  // Handle search submit
  const handleSearch = () => {
    setQuery(prev => ({ ...prev, search: searchValue, page: 1 }));
  };

  // Handle table sorting
  const handleTableChange: TableProps<Expense>['onChange'] = (pagination, filters, sorter) => {
    if (Array.isArray(sorter)) return;
    
    if (sorter && 'field' in sorter && 'order' in sorter) {
      const sortField = sorter.field as string;
      const sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
      setQuery(prev => ({ ...prev, sortField, sortOrder }));
    }
  };

  // Apply filters
  const applyFilters = () => {
    const filterQuery: any = { ...query, page: 1 };
    
    if (categoryFilter) {
      filterQuery.category = categoryFilter;
    } else {
      delete filterQuery.category;
    }
    
    if (paymentMethodFilter) {
      filterQuery.paymentMethod = paymentMethodFilter;
    } else {
      delete filterQuery.paymentMethod;
    }
    
    setQuery(filterQuery);
    setIsFilterModalOpen(false);
  };

  // Reset filters
  const resetFilters = () => {
    setCategoryFilter(null);
    setPaymentMethodFilter(null);
    setQuery({
      page: 1,
      limit: 10,
      search: query.search,
      status: 'ACTIVE',
      sortField: 'date',
      sortOrder: 'desc'
    });
    setIsFilterModalOpen(false);
  };

  const onSubmit = async (formData: ExpenseFormData) => {
    try {
      if (formData.paymentMethod === 'PETTY_CASH') {
        if (pettyCashBalance < formData.amount) {
          return messageApi.error('Insufficient petty cash balance');
        }
      }

      const expensePayload = {
        ...formData,
        date: new Date().toISOString(),
        status: formData.status || 'ACTIVE',
        createdBy: userId
      };

      await createExpense(expensePayload).unwrap();
      messageApi.success('Expense created successfully');
      reset();
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      messageApi.error('Failed to create expense');
      console.error('Error creating expense:', error);
    }
  };

  // Get dynamic columns based on screen size
  const getColumns = (): TableColumnsType<Expense> => {
    // Base columns for all screen sizes
    const baseColumns: TableColumnsType<Expense> = [
      {
        title: '#',
        key: 'index',
        width: 60,
        render: (_: any, __: any, index: number) => (
          <Text>{(query.page - 1) * query.limit + index + 1}</Text>
        ),
      },
      {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        sorter: true,
        sortOrder: query.sortField === 'date' ? (query.sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
        render: (date: string) => formatDate(date)
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        
        sorter: true,
        sortOrder: query.sortField === 'amount' ? (query.sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
        render: (amount: number) => (
          <Text strong style={{ color: '#d4380d' }}>
            {amount.toFixed(0)} frw
          </Text>
        )
      }
    ];
    
    // Add title column on small screens and up
    if (screens.sm) {
      baseColumns.splice(2, 0, {
        title: 'Category',
        dataIndex: 'category',
        key: 'category',
        filters: CATEGORY_OPTIONS.map(cat => ({ text: cat.label, value: cat.value })),
        filteredValue: categoryFilter ? [categoryFilter] : null,
        render: (category: string, record: Expense) => (
          <Tag color={categoryColors[record.category]}>
            {CATEGORY_OPTIONS.find(cat => cat.value === record.category)?.label || record.category}
          </Tag>
        )
      });
    }
    
    if (screens.sm) {
      baseColumns.splice(2, 0, {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        sorter: true,
        sortOrder: query.sortField === 'title' ? (query.sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
        render: (title: string, record: Expense) => (
          <Flex vertical gap="small">
            <Text strong>{title}</Text>
          
          </Flex>
        )
      });
    }
    if (screens.sm) {
      baseColumns.splice(3, 0, {
        title: 'by',
        dataIndex: 'title',
        key: 'title',
      
        render: (title: string, record: Expense) => (
          <Flex vertical gap="small">
            
            <Text style={{ fontSize: '0.8em', color: 'gray' }}>{record.createdBy.role}</Text>
          </Flex>
        )
      });
    }
    
    // Add payment method on medium screens and up
    if (screens.md) {
      baseColumns.push({
        title: 'Payment',
        dataIndex: 'paymentMethod',
        key: 'paymentMethod',
        filters: PAYMENT_METHOD_OPTIONS.map(opt => ({ text: opt.label, value: opt.value })),
        filteredValue: paymentMethodFilter ? [paymentMethodFilter] : null,
        render: (method: string) => {
          const methodLabel = PAYMENT_METHOD_OPTIONS.find(opt => opt.value === method)?.label || method;
          return (
            <Tag color={paymentMethodColors[method]}>
              {methodLabel}
            </Tag>
          );
        }
      });
    }
    
    // Add created by on large screens and up
    if (screens.lg) {
      baseColumns.push({
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        render: (description) => (
          <div>
            <span>{description || 'N/A'}</span> 
          </div>
        )
      });
    }
    
    return baseColumns;
  };

  // Create expandable row for mobile view
  const expandableConfig = !screens.lg ? {
    expandedRowRender: (record: Expense) => (
      <Card size="small" bordered={false} style={{ background: '#f5f5f5' }}>
        <Flex vertical gap="small">
          {!screens.sm && (
            <div>
              <Text strong>Title:</Text> {record.title}
              <div style={{ marginTop: 4 }}>
                <Tag color={categoryColors[record.category]}>
                  {CATEGORY_OPTIONS.find(cat => cat.value === record.category)?.label || record.category}
                </Tag>
              </div>
            </div>
          )}
          
          <div>
            <Text strong>Description:</Text> {record.description || 'N/A'}
          </div>
          
          {!screens.md && (
            <div>
              <Text strong>Payment Method:</Text>{' '}
              <Tag color={paymentMethodColors[record.paymentMethod]}>
                {PAYMENT_METHOD_OPTIONS.find(opt => opt.value === record.paymentMethod)?.label || record.paymentMethod}
              </Tag>
            </div>
          )}
          
          {!screens.lg && (
            <div>
              <Text strong>Created By:</Text> {record.createdBy?.name} ({record.createdBy?.email})
            </div>
          )}
        </Flex>
      </Card>
    ),
  } : undefined;

  const expenses = data?.data || [];
  const totalExpenses = data?.total || 0;
  
  // Ensure we have correct pagination data
  // Use data from API response or calculate based on total records
  const currentPage = query.page;
  const totalPages = Math.ceil(totalExpenses / query.limit);

  // Handle page change
  const handlePageChange = (page: number, pageSize?: number) => {
    setQuery(prev => ({ 
      ...prev, 
      page,
      limit: pageSize || prev.limit 
    }));
  };

  // Handle page size change
  const handlePageSizeChange = (current: number, size: number) => {
    setQuery(prev => ({ 
      ...prev, 
      page: 1, // Reset to first page when changing page size
      limit: size 
    }));
  };

  // Function to refresh data
  const handleRefresh = () => {
    refetch();
    messageApi.info('Refreshing expense data');
  };

  return (
    <div className="p-2 md:p-6 bg-white rounded-lg shadow-md min-h-[80vh]">
      {contextHolder}
      
      {/* Header with search and add button */}
      <Card style={{ marginBottom: 16 }}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
          <Title level={screens.md ? 4 : 5} style={{ margin: 0 }}>
            Expense Management
          </Title>
          
          <Flex gap="small" wrap="wrap">
            <Input.Search
              placeholder="Search expenses..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              style={{ width: screens.xs ? '100%' : 200 }}
              loading={isFetching}
            />
            <Button
              icon={<FilterOutlined />}
              onClick={() => setIsFilterModalOpen(true)}
            >
              {screens.sm ? 'Filter' : ''}
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={isFetching}
            >
              {screens.sm ? 'Refresh' : ''}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600"
            >
              {screens.sm ? 'Add Expense' : ''}
            </Button>
          </Flex>
        </Flex>
      </Card>

      {/* Expenses Table */}
      <div style={{ overflowX: 'auto' }}>
        <Table
          size="middle"
          loading={isFetching}
          columns={getColumns()}
          dataSource={expenses}
          className="border rounded-lg"
          rowKey="_id"
          pagination={false}
          expandable={expandableConfig}
          scroll={{ x: 'max-content' }}
          onChange={handleTableChange}
        />
      </div>

      {/* Pagination */}
      <Card style={{ marginTop: 16 }}>
        <Flex 
          justify="space-between" 
          align="center"
          wrap="wrap"
          gap={16}
        >
          <Text>
            {totalExpenses > 0 
              ? `Showing ${((currentPage - 1) * query.limit) + 1}-${Math.min(currentPage * query.limit, totalExpenses)} of ${totalExpenses} items` 
              : 'No items to display'
            }
          </Text>
          
          <Pagination
            current={currentPage}
            onChange={handlePageChange}
            pageSize={query.limit}
            total={totalExpenses}
            showSizeChanger={screens.sm}
            pageSizeOptions={['10', '20', '50', '100']}
            onShowSizeChange={handlePageSizeChange}
            showQuickJumper={screens.md}
            size={screens.sm ? "default" : "small"}
            showLessItems={!screens.md}
            disabled={isFetching}
            showTotal={(total, range) => screens.md ? `${range[0]}-${range[1]} of ${total} items` : null}
          />
        </Flex>
      </Card>

      {/* Filter Modal */}
      <Modal
        title="Filter Expenses"
        open={isFilterModalOpen}
        onCancel={() => setIsFilterModalOpen(false)}
        footer={[
          <Button key="reset" onClick={resetFilters}>
            Reset Filters
          </Button>,
          <Button key="cancel" onClick={() => setIsFilterModalOpen(false)}>
            Cancel
          </Button>,
          <Button key="apply" type="primary" onClick={applyFilters} className="bg-blue-600">
            Apply Filters
          </Button>
        ]}
        width={screens.md ? 480 : "95%"}
      >
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="categoryFilter">Category</label>
            <Select
              id="categoryFilter"
              placeholder="Select category to filter"
              value={categoryFilter}
              onChange={setCategoryFilter}
              allowClear
              style={{ width: '100%' }}
              options={CATEGORY_OPTIONS}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label htmlFor="paymentMethodFilter">Payment Method</label>
            <Select
              id="paymentMethodFilter"
              placeholder="Select payment method to filter"
              value={paymentMethodFilter}
              onChange={setPaymentMethodFilter}
              allowClear
              style={{ width: '100%' }}
              options={PAYMENT_METHOD_OPTIONS}
            />
          </div>
        </div>
      </Modal>

      {/* Add Expense Modal */}
      <Modal
        title="Add New Expense"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          reset();
        }}
        footer={null}
        width={screens.md ? 520 : "95%"}
        centered
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="title">Title</label>
            <Controller
              name="title"
              control={control}
              rules={{
                required: "Title is required",
                minLength: { value: 3, message: "Title must be at least 3 characters" },
                maxLength: { value: 100, message: "Title cannot exceed 100 characters" }
              }}
              render={({ field }) => (
                <Input {...field} id="title" placeholder="Enter expense title" />
              )}
            />
            {errors.title && <span className="text-red-500 text-sm">{errors.title.message}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="category">Category</label>
            <Controller
              name="category"
              control={control}
              rules={{ required: "Category is required" }}
              render={({ field }) => (
                <Select 
                  {...field} 
                  id="category" 
                  placeholder="Select category" 
                  options={CATEGORY_OPTIONS.map(opt => ({
                    ...opt,
                    label: (
                      <Flex align="center" gap="small">
                        <Badge color={categoryColors[opt.value]} />
                        {opt.label}
                      </Flex>
                    )
                  }))}
                />
              )}
            />
            {errors.category && <span className="text-red-500 text-sm">{errors.category.message}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="amount">Amount</label>
            <Controller
              name="amount"
              control={control}
              rules={{
                required: "Amount is required",
                min: { value: 0, message: "Amount must be positive" },
                max: { value: 1000000, message: "Amount cannot exceed 1,000,000" }
              }}
              render={({ field: { onChange, ...field } }) => (
                <Input
                  {...field}
                  onChange={e => onChange(Number(e.target.value))}
                  type="number"
                  step="0.01"
                  min="0"
                  max="1000000"
                  id="amount"
                  placeholder="Enter amount"
                />
              )}
            />
            {errors.amount && <span className="text-red-500 text-sm">{errors.amount.message}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="paymentMethod">Payment Method</label>
            <Controller
              name="paymentMethod"
              control={control}
              rules={{ required: "Payment method is required" }}
              render={({ field }) => (
                <Select 
                  {...field} 
                  id="paymentMethod" 
                  placeholder="Select payment method" 
                  options={PAYMENT_METHOD_OPTIONS.map(opt => ({
                    ...opt,
                    label: (
                      <Flex align="center" gap="small">
                        <Badge color={paymentMethodColors[opt.value]} />
                        {opt.label}
                      </Flex>
                    )
                  }))}
                />
              )}
            />
            {errors.paymentMethod && <span className="text-red-500 text-sm">{errors.paymentMethod.message}</span>}
          </div>

          {selectedPaymentMethod === 'PETTY_CASH' && (
            <Card size="small" className="bg-blue-50">
              <div className="flex justify-between text-sm mb-2">
                <span>Current Petty Cash Balance:</span>
                <span className="font-semibold">{pettyCashBalance.toLocaleString()} frw</span>
              </div>
              <div className="text-xs text-gray-600">
                <div>Last Top-up: {formatDate(lastTopupDate)}</div>
                {watch('amount') > pettyCashBalance ? (
                  <p className="text-red-500 mt-2">Warning: Expense amount exceeds available petty cash balance!</p>
                ) : (
                  <p className="mt-2">Projected Balance After Transaction: {(pettyCashBalance - (watch('amount') || 0)).toLocaleString()} frw</p>
                )}
              </div>
            </Card>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="description">Description</label>
            <Controller
              name="description"
              control={control}
              rules={{ maxLength: { value: 500, message: "Description cannot exceed 500 characters" } }}
              render={({ field }) => (
                <Input.TextArea {...field} id="description" placeholder="Enter description" rows={4} />
              )}
            />
            {errors.description && <span className="text-red-500 text-sm">{errors.description.message}</span>}
          </div>

          <Flex justify="end" gap="small" style={{ marginTop: '8px' }}>
            <Button onClick={() => {
              setIsModalOpen(false);
              reset();
            }}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isCreating}
              className="bg-blue-600"
              disabled={selectedPaymentMethod === 'PETTY_CASH' && watch('amount') > pettyCashBalance}
            >
              Create Expense
            </Button>
          </Flex>
        </form>
      </Modal>
    </div>
  );
};

export default GetExpenseManagementPage;