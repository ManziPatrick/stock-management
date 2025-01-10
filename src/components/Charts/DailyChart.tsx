// @ts-nocheck 
import React, { useState } from 'react';
import { Flex, Select, Card, Statistic } from 'antd';
import {
  Area, AreaChart, Bar, BarChart, Line, LineChart, Pie, PieChart,
  ComposedChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Legend, Cell
} from 'recharts';
import { useDailySaleQuery } from '../../redux/features/management/saleApi';
 import {useGetAllExpensesQuery} from '../../redux/features/management/expenseApi';
import Loader from '../Loader';

const { Option } = Select;

const DailyChart = () => {
  const [chartType, setChartType] = useState('area');
  const { data: response } = useDailySaleQuery();
  
  const { data: expenses } = useGetAllExpensesQuery();
  console.log(expenses);
  
  const date = expenses?.data?.expenses?.map((item) => ({
    date: item.date,
    amount: item.amount, 
  }));
  
  const today = new Date();
  console.log("today", today);
  
  const todayExpenses = date?.filter((item) => {
    const expenseDate = new Date(item.date);
    return expenseDate.toDateString() === today.toDateString();
  });
  
  console.log("Today's Expenses:", todayExpenses);
  
  const totalAmountToday = todayExpenses?.reduce((total, item) => total + item.amount, 0);
  
  console.log("Total Amount for Today's Expenses:", totalAmountToday);
  const dailyNetProfit = response?.data?.summary?.dailyNetProfit;
  const data = response?.data?.dailyData?.map((item) => ({
    name: `${item._id.day.toString().padStart(2, '0')}/${item._id.month.toString().padStart(2, '0')}/${item._id.year}`,
    revenue: item.totalSellingPrice || 0,
    quantity: item.dailyPurchased || 0,
    profit: dailyNetProfit - totalAmountToday  || 0,
    expense: totalAmountToday || 0,
    potentialRevenue: response?.data?.totalRevenue?.totalOverallRevenue || 0
  })) || [];

  console.log("Data:", data);
  // Daily Summary Section
  const DailySummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card bordered={false} className="shadow-sm">
        <Statistic
          title="Daily Revenue"
          value={response?.data?.summary?.dailyRevenue || 0}
          suffix="frw"
        />
      </Card>
      <Card bordered={false} className="shadow-sm">
        <Statistic
          title="Daily Net Profit"
          value={response?.data?.summary?.dailyNetProfit - totalAmountToday || 0}
         suffix="frw"
        />
      </Card>
      <Card bordered={false} className="shadow-sm">
        <Statistic
          title="Daily Expenses"
          value={totalAmountToday || 0}
           suffix="frw"
        />
      </Card>
      <Card bordered={false} className="shadow-sm">
        <Statistic
          title="Daily Sales"
          value={response?.data?.summary?.dailyPurchased|| 0}
          suffix="frw"
        />
      </Card>
    </div>
  );

  const renderAreaChart = () => (
    <AreaChart data={data} margin={{ top: 10, right: 30, left: 4, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
      <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => value.toLocaleString()} />
      <Tooltip formatter={(value: number) => value.toLocaleString()} labelStyle={{ fontSize: 12 }} />
      <Legend />
      <Area type="monotone" dataKey="revenue" stroke="#82ca9d" fill="#82ca9d" name="Revenue" stackId="1" />
      <Area type="monotone" dataKey="quantity" stroke="#8884d8" fill="#8884d8" name="Quantity" stackId="2" />
      <Area type="monotone" dataKey="profit" stroke="#ff7300" fill="#ff7300" name="Profit" stackId="3" />
      <Area type="monotone" dataKey="expense" stroke="#ff0000" fill="#ff0000" name="Expense" stackId="4" />
      <Area type="monotone" dataKey="potentialRevenue" stroke="#0088fe" fill="#0088fe" name="Potential Revenue" stackId="5" />
    </AreaChart>
  );

  const renderBarChart = () => (
    <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => value.toLocaleString()} />
      <Tooltip formatter={(value: number) => value.toLocaleString()} />
      <Legend />
      <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
      <Bar dataKey="quantity" fill="#8884d8" name="Quantity" />
      <Bar dataKey="profit" fill="#ff7300" name="Profit" />
      <Bar dataKey="expense" fill="#ff0000" name="Expense" />
    </BarChart>
  );

  const renderLineChart = () => (
    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => value.toLocaleString()} />
      <Tooltip formatter={(value: number) => value.toLocaleString()} />
      <Legend />
      <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue" />
      <Line type="monotone" dataKey="quantity" stroke="#8884d8" name="Quantity" />
      <Line type="monotone" dataKey="profit" stroke="#ff7300" name="Profit" />
      <Line type="monotone" dataKey="expense" stroke="#ff0000" name="Expense" />
    </LineChart>
  );

  const renderComposedChart = () => (
    <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => value.toLocaleString()} />
      <Tooltip formatter={(value: number) => value.toLocaleString()} />
      <Legend />
      <Area type="monotone" dataKey="potentialRevenue" fill="#0088fe" stroke="#0088fe" name="Potential Revenue" />
      <Bar dataKey="quantity" fill="#8884d8" name="Quantity" />
      <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue" />
      <Line type="monotone" dataKey="profit" stroke="#ff7300" name="Profit" />
    </ComposedChart>
  );

  const renderPieChart = () => {
    const pieData = [
      { name: 'Revenue', value: data.reduce((sum, item) => sum + item.revenue, 0) },
      { name: 'Profit', value: data.reduce((sum, item) => sum + item.profit, 0) },
      { name: 'Expense', value: data.reduce((sum, item) => sum + totalAmountToday, 0) },
      { name: 'Quantity', value: data.reduce((sum, item) => sum + item.quantity, 0) },
    ];

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
            <Cell key={`cell-${index}`} fill={['#82ca9d', '#ff7300', '#ff0000', '#8884d8'][index % 4]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => value.toLocaleString()} />
        <Legend />
      </PieChart>
    );
  };

  return (
    <Card className="w-full p-4">
      <DailySummary />
      
      <Flex justify="end" className="mb-4">
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
      </Flex>
      
      <ResponsiveContainer width="100%" height={300}>
        {chartType === 'area' && renderAreaChart()}
        {chartType === 'bar' && renderBarChart()}
        {chartType === 'line' && renderLineChart()}
        {chartType === 'composed' && renderComposedChart()}
        {chartType === 'pie' && renderPieChart()}
      </ResponsiveContainer>
    </Card>
  );
};

export default DailyChart;