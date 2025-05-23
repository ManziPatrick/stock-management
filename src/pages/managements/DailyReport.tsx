//@ts-nocheck
import { useState, useEffect } from 'react';
import { 
  Table, 
  Typography, 
  Button, 
  DatePicker, 
  Tabs, 
  Card, 
  Flex, 
  Spin,    
  Empty,
  notification,
  Collapse,
  Space,
  Row,
  Col
} from 'antd';
import { DownloadOutlined, CalendarOutlined } from '@ant-design/icons';
import { useGetAllExpensesQuery } from '../../redux/features/management/expenseApi';
import { useGetAllSaleQuery,useDailySaleQuery } from '../../redux/features/management/saleApi';
import { useGetAllPurchasesQuery } from '../../redux/features/management/purchaseApi';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const DailyFinancialReport = () => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [salesQuery, setSalesQuery] = useState({
    page: 1,
    limit: 100,
    filterBy: 'daily',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const { data: DailySale, isLoading: isLoadingSales } = useDailySaleQuery({});
  console.log("daily data",DailySale.data?.[0].netProfit)
  const [purchasesQuery, setPurchasesQuery] = useState({
    page: 1,
    limit: 100
  });
  
  const [expensesQuery, setExpensesQuery] = useState({
    page: 1,
    limit: 100
  });

  // Fetch data from all APIs
  const { 
    data: salesData, 
    isFetching: salesLoading 
  } = useGetAllSaleQuery(salesQuery);
  
  const { 
    data: purchasesData, 
    isFetching: purchasesLoading 
  } = useGetAllPurchasesQuery(purchasesQuery);
  
  const { 
    data: expensesData, 
    isFetching: expensesLoading 
  } = useGetAllExpensesQuery(expensesQuery);
  console.log("expensesData",expensesData)

  // Processed data states
  const [todaySalesData, setTodaySalesData] = useState([]);
  const [todayPurchasesData, setTodayPurchasesData] = useState([]);
  const [todayExpensesData, setTodayExpensesData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalSales: 0,
    totalProfit: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    netCashflow: 0
  });

  const formatCurrency = (value) => {
    return `${Number(value).toLocaleString()} frw`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const isToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Process sales data to get today's sales
  useEffect(() => {
    if (salesData && salesData.data && Array.isArray(salesData.data)) {
      const todaySales = salesData.data.filter(sale => isToday(sale.createdAt));
      
      const processedSales = todaySales.map((sale, index) => ({
        key: `sale-${sale._id}`,
        id: sale._id,
        buyer: sale.buyerName || 'Walk-in Customer',
        totalItems: sale.products?.length || 0,
        totalAmount: sale.totalAmount,
        payment: sale.paymentMode || 'Cash',
        createdAt: sale.createdAt,
        profit: DailySale.data?.[0].netProfit|| 0,
        type: 'Sale',
        products: sale.products || []  // Add products array
      }));
      
      setTodaySalesData(processedSales);
    }
  }, [salesData]);

  // Process purchases data to get today's purchases
  useEffect(() => {
    if (purchasesData && purchasesData.data && Array.isArray(purchasesData.data)) {
      const todayPurchases = purchasesData.data.filter(purchase => isToday(purchase.createdAt));
      
      const processedPurchases = todayPurchases.map((purchase, index) => ({
        key: `purchase-${purchase._id}`,
        sellerName: purchase.sellerName || 'Unknown Seller',
        productName: purchase.productName || 'Unknown Product',
        unitPrice: purchase.unitPrice || 0,
        quantity: purchase.quantity || 0,
        totalPrice: purchase.totalPrice || 0,
        createdAt: purchase.createdAt,
        time: formatTime(purchase.createdAt),
        type: 'Purchase'
      }));
      
      setTodayPurchasesData(processedPurchases);
    }
  }, [purchasesData]);

  // Process expenses data to get today's expenses
  useEffect(() => {
    // Check for the nested data structure based on the provided response example
    const expensesArray = expensesData?.data;
    console.log("expensesArray2",expensesArray)
    if (expensesArray && Array.isArray(expensesArray)) {

      const todayExpenses = expensesArray.filter(expense => isToday(expense.date));
      console.log("todayExpenses",todayExpenses)
      const processedExpenses = todayExpenses.map((expense, index) => ({
        key: `expense-${expense._id}`,
        title: expense.title || 'Unknown Expense',
        description: expense.description || 'No description',
        amount: expense.amount || 0,
        date: expense.date,
        createdAt: expense.createdAt,
        formattedDate: formatDate(expense.date),
        type: 'Expense'
      }));
      
      setTodayExpensesData(processedExpenses);
    }
  }, [expensesData]);
  console.log("todayExpensesData",todayExpensesData)

  // Calculate summary for today's data
  useEffect(() => {
    const totalSales = todaySalesData.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalProfit = todaySalesData.reduce((sum, item) => sum + item.profit, 0);
    const totalPurchases = todayPurchasesData.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalExpenses = todayExpensesData.reduce((sum, item) => sum + item.amount, 0);
    
    setSummaryData({
      totalSales,
      totalProfit,
      totalPurchases,
      totalExpenses,
      netCashflow: totalSales - totalPurchases - totalExpenses
    });
  }, [todaySalesData, todayPurchasesData, todayExpensesData]);

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  // Enhanced export to Excel function to export all data
  const exportToExcel = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Create sales worksheet with all sales data, not just today's
      const allSalesData = salesData?.data || [];
      
      // Flatten sales data to include product details
      const flattenedSalesData = [];
      allSalesData.forEach(sale => {
        if (sale.products && sale.products.length > 0) {
          sale.products.forEach(product => {
            flattenedSalesData.push({
              'Date': formatDate(sale.createdAt),
              'Time': formatTime(sale.createdAt),
              'Buyer': sale.buyerName || 'Walk-in Customer',
              'Product Name': product.productName,
              'Product Price': product.productPrice,
              'Selling Price': product.SellingPrice,
              'Quantity': product.quantity,
              'Total Amount': sale.totalAmount,
              'Payment Method': sale.paymentMode || 'Cash',
              'Profit': sale.profit || 0
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
            'Total Amount': sale.totalAmount,
            'Payment Method': sale.paymentMode || 'Cash',
            'Profit': sale.profit || 0
          });
        }
      });
      
      const salesWs = XLSX.utils.json_to_sheet(flattenedSalesData);
      
      // Create purchases worksheet with all purchases data
      const allPurchasesData = purchasesData?.data || [];
      const purchasesWs = XLSX.utils.json_to_sheet(allPurchasesData.map(purchase => ({
        'Date': formatDate(purchase.createdAt),
        'Time': formatTime(purchase.createdAt),
        'Seller Name': purchase.sellerName || 'Unknown Seller',
        'Product Name': purchase.productName || 'Unknown Product',
        'Price (per unit)': purchase.unitPrice || 0,
        'Quantity': purchase.quantity || 0,
        'Total Price': purchase.totalPrice || 0
      })));
      
      // Create expenses worksheet with all expenses data
      const allExpensesData = expensesData?.data?.data || [];
      const expensesWs = XLSX.utils.json_to_sheet(allExpensesData.map(expense => ({
        'Date': formatDate(expense.date),
        'Time': formatTime(expense.date),
        'Title': expense.title || 'Unknown Expense',
        'Description': expense.description || 'No description',
        'Amount': expense.amount || 0
      })));
      
      // Create summary worksheet
      const summaryRows = [
        ['Financial Summary Report', new Date().toLocaleDateString()],
        [''],
        ['', 'Amount (frw)'],
        ['Total Sales', allSalesData.reduce((sum, item) => sum + (item.totalAmount || 0), 0)],
        ['Total Profit', allSalesData.reduce((sum, item) => sum + (item.profit || 0), 0)],
        ['Total Purchases', allPurchasesData.reduce((sum, item) => sum + (item.totalPrice || 0), 0)],
        ['Total Expenses', allExpensesData.reduce((sum, item) => sum + (item.amount || 0), 0)],
        ['Net Cashflow', 
          allSalesData.reduce((sum, item) => sum + (item.totalAmount || 0), 0) - 
          allPurchasesData.reduce((sum, item) => sum + (item.totalPrice || 0), 0) - 
          allExpensesData.reduce((sum, item) => sum + (item.amount || 0), 0)
        ]
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
      
      // Add worksheets to workbook
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      XLSX.utils.book_append_sheet(wb, salesWs, 'Sales');
      XLSX.utils.book_append_sheet(wb, purchasesWs, 'Purchases');
      XLSX.utils.book_append_sheet(wb, expensesWs, 'Expenses');
      
      // Generate today's date for filename
      const today = new Date().toISOString().split('T')[0];
      
      // Write and download
      XLSX.writeFile(wb, `Complete_Financial_Report_${today}.xlsx`);
      
      notification.success({
        message: 'Export Successful',
        description: 'Complete financial report has been exported to Excel.'
      });
    } catch (error) {
      notification.error({
        message: 'Export Failed',
        description: 'Failed to export data to Excel. Error: ' + error.message
      });
      console.error('Export error:', error);
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
        render: (value) => formatCurrency(value),
        responsive: ['md']
      },
      {
        title: 'Selling Price',
        dataIndex: 'SellingPrice',
        key: 'sellingPrice',
        render: (value) => formatCurrency(value)
      },
      {
        title: 'Qty',
        dataIndex: 'quantity',
        key: 'quantity'
      },
      {
        title: 'Subtotal',
        key: 'subtotal',
        render: (_, record) => formatCurrency(record.SellingPrice * record.quantity)
      }
    ];

    return (
      <Table
        columns={productColumns}
        dataSource={record.products.map((product, index) => ({
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
      sorter: (a, b) => a.totalItems - b.totalItems,
      responsive: ['sm']
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (value) => formatCurrency(value),
      sorter: (a, b) => a.totalAmount - b.totalAmount
    },
    {
      title: 'Payment',
      dataIndex: 'payment',
      key: 'payment',
      responsive: ['md']
    },
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => formatTime(value),
      responsive: ['lg']
    },
    {
      title: 'Profit',
      dataIndex: 'profit',
      key: 'profit',
      render: (value) => formatCurrency(value),
      sorter: (a, b) => a.profit - b.profit
    }
  ];

  const purchasesColumns = [
    {
      title: 'Seller',
      dataIndex: 'sellerName',
      key: 'sellerName',
      ellipsis: true,
      responsive: ['md']
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      ellipsis: true
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (value) => formatCurrency(value),
      responsive: ['lg']
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity'
    },
    {
      title: 'Total',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (value) => formatCurrency(value),
      sorter: (a, b) => a.totalPrice - b.totalPrice
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      responsive: ['xl']
    }
  ];

  const expensesColumns = [
    {
      title: 'Date',
      dataIndex: 'formattedDate',
      key: 'formattedDate',
      responsive: ['md']
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      responsive: ['lg']
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (value) => formatCurrency(value),
      sorter: (a, b) => a.amount - b.amount
    }
  ];

  const combinedColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: 'Sale', value: 'Sale' },
        { text: 'Purchase', value: 'Purchase' },
        { text: 'Expense', value: 'Expense' }
      ],
      onFilter: (value, record) => record.type === value,
      responsive: ['sm']
    },
    {
      title: 'Description',
      key: 'description',
      ellipsis: true,
      render: (text, record) => {
        if (record.type === 'Sale') {
          return `${record.buyer} - ${record.totalItems} items`;
        } else if (record.type === 'Purchase') {
          return `${record.productName} from ${record.sellerName}`;
        } else {
          return record.title;
        }
      }
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (text, record) => {
        if (record.type === 'Sale') {
          return formatCurrency(record.totalAmount);
        } else if (record.type === 'Purchase') {
          return formatCurrency(record.totalPrice);
        } else {
          return formatCurrency(record.amount);
        }
      },
      sorter: (a, b) => {
        const aAmount = a.type === 'Sale' ? a.totalAmount : (a.type === 'Purchase' ? a.totalPrice : a.amount);
        const bAmount = b.type === 'Sale' ? b.totalAmount : (b.type === 'Purchase' ? b.totalPrice : b.amount);
        return aAmount - bAmount;
      }
    },
    {
      title: 'Time',
      key: 'time',
      render: (text, record) => {
        const timestamp = record.type === 'Expense' ? record.date : record.createdAt;
        console.log("timestamp",timestamp)
        return formatTime(timestamp);
      },
      responsive: ['md']
    }
  ];

  // Combine all today's data for the combined report
  const combinedData = [
    ...todaySalesData,
    ...todayPurchasesData,
    ...todayExpensesData
  ].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));  // Sort by time descending

  // Handle mobile summary display
  const renderSummaryCards = () => {
    const cardItems = [
      { title: "Today's Sales", value: summaryData.totalSales, color: '#3f8600' },
      { title: "Today's Profit", value: summaryData.totalProfit, color: '#3f8600' },
      { title: "Today's Purchases", value: summaryData.totalPurchases, color: '#cf1322' },
      { title: "Today's Expenses", value: summaryData.totalExpenses, color: '#cf1322' },
      // { title: "Today's Net Cashflow", value: summaryData.netCashflow, color: summaryData.netCashflow >= 0 ? '#3f8600' : '#cf1322' }
    ];

    return (
      <Row gutter={[16, 16]}>
        {cardItems.map((item, index) => (
          <Col xs={24} sm={12} md={8} lg={6} xl={4.8} key={index}>
            <Card className="text-center h-full">
              <Statistic 
                title={item.title} 
                value={item.value} 
                formatter={(value) => formatCurrency(value)} 
                valueStyle={{ color: item.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div className="p-2 md:p-6 bg-white rounded-lg shadow min-h-[90vh] flex flex-col">
      <Flex 
        vertical={window.innerWidth < 576} 
        justify="space-between" 
        align={window.innerWidth < 576 ? "start" : "center"} 
        className="mb-6"
      >
        <Title level={window.innerWidth < 576 ? 3 : 2} className="mb-4 md:mb-0">Today's Financial Report</Title>
        
        <Button 
          type="primary" 
          icon={<DownloadOutlined />} 
          onClick={exportToExcel}
          disabled={salesLoading || purchasesLoading || expensesLoading}
          size={window.innerWidth < 576 ? "middle" : "large"}
          className="w-full sm:w-auto"
        >
          Export Report
        </Button>
      </Flex>
      
      {/* Financial Summary Cards - Responsive Grid */}
      <div className="mb-6">
        {renderSummaryCards()}
      </div>
      
      {/* Tabs for different reports */}
      <Tabs 
        defaultActiveKey="combined" 
        className="mb-4"
        size={window.innerWidth < 576 ? "small" : "middle"}
        tabPosition={window.innerWidth < 576 ? "top" : "top"}
      >
        <TabPane tab="Combined" key="combined">
          {salesLoading || purchasesLoading || expensesLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spin size="large" />
            </div>
          ) : combinedData.length === 0 ? (
            <Empty description="No data available for today" />
          ) : (
            <div className="overflow-x-auto">
              <Table 
                columns={combinedColumns} 
                dataSource={combinedData}
                size="small"
                pagination={{ 
                  responsive: true,
                  pageSize: window.innerWidth < 768 ? 5 : 10,
                  showSizeChanger: window.innerWidth >= 768
                }}
                rowClassName={(record) => {
                  if (record.type === 'Sale') return 'bg-green-50';
                  if (record.type === 'Purchase') return 'bg-blue-50';
                  if (record.type === 'Expense') return 'bg-red-50';
                  return '';
                }}
                expandable={{
                  expandedRowRender: record => record.type === 'Sale' ? expandedRowRender(record) : null,
                  rowExpandable: record => record.type === 'Sale' && record.products && record.products.length > 0,
                }}
                scroll={{ x: 'max-content' }}
              />
            </div>
          )}
        </TabPane>
        
        <TabPane tab="Sales" key="sales">
          {salesLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spin size="large" />
            </div>
          ) : todaySalesData.length === 0 ? (
            <Empty description="No sales data available for today" />
          ) : (
            <div className="overflow-x-auto">
              <Table 
                columns={salesColumns} 
                dataSource={todaySalesData} 
                size="small"
                pagination={{ 
                  responsive: true,
                  pageSize: window.innerWidth < 768 ? 5 : 10,
                  showSizeChanger: window.innerWidth >= 768
                }}
                expandable={{
                  expandedRowRender: expandedRowRender,
                  rowExpandable: record => record.products && record.products.length > 0,
                }}
                scroll={{ x: 'max-content' }}
              />
            </div>
          )}
        </TabPane>
        
        <TabPane tab="Purchases" key="purchases">
          {purchasesLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spin size="large" />
            </div>
          ) : todayPurchasesData.length === 0 ? (
            <Empty description="No purchases data available for today" />
          ) : (
            <div className="overflow-x-auto">
              <Table 
                columns={purchasesColumns} 
                dataSource={todayPurchasesData} 
                size="small"
                pagination={{ 
                  responsive: true,
                  pageSize: window.innerWidth < 768 ? 5 : 10,
                  showSizeChanger: window.innerWidth >= 768
                }}
                scroll={{ x: 'max-content' }}
              />
            </div>
          )}
        </TabPane>
        
        <TabPane tab="Expenses" key="expenses">
          {expensesLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spin size="large" />
            </div>
          ) : todayExpensesData.length === 0 ? (
            <Empty description="No expenses data available for today" />
          ) : (
            <div className="overflow-x-auto">
              <Table 
                columns={expensesColumns} 
                dataSource={todayExpensesData} 
                size="small"
                pagination={{ 
                  responsive: true,
                  pageSize: window.innerWidth < 768 ? 5 : 10,
                  showSizeChanger: window.innerWidth >= 768
                }}
                scroll={{ x: 'max-content' }}
              />
            </div>
          )}
        </TabPane>
      </Tabs>
      
      {/* Mobile Summary Collapse - shown only on xs screens */}
      <div className="block md:hidden mt-4">
        <Collapse>
          <Panel header="View Financial Summary" key="1">
            <Space direction="vertical" className="w-full">
              {Object.entries(summaryData).map(([key, value], index) => {
                const formattedKey = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase());
                
                const isPositive = key === 'netCashflow' ? value >= 0 : 
                  ['totalSales', 'totalProfit'].includes(key);
                
                return (
                  <Flex key={index} justify="space-between" align="center">
                    <Text>{`Today's ${formattedKey}`}:</Text>
                    <Text strong style={{ color: isPositive ? '#3f8600' : '#cf1322' }}>
                      {formatCurrency(value)}
                    </Text>
                  </Flex>
                );
              })}
            </Space>
          </Panel>
        </Collapse>
      </div>
    </div>
  );
};

// Import Statistic component
const Statistic = ({ title, value, valueStyle, formatter }) => {
  return (
    <div>
      <Text className="text-gray-600 text-xs sm:text-sm">{title}</Text>
      <div className="mt-2">
        <Text strong style={valueStyle} className="text-sm sm:text-base">
          {formatter ? formatter(value) : value}
        </Text>
      </div>
    </div>
  );
};

export default DailyFinancialReport;