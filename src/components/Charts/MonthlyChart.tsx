import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';
import { useMonthlySaleQuery } from '../../redux/features/management/saleApi';
import { months } from '../../utils/generateDate';
import { Flex, Select, Card, Typography } from 'antd';
import Loader from '../Loader';

const { Title } = Typography;
const { Option } = Select;

interface MonthlyRecord {
  _id: {
    month: number;
    year: number;
  };
  totalQuantity: number;
  totalSellingPrice: number;
  totalProductPrice: number;
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

interface MonthlyResponse {
  monthlyData: MonthlyRecord[];
  totalRevenue: TotalRevenue;
}

interface ChartDataPoint {
  name: string;
  revenue: number;
  netProfit: number;
  productCost: number;
  expenses: number;
  quantity: number;
  potentialRevenue: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const MonthlyChart: React.FC = () => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'composed' | 'pie'>('bar');
  const { data: response, isLoading } = useMonthlySaleQuery<{ data: MonthlyResponse }>(undefined);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ height: '300px' }}>
        <Loader />
      </Flex>
    );
  }

  const data: ChartDataPoint[] = response?.data?.monthlyData?.map((item) => ({
    name: `${months[item._id.month - 1]} ${item._id.year}`,
    revenue: item.totalSellingPrice || 0,
    netProfit: item.totalProfit || 0,
    productCost: item.totalProductPrice || 0,
    expenses: item.totalExpenses || 0,
    quantity: item.totalQuantity || 0,
    potentialRevenue: response?.data?.totalRevenue?.totalOverallRevenue || 0
  })) || [];

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
        <YAxis tickFormatter={(value) => `${value.toLocaleString()} frw`} />
        <Tooltip 
          formatter={(value: number) => `${value.toLocaleString()} frw`}
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
        />
        <Legend />
        <Bar dataKey="revenue" fill="#0088FE" name="Revenue" />
        <Bar dataKey="netProfit" fill="#00C49F" name="Net Profit" />
        <Bar dataKey="productCost" fill="#FFBB28" name="Product Cost" />
        <Bar dataKey="expenses" fill="#FF8042" name="Expenses" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
        <YAxis tickFormatter={(value) => `${value.toLocaleString()} frw`} />
        <Tooltip 
          formatter={(value: number) => `${value.toLocaleString()} frw`}
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
        />
        <Legend />
        <Line type="monotone" dataKey="revenue" stroke="#0088FE" name="Revenue" />
        <Line type="monotone" dataKey="netProfit" stroke="#00C49F" name="Net Profit" />
        <Line type="monotone" dataKey="productCost" stroke="#FFBB28" name="Product Cost" />
        <Line type="monotone" dataKey="expenses" stroke="#FF8042" name="Expenses" />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderComposedChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
        <YAxis tickFormatter={(value) => `${value.toLocaleString()} frw`} />
        <Tooltip 
          formatter={(value: number) => `${value.toLocaleString()} frw`}
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
        />
        <Legend />
        <Bar dataKey="revenue" fill="#0088FE" name="Revenue" />
        <Line type="monotone" dataKey="netProfit" stroke="#00C49F" name="Net Profit" />
        <Bar dataKey="productCost" fill="#FFBB28" name="Product Cost" />
        <Line type="monotone" dataKey="quantity" stroke="#8884d8" name="Quantity" />
      </ComposedChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => {
    const totalData = data.reduce((acc, curr) => ({
      revenue: acc.revenue + curr.revenue,
      netProfit: acc.netProfit + curr.netProfit,
      productCost: acc.productCost + curr.productCost,
      expenses: acc.expenses + curr.expenses,
    }), { revenue: 0, netProfit: 0, productCost: 0, expenses: 0 });

    const pieData = [
      { name: 'Revenue', value: totalData.revenue },
      { name: 'Net Profit', value: totalData.netProfit },
      { name: 'Product Cost', value: totalData.productCost },
      { name: 'Expenses', value: totalData.expenses },
    ];

    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={150}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `${value.toLocaleString()} frw`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card>
      <Flex justify="space-between" align="center" className="mb-4">
        <Title level={4}>Monthly Financial Analysis</Title>
        <Select 
          defaultValue="bar" 
          style={{ width: 200 }} 
          onChange={(value) => setChartType(value as 'bar' | 'line' | 'composed' | 'pie')}
        >
          <Option value="bar">Bar Chart</Option>
          <Option value="line">Line Chart</Option>
          <Option value="composed">Composed Chart</Option>
          <Option value="pie">Pie Chart</Option>
        </Select>
      </Flex>

      {chartType === 'bar' && renderBarChart()}
      {chartType === 'line' && renderLineChart()}
      {chartType === 'composed' && renderComposedChart()}
      {chartType === 'pie' && renderPieChart()}
    </Card>
  );
};

export default MonthlyChart;