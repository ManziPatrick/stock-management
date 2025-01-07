import React, { useState } from 'react';
import { Flex, Select, Card } from 'antd';
import {
  Area, AreaChart, Bar, BarChart, Line, LineChart, Pie, PieChart,
  ComposedChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Legend, Cell
} from 'recharts';
import { useDailySaleQuery } from '../../redux/features/management/saleApi';
import Loader from '../Loader';

const { Option } = Select;

interface DailyRecord {
  _id: {
    day: number;
    month: number;
    year: number;
  };
  totalQuantity: number;
  totalSellingPrice: number;
  totalExpenses: number;
  totalProfit: number;
}

interface TotalRevenue {
  totalOverallRevenue: number;
  sizeWiseRevenue: Array<{
    _id: string;
    totalRevenue: number;
    totalStock: number;
    averagePrice: number;
  }>;
}

interface DailyResponse {
  dailyData: DailyRecord[];
  totalRevenue: TotalRevenue;
}

interface ChartDataPoint {
  name: string;
  revenue: number;
  quantity: number;
  profit: number;
  expense: number;
  potentialRevenue: number;
}

const DailyChart: React.FC = () => {
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line' | 'composed' | 'pie'>('area');
  const { data: response, isLoading } = useDailySaleQuery<{ data: DailyResponse }>();

  if (isLoading) {
    return (
      <Flex justify="center" align="center" className="h-64">
        <Loader />
      </Flex>
    );
  }

  const data: ChartDataPoint[] = response?.data?.dailyData?.map((item) => ({
    name: `${item._id.day.toString().padStart(2, '0')}/${item._id.month.toString().padStart(2, '0')}/${item._id.year}`,
    revenue: item.totalSellingPrice || 0,
    quantity: item.totalQuantity || 0,
    profit: item.totalProfit || 0,
    expense: item.totalExpenses || 0,
    potentialRevenue: response?.data?.totalRevenue?.totalOverallRevenue || 0
  })) || [];

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
      { name: 'Expense', value: data.reduce((sum, item) => sum + item.expense, 0) },
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
      <Flex justify="end" className="mb-4">
        <Select
          defaultValue="area"
          style={{ width: 200 }}
          onChange={(value) => setChartType(value as 'bar' | 'area' | 'line' | 'composed' | 'pie')}
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