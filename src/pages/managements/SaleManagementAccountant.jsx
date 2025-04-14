import { Button, Flex, Pagination, Table, Typography, Select, Space, Badge, message, Tooltip, Tag } from 'antd';
import { useState } from 'react';
import SearchInput from '../../components/SearchInput';
import { useGetAllSaleQuery, useUpdateSaleStatusMutation } from '../../redux/features/management/saleApi';
import { CheckCircleOutlined, CloseCircleOutlined, CreditCardOutlined } from '@ant-design/icons';

const { Text } = Typography;

const SaleManagementPage = () => {
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    filterBy: 'daily',
  });

  const [processingIds, setProcessingIds] = useState([]);
  const { data, isFetching } = useGetAllSaleQuery(query);
  const [updateSaleStatus] = useUpdateSaleStatusMutation();

  const formatCurrency = (value) => `${value?.toFixed(0) || '0.00'} frw`;
  const formatDate = (date) => new Date(date).toISOString().split('T')[0];

  const handleApproval = async (saleId, status) => {
    if (!saleId) {
      message.error("Sale ID is undefined!");
      return;
    }
    
    setProcessingIds(prev => [...prev, saleId]);
    
    try {
      await updateSaleStatus({ saleId, status }).unwrap();
      message.success(`Sale ${status} successfully`);
    } catch (error) {
      console.error("Error updating sale status:", error);
      message.error(`Failed to update sale status: ${error.message}`);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return <Badge status="success" text="Approved" />;
      case 'rejected':
        return <Badge status="error" text="Rejected" />;
      case 'credit':
        return <Badge status="processing" text="Credit" />;
      default:
        return <Badge status="warning" text="Pending" />;
    }
  };

  const isActionDisabled = (recordId, status) => {
    return processingIds.includes(recordId) || status !== 'pending';
  };

  // Function to render products with tooltip
  const renderProducts = (products) => {
    if (!products || products.length === 0) return '-';
    
    // Show first product with count if there are multiple
    if (products.length === 1) {
      return <Tag color="blue">{products[0].name}</Tag>;
    } else {
      return (
        <Tooltip title={
          <div>
            {products.map((product, idx) => (
              <div key={idx}>{product.name} x{product.quantity}</div>
            ))}
          </div>
        }>
          <span>{products[0].name} <Badge count={products.length} size="small" /></span>
        </Tooltip>
      );
    }
  };

  const columns = [
    { 
      title: '#', 
      dataIndex: 'index', 
      key: 'index',
      width: 50,
      align: 'center',
      render: (_, __, index) => ((query.page - 1) * query.limit) + index + 1
    },
    { 
      title: 'Date', 
      dataIndex: 'date', 
      key: 'date',
      responsive: ['md'],
      align: 'center',
      width: 100
    },
    { 
      title: 'Buyer', 
      dataIndex: 'buyerName', 
      key: 'buyerName',
      ellipsis: true,
      align: 'center'
    },
    {
      title: 'Products',
      dataIndex: 'products',
      key: 'products',
      align: 'center',
      render: renderProducts,
      responsive: ['lg'],
      ellipsis: true
    },
    { 
      title: 'Amount', 
      dataIndex: 'totalAmount', 
      key: 'totalAmount', 
      align: 'center', 
      render: formatCurrency 
    },
    { 
      title: 'Payment', 
      dataIndex: 'paymentMode', 
      key: 'paymentMode', 
      align: 'center',
      responsive: ['md'],
      width: 100
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status', 
      align: 'center', 
      render: (status) => getStatusBadge(status)
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Space wrap size="small">
          {record.status === 'pending' ? (
            <>
              <Button 
                type="primary" 
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApproval(record.key, 'approved')}
                disabled={isActionDisabled(record.key, record.status)}
              >
                Approve
              </Button>
              <Button 
                danger 
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleApproval(record.key, 'rejected')}
                disabled={isActionDisabled(record.key, record.status)}
              >
                Reject
              </Button>
              <Button 
                type="dashed" 
                size="small"
                icon={<CreditCardOutlined />}
                onClick={() => handleApproval(record.key, 'credit')}
                disabled={isActionDisabled(record.key, record.status)}
              >
                Credit
              </Button>
            </>
          ) : (
            <Text type="secondary">Processed</Text>
          )}
        </Space>
      ),
      responsive: ['sm']
    },
  ];

  // Mobile action column that appears when screen is extra small
  const mobileActionColumn = {
    title: 'Action',
    key: 'mobileAction',
    align: 'center',
    responsive: ['xs'],
    render: (_, record) => (
      <Flex vertical gap={4} align="center">
        {record.status === 'pending' ? (
          <>
            <Button 
              type="primary" 
              size="small"
              block
              onClick={() => handleApproval(record.key, 'approved')}
              disabled={isActionDisabled(record.key, record.status)}
            >
              Approve
            </Button>
            <Button 
              danger 
              size="small"
              block
              onClick={() => handleApproval(record.key, 'rejected')}
              disabled={isActionDisabled(record.key, record.status)}
            >
              Reject
            </Button>
            <Button 
              type="dashed" 
              size="small"
              block
              onClick={() => handleApproval(record.key, 'credit')}
              disabled={isActionDisabled(record.key, record.status)}
            >
              Credit
            </Button>
          </>
        ) : (
          <Text type="secondary">Processed</Text>
        )}
      </Flex>
    )
  };

  const allColumns = [...columns, mobileActionColumn];

  const tableData = data?.data?.map((sale) => ({
    key: sale._id,
    buyerName: sale.buyerName,
    totalAmount: sale.totalAmount,
    paymentMode: sale.paymentMode,
    date: formatDate(sale.createdAt),
    status: sale.status || 'pending',
    products: sale.products || []
  })) || [];

  const filterOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white rounded-lg shadow min-h-[90vh] flex flex-col">
      <Flex 
        justify="space-between" 
        className="mb-4" 
        wrap="wrap" 
        gap={8}
        align="center"
      >
        <SearchInput 
          setQuery={setQuery} 
          placeholder="Search sales..." 
          style={{ width: '100%', maxWidth: '350px' }}
        />
        
        <Select
          defaultValue="daily"
          size="middle"
          style={{ width: '120px' }}
          onChange={(value) => setQuery((prev) => ({ ...prev, filterBy: value, page: 1 }))}
          options={filterOptions}
          placeholder="Filter"
        />
      </Flex>
      
      <div className="flex-grow overflow-x-auto">
        <Table 
          size="small"
          loading={isFetching}
          columns={allColumns}
          dataSource={tableData}
          pagination={false}
          className="rounded-lg border"
          scroll={{ x: 'max-content' }}
          rowClassName="text-center"
        />
      </div>
      
      <Flex 
        justify="center" 
        className="mt-4 border-t pt-4"
      >
        <Pagination 
          current={query.page}
          onChange={(page, pageSize) => setQuery((prev) => ({ ...prev, page, limit: pageSize }))}
          pageSize={query.limit}
          total={data?.meta?.total || 0}
          showSizeChanger
          responsive
          showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
        />
      </Flex>
    </div>
  );
};

export default SaleManagementPage;