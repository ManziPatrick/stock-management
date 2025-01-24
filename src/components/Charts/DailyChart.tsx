import React, { useState } from 'react';
import { Select, Card, Statistic, Spin, Row, Col } from 'antd';
import {
  AreaChart, BarChart, LineChart, PieChart, ComposedChart,
  CartesianGrid, Tooltip, XAxis, YAxis, Legend, Area, Bar, Line, Pie, Cell,
  ResponsiveContainer,
  
} from 'recharts';
import { useGetAllSaleQuery } from '../../redux/features/management/saleApi';
import { useGetAllExpensesQuery } from '../../redux/features/management/expenseApi';
import { useGetAllPurchasesQuery } from '../../redux/features/management/purchaseApi';

const { Option } = Select;

const DailyChart = () => {
  const [chartType, setChartType] = useState('area');
  const { data: salesData, isLoading: isLoadingSales } = useGetAllSaleQuery({});
  const { data: expensesData, isLoading: isLoadingExpenses } = useGetAllExpensesQuery({});
  const { data: purchaseData, isLoading: isLoadingPurchases } = useGetAllPurchasesQuery({});

  // Get today's date
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  // Extract data for today
  const dailyTotalSellingPrices = salesData?.data?.meta?.totalSales?.dailyStats?.find(
    (stat) =>
      stat._id.year === todayYear &&
      stat._id.month === todayMonth &&
      stat._id.day === todayDay
  );
  const dailyTotalProfit = dailyTotalSellingPrices?.profit || 0;
  const dailyTotalSellingPrice = dailyTotalSellingPrices?.dailyTotalSellingPrice || 0;

  const dailyExpenses = expensesData?.data?.meta?.totalExpenses?.dailyStats?.find(
    (stat) =>
      stat._id.year === todayYear &&
      stat._id.month === todayMonth &&
      stat._id.day === todayDay
  );
  const TotalExpense = dailyExpenses?.dailyTotal || 0;

  const todayPurchaseData = purchaseData?.meta?.totalPurchasedAmount?.dailyStats?.find(
    (stat) =>
      stat._id.year === todayYear &&
      stat._id.month === todayMonth &&
      stat._id.day === todayDay
  );
  const DailyTotalPurchases = todayPurchaseData?.dailyTotal || 0;

  // Prepare data for charts using DailySummary values
  const chartData = [
    {
      name: 'Today',
      revenue: dailyTotalSellingPrice,
      profit: dailyTotalProfit - TotalExpense,
      expense: TotalExpense,
      potentialRevenue: DailyTotalPurchases,
    }
  ];

  // Conditional rendering for loading and error states
  if (isLoadingSales || isLoadingExpenses || isLoadingPurchases) {
    return (
      <div style={{ textAlign: 'center' }}>
        <Spin size="large" />
        <p>Loading data...</p>
      </div>
    );
  }

  // Chart Rendering Functions
  const renderAreaChart = () => (
    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 4, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => value.toLocaleString()} />
      <Tooltip formatter={(value) => value.toLocaleString()} labelStyle={{ fontSize: 12 }} />
      <Legend />
      <Area type="monotone" dataKey="revenue" stroke="#82ca9d" fill="#82ca9d" name="Revenue" />
      <Area type="monotone" dataKey="profit" stroke="#ff7300" fill="#ff7300" name="Profit" />
      <Area type="monotone" dataKey="expense" stroke="#ff0000" fill="#ff0000" name="Expense" />
      <Area type="monotone" dataKey="potentialRevenue" stroke="#0088fe" fill="#0088fe" name="Potential Revenue" />
    </AreaChart>
  );

  console.log("HHDXFJCDX",renderAreaChart)
  const renderBarChart = () => (
    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => value.toLocaleString()} />
      <Tooltip formatter={(value) => value.toLocaleString()} />
      <Legend />
      <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
      <Bar dataKey="profit" fill="#ff7300" name="Profit" />
      <Bar dataKey="expense" fill="#ff0000" name="Expense" />
    </BarChart>
  );
console.log("HHDXFJCDX",renderBarChart)
  const renderLineChart = () => (
    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => value.toLocaleString()} />
      <Tooltip formatter={(value) => value.toLocaleString()} />
      <Legend />
      <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue" />
      <Line type="monotone" dataKey="profit" stroke="#ff7300" name="Profit" />
      <Line type="monotone" dataKey="expense" stroke="#ff0000" name="Expense" />
    </LineChart>
  );
console.log("HHDXFJCDX",renderLineChart)  
  const renderComposedChart = () => (
    <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => value.toLocaleString()} />
      <Tooltip formatter={(value) => value.toLocaleString()} />
      <Legend />
      <Area type="monotone" dataKey="potentialRevenue" fill="#0088fe" stroke="#0088fe" name="Potential Revenue" />
      <Bar dataKey="profit" fill="#ff7300" name="Profit" />
      <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue" />
    </ComposedChart>
  );

  const renderPieChart = () => {
    const pieData = [
      { name: 'Revenue', value: dailyTotalSellingPrice },
      { name: 'Profit', value: dailyTotalProfit - TotalExpense },
      { name: 'Expense', value: TotalExpense },
      { name: 'Potential Revenue', value: DailyTotalPurchases },
    ];
console.log("HHDXFJCDX",pieData)
    return (
      <PieChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={['#82ca9d', '#ff7300', '#ff0000', '#0088fe'][index % 4]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => value.toLocaleString()} />
        <Legend />
      </PieChart>
    );
  };

  // Daily Summary Component
  const DailySummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card bordered={false} className="shadow-sm">
        <Statistic title="Daily Revenue" value={dailyTotalSellingPrice} suffix="frw" />
      </Card>
      <Card bordered={false} className="shadow-md">
        <Statistic
          title="Daily Net Profit"
          value={dailyTotalProfit - TotalExpense || 0}
          suffix="frw"
        />
      </Card>
      <Card bordered={false} className="shadow-sm">
        <Statistic title="Daily Expenses" value={TotalExpense || 0} suffix="frw" />
      </Card>
      <Card bordered={false} className="shadow-sm">
        <Statistic
          title="Today's Purchased Amount"
          value={DailyTotalPurchases || 0}
          suffix="frw"
        />
      </Card>
    </div>
  );

  return (
    <Card className="w-full p-4">
      <DailySummary />
      <Row justify="end" className="mb-4">
        <Col>
          <Select
            defaultValue="area"
            style={{ width: 200 }}
            onChange={(value) => setChartType(value)}
          >
            <Option value="bar">Bar Chart</Option>
            <Option value="area">Area Chart</Option>
            <Option value="line">Line Chart</Option>
            <Option value="composed">Composed Chart</Option>
            <Option value="pie">Pie Chart</Option>
          </Select>
        </Col>
      </Row>
      <ResponsiveContainer width="100%" height={300}>
      {renderPieChart ()}
        
      </ResponsiveContainer>
    </Card>
  );
};

export default DailyChart;
