import type { PaginationProps, TableColumnsType } from 'antd';
import { Flex, Pagination, Table, Button, Input, Select, message } from 'antd';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  useGetAllExpensesQuery,
  useCreateExpenseMutation,
} from '../../redux/features/management/expenseApi';
import getUserFromPersistedAuth from '../../utils/GetUserId';
import formatDate from '../../utils/formatDate';
import Modal from 'antd/es/modal/Modal';

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

const GetExpenseManagementPage = () => {
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: 'ACTIVE'
  });

  const { data, isFetching, refetch } = useGetAllExpensesQuery(query);
  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const [pettyCash, setPettyCash] = useState({
    balance: 150000,
    lastTopup: '2025-04-10',
    recentTransactions: []
  });

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

  const onSubmit = async (formData: ExpenseFormData) => {
    try {
      if (formData.paymentMethod === 'PETTY_CASH') {
        if (pettyCash.balance < formData.amount) {
          return messageApi.error('Insufficient petty cash balance');
        }

        setPettyCash(prev => ({
          ...prev,
          balance: prev.balance - formData.amount,
          recentTransactions: [
            {
              date: new Date().toISOString().split('T')[0],
              amount: -formData.amount,
              description: formData.title
            },
            ...prev.recentTransactions
          ]
        }));
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

  const columns: TableColumnsType<Expense> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => formatDate(date)
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount: number) => `${amount.toFixed(2)} frw`
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => {
        const methodMap: Record<string, string> = {
          'CASH': 'Cash',
          'CHECK': 'Check',
          'MOMO': 'Mobile Money',
          'PETTY_CASH': 'Petty Cash'
        };
        return methodMap[method] || method;
      }
    },
    {
      title: 'By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (createdBy) => (
        <div>
          <div>{createdBy?.name}</div>
          <div style={{ fontSize: '0.8em', color: 'gray' }}>{createdBy?.email}</div>
        </div>
      )
    }
  ];

  const expenses = data?.data || [];
  const totalExpenses = data?.total || 0;
  const currentPage = data?.pagination?.currentPage || 1;
  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md h-[90vh]">
      {contextHolder}
      <Flex justify="end" style={{ margin: '16px', gap: 8 }}>
        <Input.Search
          placeholder="Search expenses..."
          onSearch={(value) => setQuery(prev => ({ ...prev, search: value, page: 1 }))}
          style={{ width: 200 }}
        />
        <Button
          type="primary"
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600"
        >
          Add Expense
        </Button>
      </Flex>

      <Table
        size="middle"
        loading={isFetching}
        columns={columns}
        dataSource={expenses}
        className="border rounded-lg"
        rowKey="_id"
        pagination={false}
      />

      <Flex justify="center" style={{ marginTop: '1rem' }}>
        <Pagination
          current={currentPage}
          onChange={(page) => setQuery(prev => ({ ...prev, page }))}
          pageSize={query.limit}
          total={totalExpenses}
          showSizeChanger={false}
        />
      </Flex>

      <Modal
        title="Add New Expense"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          reset();
        }}
        footer={null}
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
                <Select {...field} id="category" placeholder="Select category" options={CATEGORY_OPTIONS} />
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
                <Select {...field} id="paymentMethod" placeholder="Select payment method" options={PAYMENT_METHOD_OPTIONS} />
              )}
            />
            {errors.paymentMethod && <span className="text-red-500 text-sm">{errors.paymentMethod.message}</span>}
          </div>

          {selectedPaymentMethod === 'PETTY_CASH' && (
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex justify-between text-sm mb-2">
                <span>Current Petty Cash Balance:</span>
                <span className="font-semibold">{pettyCash.balance.toLocaleString()} frw</span>
              </div>
              <div className="text-xs text-gray-600">
                {watch('amount') > pettyCash.balance ? (
                  <p className="text-red-500">Warning: Expense amount exceeds available petty cash balance!</p>
                ) : (
                  <p>Projected Balance After Transaction: {(pettyCash.balance - (watch('amount') || 0)).toLocaleString()} frw</p>
                )}
              </div>
            </div>
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
              disabled={selectedPaymentMethod === 'PETTY_CASH' && watch('amount') > pettyCash.balance}
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
