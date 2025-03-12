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
  Collapse
} from 'antd';
import { DownloadOutlined, CalendarOutlined } from '@ant-design/icons';
import { useGetAllExpensesQuery } from '../../redux/features/management/expenseApi';
import { useGetAllSaleQuery } from '../../redux/features/management/saleApi';
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
        profit: sale.profit || 0,
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
    const expensesArray = expensesData?.data?.data;
    
    if (expensesArray && Array.isArray(expensesArray)) {
      const todayExpenses = expensesArray.filter(expense => isToday(expense.date));
      
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
        key: 'productName'
      },
      {
        title: 'Product Price',
        dataIndex: 'productPrice',
        key: 'productPrice',
        render: (value) => formatCurrency(value)
      },
      {
        title: 'Selling Price',
        dataIndex: 'SellingPrice',
        key: 'sellingPrice',
        render: (value) => formatCurrency(value)
      },
      {
        title: 'Quantity',
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
      />
    );
  };

  // Table columns configuration
  const salesColumns = [
    {
      title: 'Buyer Name',
      dataIndex: 'buyer',
      key: 'buyer'
    },
    {
      title: 'Total Items',
      dataIndex: 'totalItems',
      key: 'totalItems',
      sorter: (a, b) => a.totalItems - b.totalItems
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (value) => formatCurrency(value),
      sorter: (a, b) => a.totalAmount - b.totalAmount
    },
    {
      title: 'Payment Mode',
      dataIndex: 'payment',
      key: 'payment'
    },
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => formatTime(value)
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
      title: 'Seller Name',
      dataIndex: 'sellerName',
      key: 'sellerName'
    },
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName'
    },
    {
      title: 'Price (per unit)',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (value) => formatCurrency(value)
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity'
    },
    {
      title: 'Total Price',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (value) => formatCurrency(value),
      sorter: (a, b) => a.totalPrice - b.totalPrice
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time'
    }
  ];

  const expensesColumns = [
    {
      title: 'Date',
      dataIndex: 'formattedDate',
      key: 'formattedDate'
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
      onFilter: (value, record) => record.type === value
    },
    {
      title: 'Description',
      key: 'description',
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
        return formatTime(timestamp);
      }
    }
  ];

  // Combine all today's data for the combined report
  const combinedData = [
    ...todaySalesData,
    ...todayPurchasesData,
    ...todayExpensesData

  ].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));  // Sort by time descending

  return (
    <div className="p-6 bg-white rounded-lg shadow min-h-[90vh] flex flex-col">
      <Flex justify="space-between" align="center" className="mb-6">
        <Title level={2}>Today's Financial Report</Title>
        
        <Button 
          type="primary" 
          icon={<DownloadOutlined />} 
          onClick={exportToExcel}
          disabled={salesLoading || purchasesLoading || expensesLoading}
        >
          Export Complete Report
        </Button>
      </Flex>
      
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Card className="text-center">
          <Statistic 
            title="Today's Sales" 
            value={summaryData.totalSales} 
            formatter={(value) => formatCurrency(value)} 
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
        
        <Card className="text-center">
          <Statistic 
            title="Today's Profit" 
            value={summaryData.totalProfit} 
            formatter={(value) => formatCurrency(value)} 
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
        
        <Card className="text-center">
          <Statistic 
            title="Today's Purchases" 
            value={summaryData.totalPurchases} 
            formatter={(value) => formatCurrency(value)} 
            valueStyle={{ color: '#cf1322' }}
          />
        </Card>
        
        <Card className="text-center">
          <Statistic 
            title="Today's Expenses" 
            value={summaryData.totalExpenses} 
            formatter={(value) => formatCurrency(value)} 
            valueStyle={{ color: '#cf1322' }}
          />
        </Card>
        
        <Card className="text-center">
          <Statistic 
            title="Today's Net Cashflow" 
            value={summaryData.netCashflow} 
            formatter={(value) => formatCurrency(value)} 
            valueStyle={{ color: summaryData.netCashflow >= 0 ? '#3f8600' : '#cf1322' }}
          />
        </Card>
      </div>
      
      {/* Tabs for different reports */}
      <Tabs defaultActiveKey="combined" className="mb-4">
        <TabPane tab="Combined Report" key="combined">
          {salesLoading || purchasesLoading || expensesLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spin size="large" />
            </div>
          ) : combinedData.length === 0 ? (
            <Empty description="No data available for today" />
          ) : (
            <Table 
              columns={combinedColumns} 
              dataSource={combinedData}
              size="small"
              pagination={false}
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
            />
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
            <Table 
              columns={salesColumns} 
              dataSource={todaySalesData} 
              size="small"
              pagination={false}
              expandable={{
                expandedRowRender: expandedRowRender,
                rowExpandable: record => record.products && record.products.length > 0,
              }}
            />
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
            <Table 
              columns={purchasesColumns} 
              dataSource={todayPurchasesData} 
              size="small"
              pagination={false}
            />
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
            <Table 
              columns={expensesColumns} 
              dataSource={todayExpensesData} 
              size="small"
              pagination={false}
            />
          )}
        </TabPane>
      </Tabs>
    </div>
  );
};

// Import Statistic component
const Statistic = ({ title, value, valueStyle, formatter }) => {
  return (
    <div>
      <Text className="text-gray-600">{title}</Text>
      <div className="mt-2">
        <Text strong style={valueStyle}>
          {formatter ? formatter(value) : value}
        </Text>
      </div>
    </div>
  );
};

export default DailyFinancialReport;