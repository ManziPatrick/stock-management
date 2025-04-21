//@ts-nocheck
import { useState, useEffect } from 'react';
import { 
  Table, 
  Typography, 
  Button, 
  DatePicker, 
  Card, 
  Flex, 
  Spin,    
  Empty,
  notification,
  Space,
  Row,
  Col,
  Select,
  Tag
} from 'antd';
import { DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import { useGetAllSaleQuery } from '../../redux/features/management/saleApi';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Statistic component with count and value
const Statistic = ({ title, value, count, valueStyle, formatter }) => {
  return (
    <div>
      <Text className="text-gray-600 text-xs sm:text-sm">{title}</Text>
      <div className="mt-2">
        <Text strong style={valueStyle} className="text-sm sm:text-base">
          {formatter ? formatter(value) : value}
        </Text>
        <div className="mt-1">
          <Text type="secondary" className="text-xs">
            ({count} transactions)
          </Text>
        </div>
      </div>
    </div>
  );
};

const DailyFinancialReport = () => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [salesQuery, setSalesQuery] = useState({
    page: 1,
    limit: 100,
    filterBy: 'daily',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Fetch data from API
  const { 
    data: salesApiResponse, 
    isFetching: salesLoading 
  } = useGetAllSaleQuery(salesQuery);
console.log('Sales API Response:', salesApiResponse);
  // Extract sales data from API response
  const salesData = salesApiResponse?.data || [];
  
  // Processed data states
  const [todaySalesData, setTodaySalesData] = useState([]);
  const [filteredSalesData, setFilteredSalesData] = useState([]);
  
  // Status summary state
  const [statusSummary, setStatusSummary] = useState({
    pending: { count: 0, amount: 0 },
    approved: { count: 0, amount: 0 },
    rejected: { count: 0, amount: 0 },
    credit: { count: 0, amount: 0 }
  });

  const formatCurrency = (value) => {
    return `${Number(value).toLocaleString()} frw`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString();
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    const date = new Date(dateString);
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isInDateRange = (dateString) => {
    if (!dateRange[0] || !dateRange[1] || !dateString) return true;
    const date = new Date(dateString);
    return date >= dateRange[0] && date <= dateRange[1];
  };

  // Process sales data to get today's sales
  useEffect(() => {
    if (salesData && Array.isArray(salesData)) {
      console.log('Sales Data:', salesData);
      const todaySales = salesData.filter(sale => isToday(sale.createdAt));
      console.log('Filtered Sales:', salesData.filter(sale => isInDateRange(sale.createdAt)));
      console.log('Today Sales:', todaySales);
      const processedSales = todaySales.map((sale) => ({
        key: `sale-${sale._id || sale['*id']}`,
        id: sale._id || sale['*id'],
        buyer: sale.buyerName || 'Walk-in Customer',
        totalItems: sale.products?.length || 0,
        totalAmount: sale.totalAmount || 0,
        payment: sale.paymentMode || 'Cash',
        createdAt: sale.createdAt,
        profit: calculateProfit(sale.products) || 0,
        type: 'Sale',
        products: sale.products || [],
        status: sale.status || 'pending'
      }));
      
      setTodaySalesData(processedSales);
      
      // Apply status filter when data loads
      filterSalesByStatus(processedSales, statusFilter);
      
      // Calculate status summary
      calculateStatusSummary(processedSales);
    }
  }, [salesData]);

  // Calculate profit from products
  const calculateProfit = (products) => {
    if (!products || !Array.isArray(products)) return 0;
    
    return products.reduce((total, product) => {
      const sellingPrice = product.SellingPrice || 0;
      const productPrice = product.productPrice || 0;
      const quantity = product.quantity || 0;
      return total + ((sellingPrice - productPrice) * quantity);
    }, 0);
  };

  // Calculate status summary from sales
  const calculateStatusSummary = (sales) => {
    const summary = {
      pending: { count: 0, amount: 0 },
      approved: { count: 0, amount: 0 },
      rejected: { count: 0, amount: 0 },
      credit: { count: 0, amount: 0 }
    };
    
    sales.forEach(sale => {
      const status = sale.status || 'pending';
      if (summary[status]) {
        summary[status].count += 1;
        summary[status].amount += (sale.totalAmount || 0);
      }
    });
    
    setStatusSummary(summary);
  };

  // Filter sales by status
  const filterSalesByStatus = (sales, status) => {
    if (status === 'all') {
      setFilteredSalesData(sales);
    } else {
      setFilteredSalesData(sales.filter(sale => sale.status === status));
    }
  };

  // Handle status filter change
  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    filterSalesByStatus(todaySalesData, value);
  };

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    
    if (salesData && Array.isArray(salesData)) {
      let filteredSales = salesData;
      
      // Filter by date range if selected
      if (dates && dates[0] && dates[1]) {
        filteredSales = filteredSales.filter(sale => {
          if (!sale.createdAt) return false;
          const saleDate = new Date(sale.createdAt);
          return saleDate >= dates[0] && saleDate <= dates[1];
        });
      }
      
      // Process the filtered sales
      const processedSales = filteredSales.map((sale) => ({
        key: `sale-${sale._id || sale['*id']}`,
        id: sale._id || sale['*id'],
        buyer: sale.buyerName || 'Walk-in Customer',
        totalItems: sale.products?.length || 0,
        totalAmount: sale.totalAmount || 0,
        payment: sale.paymentMode || 'Cash',
        createdAt: sale.createdAt,
        profit: calculateProfit(sale.products) || 0,
        type: 'Sale',
        products: sale.products || [],
        status: sale.status || 'pending'
      }));
      
      setTodaySalesData(processedSales);
      filterSalesByStatus(processedSales, statusFilter);
      calculateStatusSummary(processedSales);
    }
  };

  // Export to Excel function focused on sales by status
  const exportToExcel = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Filter data by date range if selected
      const filteredData = dateRange[0] && dateRange[1] 
        ? salesData.filter(sale => isInDateRange(sale.createdAt))
        : salesData;
      
      // Filter by status if not 'all'
      const statusFilteredData = statusFilter !== 'all'
        ? filteredData.filter(sale => sale.status === statusFilter)
        : filteredData;
      
      // Flatten sales data to include product details
      const flattenedSalesData = [];
      statusFilteredData.forEach(sale => {
        if (sale.products && sale.products.length > 0) {
          sale.products.forEach(product => {
            flattenedSalesData.push({
              'Date': formatDate(sale.createdAt),
              'Time': formatTime(sale.createdAt),
              'Buyer': sale.buyerName || 'Walk-in Customer',
              'Product Name': product.productName || 'Unknown',
              'Product Price': product.productPrice || 0,
              'Selling Price': product.SellingPrice || 0,
              'Quantity': product.quantity || 0,
              'Total Amount': sale.totalAmount || 0,
              'Payment Method': sale.paymentMode || 'Cash',
              'Status': sale.status || 'pending'
            });
          });
        } else {
          flattenedSalesData.push({
            'Date': formatDate(sale.createdAt),
            'Time': formatTime(sale.createdAt),
            'Buyer': sale.buyerName || 'Walk-in Customer',
            'Product Name': 'N/A',
            'Product Price': 0,
            'Selling Price': 0,
            'Quantity': 0,
            'Total Amount': sale.totalAmount || 0,
            'Payment Method': sale.paymentMode || 'Cash',
            'Status': sale.status || 'pending'
          });
        }
      });
      
      const salesWs = XLSX.utils.json_to_sheet(flattenedSalesData);
      
      // Create status summary worksheet
      const statusSummaryRows = [
        ['Sales Status Summary Report', dateRange[0] && dateRange[1] ? 
          `${formatDate(dateRange[0])} to ${formatDate(dateRange[1])}` : 
          'All Time'],
        [''],
        ['Status', 'Count', 'Amount (frw)']
      ];
      
      // Calculate summary by status for the filtered data
      const exportStatusSummary = {
        pending: { count: 0, amount: 0 },
        approved: { count: 0, amount: 0 },
        rejected: { count: 0, amount: 0 },
        credit: { count: 0, amount: 0 }
      };
      
      statusFilteredData.forEach(sale => {
        const status = sale.status || 'pending';
        if (exportStatusSummary[status]) {
          exportStatusSummary[status].count += 1;
          exportStatusSummary[status].amount += (sale.totalAmount || 0);
        }
      });
      
      // Add rows for each status
      Object.entries(exportStatusSummary).forEach(([status, data]) => {
        statusSummaryRows.push([status, data.count, data.amount]);
      });
      
      // Add total row
      const totalAmount = Object.values(exportStatusSummary).reduce((sum, data) => sum + data.amount, 0);
      const totalCount = Object.values(exportStatusSummary).reduce((sum, data) => sum + data.count, 0);
      statusSummaryRows.push(['Total', totalCount, totalAmount]);
      
      const statusSummaryWs = XLSX.utils.aoa_to_sheet(statusSummaryRows);
      
      // Add worksheets to workbook
      XLSX.utils.book_append_sheet(wb, statusSummaryWs, 'Status Summary');
      XLSX.utils.book_append_sheet(wb, salesWs, 'Sales Detail');
      
      // Generate filename based on filters
      let fileName = 'Sales_Report';
      
      // Add date range to filename if selected
      if (dateRange[0] && dateRange[1]) {
        fileName = `Sales_Report_${formatDate(dateRange[0])}_to_${formatDate(dateRange[1])}`;
      } else {
        fileName = `Sales_Report_${new Date().toISOString().split('T')[0]}`;
      }
      
      // Add status to filename if filtered
      if (statusFilter !== 'all') {
        fileName += `_${statusFilter}`;
      }
      
      // Write and download
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      
      notification.success({
        message: 'Export Successful',
        description: 'Sales report has been exported to Excel.'
      });
    } catch (error) {
      notification.error({
        message: 'Export Failed',
        description: 'Failed to export data to Excel. Error: ' + (error.message || 'Unknown error')
      });
      console.error('Export error:', error);
    }
  };

  // Get status tag color
  const getStatusTagColor = (status) => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending': return 'blue';
      case 'rejected': return 'red';
      case 'credit': return 'orange';
      default: return 'default';
    }
  };

  // Render expanded row for products details
  const expandedRowRender = (record) => {
    const productColumns = [
      {
        title: 'Product Name',
        dataIndex: 'productName',
        key: 'productName',
        ellipsis: true
      },
      {
        title: 'Product Price',
        dataIndex: 'productPrice',
        key: 'productPrice',
        render: (value) => formatCurrency(value || 0),
        responsive: ['md']
      },
      {
        title: 'Selling Price',
        dataIndex: 'SellingPrice',
        key: 'sellingPrice',
        render: (value) => formatCurrency(value || 0)
      },
      {
        title: 'Qty',
        dataIndex: 'quantity',
        key: 'quantity'
      },
      {
        title: 'Subtotal',
        key: 'subtotal',
        render: (_, record) => formatCurrency((record.SellingPrice || 0) * (record.quantity || 0))
      }
    ];

    return (
      <Table
        columns={productColumns}
        dataSource={(record.products || []).map((product, index) => ({
          ...product,
          key: `${record.id}-product-${index}`
        }))}
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
      />
    );
  };

  // Table columns configuration with responsiveness
  const salesColumns = [
    {
      title: 'Buyer',
      dataIndex: 'buyer',
      key: 'buyer',
      ellipsis: true
    },
    {
      title: 'Items',
      dataIndex: 'totalItems',
      key: 'totalItems',
      sorter: (a, b) => (a.totalItems || 0) - (b.totalItems || 0),
      responsive: ['sm']
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (value) => formatCurrency(value || 0),
      sorter: (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0)
    },
    {
      title: 'Payment',
      dataIndex: 'payment',
      key: 'payment',
      responsive: ['md']
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusTagColor(status)}>
          {(status || 'PENDING').toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Approved', value: 'approved' },
        { text: 'Rejected', value: 'rejected' },
        { text: 'Credit', value: 'credit' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => formatTime(value),
      responsive: ['lg']
    }
  ];

  // Status summary cards
  const renderStatusSummaryCards = () => {
    const cardItems = [
      { title: "Pending Sales", status: "pending", color: '#1890ff' },
      { title: "Approved Sales", status: "approved", color: '#52c41a' },
      { title: "Rejected Sales", status: "rejected", color: '#f5222d' },
      { title: "Credit Sales", status: "credit", color: '#fa8c16' },
      // { title: "Total Sales", status: "total", color: '#722ed1' }
    ];

    const totalAmount = Object.values(statusSummary).reduce((sum, data) => sum + (data.amount || 0), 0);
    const totalCount = Object.values(statusSummary).reduce((sum, data) => sum + (data.count || 0), 0);

    return (
      <Row gutter={[16, 16]}>
        {cardItems.map((item, index) => (
          <Col xs={24} sm={12} md={8} lg={6} xl={4.8} key={index}>
            <Card className="text-center h-full">
              <Statistic 
                title={item.title} 
                value={item.status === 'total' ? totalAmount : statusSummary[item.status]?.amount || 0} 
                count={item.status === 'total' ? totalCount : statusSummary[item.status]?.count || 0}
                formatter={(value) => formatCurrency(value)} 
                valueStyle={{ color: item.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  // Get window width for responsive design
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="p-2 md:p-6 bg-white rounded-lg shadow min-h-[90vh] flex flex-col">
      <Flex 
        vertical={windowWidth < 576} 
        justify="space-between" 
        align={windowWidth < 576 ? "start" : "center"} 
        className="mb-6"
      >
        <Title level={windowWidth < 576 ? 3 : 2} className="mb-4 md:mb-0">Sales Report by Status</Title>
        
        <Space direction={windowWidth < 576 ? "vertical" : "horizontal"} className="w-full sm:w-auto">
          <RangePicker 
            onChange={handleDateRangeChange} 
            placeholder={['Start Date', 'End Date']}
            className="w-full sm:w-auto"
          />
          
          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={exportToExcel}
            disabled={salesLoading}
            size={windowWidth < 576 ? "middle" : "large"}
            className="w-full sm:w-auto"
          >
            Export Report
          </Button>
        </Space>
      </Flex>
      
      {/* Status Filter */}
      <div className="mb-6">
        <Flex align="center" className="mb-2">
          <FilterOutlined className="mr-2" />
          <Text strong>Filter by Status:</Text>
        </Flex>
        <Select 
          value={statusFilter} 
          onChange={handleStatusFilterChange}
          style={{ width: windowWidth < 576 ? '100%' : 200 }}
        >
          <Option value="all">All Statuses</Option>
          <Option value="pending">Pending</Option>
          <Option value="approved">Approved</Option>
          <Option value="rejected">Rejected</Option>
          <Option value="credit">Credit</Option>
        </Select>
      </div>
      
      {/* Status Summary Cards */}
      <div className="mb-6">
        {renderStatusSummaryCards()}
      </div>
      
      {/* Sales Table */}
      <div className="flex-grow">
        <Card title="Sales Details" bordered={false}>
          {salesLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spin size="large" />
            </div>
          ) : filteredSalesData.length === 0 ? (
            <Empty description={`No ${statusFilter !== 'all' ? statusFilter : ''} sales data available for today`} />
          ) : (
            <div className="overflow-x-auto">
              <Table 
                columns={salesColumns} 
                dataSource={filteredSalesData} 
                size="small"
                pagination={{ 
                  responsive: true,
                  pageSize: windowWidth < 768 ? 5 : 10,
                  showSizeChanger: windowWidth >= 768
                }}
                expandable={{
                  expandedRowRender: expandedRowRender,
                  rowExpandable: record => record.products && record.products.length > 0,
                }}
                scroll={{ x: 'max-content' }}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}><strong>Total</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <Text strong>{formatCurrency(filteredSalesData.reduce((sum, item) => sum + (item.totalAmount || 0), 0))}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} colSpan={3}></Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DailyFinancialReport;