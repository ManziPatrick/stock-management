import React, { useState } from 'react';
import { 
  Button, 
  Flex, 
  Modal, 
  Pagination, 
  Table, 
  Typography, 
  Select, 
  Tag, 
  Space, 
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  PrinterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  PauseOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;
const { Option } = Select;

import {
  useGetAllSalecollectionQuery,
  useUpdateSaleStatusMutation,
  useMarkProductsCollectedMutation
} from '../../redux/features/management/saleApi';

// Interfaces
interface IProduct {
  product: string;
  productName: string;
  productPrice: number;
  SellingPrice: number;
  quantity: number;
  _id: string;
  inventoryReserved?: boolean;
}

interface ISaleData {
  _id: string;
  buyerName: string;
  date: string;
  paymentMode: 'cash' | 'momo' | 'cheque' | 'transfer';
  products: IProduct[];
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'credit';
  inventoryStatus: 'reserved' | 'deducted' | 'released';
  isProductsCollected: boolean;
  createdAt: string;
}

interface ITableSaleData extends ISaleData {
  key: string;
  totalQuantity: number;
}

const SaleManagementPage = () => {
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    filterBy: 'daily',
    status: '',
    inventoryStatus: '',
    collectionStatus: ''
  });

  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const { data, isFetching } = useGetAllSalecollectionQuery(query);
  const [updateSaleStatus] = useUpdateSaleStatusMutation();
  const [markProductsCollected] = useMarkProductsCollectedMutation();

  const formatDate = (date: string): string => {
    return new Date(date).toISOString().split('T')[0];
  };

  const calculateSaleStats = (products: IProduct[]) => {
    return products.reduce(
      (acc, product) => {
        const quantity = Number(product.quantity) || 0;
        acc.totalQuantity += quantity;
        return acc;
      },
      { totalQuantity: 0 }
    );
  };

  const handleStatusUpdate = async (saleId: string, newStatus: string) => {
    try {
      await updateSaleStatus({ saleId, status: newStatus }).unwrap();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleCollectionToggle = async (saleId: string, collected: boolean) => {
    try {
      await markProductsCollected({ saleId, collected }).unwrap();
    } catch (error) {
      console.error('Failed to update collection status:', error);
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'orange', icon: <ClockCircleOutlined /> },
      approved: { color: 'green', icon: <CheckCircleOutlined /> },
      rejected: { color: 'red', icon: <CloseCircleOutlined /> },
      credit: { color: 'blue', icon: <ShoppingCartOutlined /> }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Tag color={config.color} icon={config.icon}>
        {status.toUpperCase()}
      </Tag>
    );
  };

  const getInventoryStatusTag = (inventoryStatus: string, isCollected: boolean) => {
    if (inventoryStatus === 'deducted' && isCollected) {
      return <Tag color="success" icon={<PauseOutlined />}>OUT & DELIVERED</Tag>;
    }
    if (inventoryStatus === 'deducted' && !isCollected) {
      return <Tag color="warning" icon={<PauseOutlined />}>IN & RESERVED</Tag>;
    }
    if (inventoryStatus === 'reserved') {
      return <Tag color="processing" icon={<PauseOutlined />}>RESERVED</Tag>;
    }
    if (inventoryStatus === 'released') {
      return <Tag color="default" icon={<PauseOutlined />}>RELEASED</Tag>;
    }
    return <Tag>{inventoryStatus}</Tag>;
  };

  const onChange = (page: number, pageSize?: number) => {
    setQuery((prev) => ({ ...prev, page, limit: pageSize || prev.limit }));
  };

  const handleFilterChange = (field: string, value: string) => {
    setQuery((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  // FIXED: Handle both data structures - with fallback for missing data
  const tableData: ITableSaleData[] = (data?.data || []).map((sale: ISaleData) => {
    const stats = calculateSaleStats(sale.products || []);
    
    return {
      ...sale,
      key: sale._id,
      totalQuantity: stats.totalQuantity,
      date: formatDate(sale.createdAt),
      products: sale.products || [] // Ensure products is always an array
    };
  });

  // FIXED: Calculate summary statistics with fallback for missing API stats
// FIXED: Calculate summary statistics with fallback for missing API stats
const apiStats = data?.meta?.totalSales?.stats;

let summaryStats;
if (apiStats) {
  // Use API-provided stats if available
  summaryStats = {
    totalItems: apiStats.totalCount || 0,
    outAndDelivered: apiStats.outAndDelivered || 0,
    inAndReserved: apiStats.inAndReserved || 0,
    pending: apiStats.pending || 0,
    reserved: apiStats.reserved || 0
  };
} else {
  // FIXED: Single calculation when API doesn't provide stats
  summaryStats = tableData.reduce(
    (acc, sale) => {
      acc.totalItems += sale.totalQuantity;
      
      if (sale.inventoryStatus === 'deducted' && sale.isProductsCollected) {
        acc.outAndDelivered += sale.totalQuantity;
      }
      if (sale.inventoryStatus === 'deducted' && !sale.isProductsCollected) {
        acc.inAndReserved += sale.totalQuantity;
      }
      if (sale.status === 'pending') {
        acc.pending += sale.totalQuantity;
      }
      if (sale.inventoryStatus === 'reserved') {
        acc.reserved += sale.totalQuantity;
      }
      
      return acc;
    },
    { totalItems: 0, outAndDelivered: 0, inAndReserved: 0, pending: 0, reserved: 0 }
  );
}

// REMOVED: The duplicate forEach loop that was causing double counting

  

  const expandedRowRender = (record: ITableSaleData) => {
    const columns = [
      { title: 'Product', dataIndex: 'productName' },
      { title: 'Quantity', dataIndex: 'quantity', align: 'center' as const },
      {
        title: 'Status',
        render: (_: any, product: IProduct) => (
          <Tag color={product.inventoryReserved ? 'orange' : 'green'}>
            {product.inventoryReserved ? 'Reserved' : 'Available'}
          </Tag>
        ),
      },
    ];

    return <Table 
      columns={columns} 
      dataSource={record.products || []} 
      pagination={false} 
      size="small"
    />;
  };

  const columns = [
    {
      title: 'Date',
      key: 'date',
      dataIndex: 'date',
      width: '100px',
    },
    {
      title: 'Buyer',
      key: 'buyerName',
      dataIndex: 'buyerName',
      width: '120px',
    },
    {
      title: 'Items',
      key: 'totalQuantity',
      dataIndex: 'totalQuantity',
      align: 'center' as const,
      width: '60px',
    },
    {
      title: 'Payment',
      key: 'paymentMode',
      dataIndex: 'paymentMode',
      align: 'center' as const,
      width: '80px',
      render: (mode: string) => mode?.toUpperCase() || 'N/A',
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      align: 'center' as const,
      width: '100px',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Inventory',
      key: 'inventoryStatus',
      align: 'center' as const,
      width: '120px',
      render: (_: any, record: ITableSaleData) => 
        getInventoryStatusTag(record.inventoryStatus, record.isProductsCollected),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center' as const,
      width: '200px',
      render: (_: any, record: ITableSaleData) => (
        <Space size="small" wrap>
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="Approve this sale?"
                description="This will confirm the sale and deduct inventory."
                onConfirm={() => handleStatusUpdate(record._id, 'approved')}
              >
                <Button size="small" type="primary" icon={<CheckCircleOutlined />}>
                  Approve
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Reject this sale?"
                description="This will cancel the sale and restore inventory."
                onConfirm={() => handleStatusUpdate(record._id, 'rejected')}
              >
                <Button size="small" danger icon={<CloseCircleOutlined />}>
                  Reject
                </Button>
              </Popconfirm>
            </>
          )}
          
          {(record.status === 'approved' || record.status === 'credit') && record.inventoryStatus === 'deducted' && (
            <Popconfirm
              title={`Mark as ${record.isProductsCollected ? 'not delivered' : 'delivered'}?`}
              onConfirm={() => handleCollectionToggle(record._id, !record.isProductsCollected)}
            >
              <Button 
                size="small" 
                type={record.isProductsCollected ? "default" : "primary"}
                icon={<PauseOutlined />}
              >
                {record.isProductsCollected ? 'Mark In' : 'Mark Out'}
              </Button>
            </Popconfirm>
          )}
          
          <Button 
            size="small" 
            icon={<PrinterOutlined />}
            onClick={() => {
              setSelectedSale(record);
              setIsReceiptModalOpen(true);
            }}
          >
            Receipt
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Summary Cards */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Items"
              value={summaryStats.totalItems}
              valueStyle={{ color: '#3f8600' }}
              suffix="items"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Out & Delivered"
              value={summaryStats.outAndDelivered}
              valueStyle={{ color: '#52c41a' }}
              suffix="items"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="In & Reserved"
              value={summaryStats.inAndReserved}
              valueStyle={{ color: '#faad14' }}
              suffix="items"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending"
              value={summaryStats.pending}
              valueStyle={{ color: '#1890ff' }}
              suffix="items"
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Card */}
      <Card className="shadow-sm">
        <div className="mb-4">
          <Title level={4} className="mb-4">Sale Management</Title>
          
          {/* Filters */}
          <Row gutter={16} className="mb-4">
            <Col span={6}>
              <Select
                placeholder="Filter by Status"
                style={{ width: '100%' }}
                allowClear
                onChange={(value) => handleFilterChange('status', value || '')}
              >
                <Option value="pending">Pending</Option>
                <Option value="approved">Approved</Option>
                <Option value="rejected">Rejected</Option>
                <Option value="credit">Credit</Option>
              </Select>
            </Col>
            
            <Col span={6}>
              <Select
                placeholder="Filter by Inventory Status"
                style={{ width: '100%' }}
                allowClear
                onChange={(value) => handleFilterChange('inventoryStatus', value || '')}
              >
                <Option value="reserved">Reserved</Option>
                <Option value="deducted">Deducted</Option>
                <Option value="released">Released</Option>
              </Select>
            </Col>
            
            <Col span={6}>
              <Select
                placeholder="Filter by Collection"
                style={{ width: '100%' }}
                allowClear
                onChange={(value) => handleFilterChange('collectionStatus', value || '')}
              >
                <Option value="true">Products Delivered (Out)</Option>
                <Option value="false">Products Not Delivered (In)</Option>
              </Select>
            </Col>
            
            <Col span={6}>
              <Select
                defaultValue="daily"
                style={{ width: '100%' }}
                onChange={(value) => handleFilterChange('filterBy', value)}
              >
                <Option value="daily">Daily Sales</Option>
                <Option value="monthly">Monthly Sales</Option>
                <Option value="yearly">Yearly Sales</Option>
              </Select>
            </Col>
          </Row>
        </div>

        {/* Table */}
        <Table
          size="small"
          loading={isFetching}
          columns={columns}
          dataSource={tableData}
          expandable={{
            expandedRowRender,
            expandRowByClick: true,
          }}
          pagination={false}
          className="rounded-lg border"
          scroll={{ x: 1000 }}
        />

        {/* Pagination */}
        <div className="mt-4 flex justify-end">
          <Pagination
            current={query.page}
            onChange={onChange}
            pageSize={query.limit}
            total={data?.meta?.total || 0}
            showSizeChanger={true}
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
            }
          />
        </div>
      </Card>

      {/* Receipt Modal */}
      <Modal
        open={isReceiptModalOpen}
        onCancel={() => {
          setIsReceiptModalOpen(false);
          setSelectedSale(null);
        }}
        footer={null}
        width={600}
        centered
        title="Sale Receipt"
      >
        {selectedSale && (
          <div className="p-4">
            <div className="text-center mb-4">
              <Title level={3}>SALE RECEIPT</Title>
              <Text>Transaction ID: {selectedSale._id}</Text>
            </div>
            
            <div className="mb-4">
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Buyer: </Text>
                  <Text>{selectedSale.buyerName}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Date: </Text>
                  <Text>{selectedSale.date}</Text>
                </Col>
              </Row>
              <Row gutter={16} className="mt-2">
                <Col span={12}>
                  <Text strong>Payment Mode: </Text>
                  <Text>{selectedSale.paymentMode?.toUpperCase() || 'N/A'}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Status: </Text>
                  {getStatusTag(selectedSale.status)}
                </Col>
              </Row>
            </div>

            <Table
              size="small"
              dataSource={selectedSale.products || []}
              columns={[
                { title: 'Item', dataIndex: 'productName' },
                { title: 'Qty', dataIndex: 'quantity', align: 'center' },
                {
                  title: 'Status',
                  render: (_: any, product: IProduct) => (
                    <Tag color={product.inventoryReserved ? 'orange' : 'green'}>
                      {product.inventoryReserved ? 'Reserved' : 'Available'}
                    </Tag>
                  ),
                }
              ]}
              pagination={false}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <Text strong>Total Items</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="center">
                      <Text strong>
                        {(selectedSale.products || []).reduce((sum: number, product: IProduct) => 
                          sum + (product.quantity || 0), 0
                        )}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
            
            <div className="mt-4 text-center">
              <Text type="secondary">Thank you for your business!</Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SaleManagementPage;