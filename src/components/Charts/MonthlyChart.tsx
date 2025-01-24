// @ts-nocheck
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
  ComposedChart,
} from 'recharts';
import { useMonthlySaleQuery } from '../../redux/features/management/saleApi';
import { months } from '../../utils/generateDate';
import { Flex, Select, Card, Typography, Statistic } from 'antd';
import Loader from '../Loader';
import { useGetAllExpensesQuery } from '../../redux/features/management/expenseApi';
import { useGetAllPurchasesQuery } from '../../redux/features/management/purchaseApi';

const { Title } = Typography;
const { Option } = Select;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const MonthlyChart: React.FC = () => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'composed' | 'pie'>('bar');
  const { data: response, isLoading, error } = useMonthlySaleQuery();
  const { data: expenses } = useGetAllExpensesQuery();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const monthlyExpenses = response?.data?.summary?.monthlyExpenses || 0;

    const { data: purchaseData } = useGetAllPurchasesQuery();
        
        // Extract yearly total from purchase data
        const MonthlytotalPurchases = purchaseData?.meta?.totalPurchasedAmount?.monthlyStats?.[0]?.monthlyTotal || 0;
    

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ height: '300px' }}>
        <Loader />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justify="center" align="center" style={{ height: '300px' }}>
        <Title level={5} type="danger">
          Unable to fetch data. Please try again later.
        </Title>
      </Flex>
    );
  }

  const data =
    response?.data?.monthlyData?.map((item) => ({
      name: `${months[item._id.month - 1]} ${item._id.year}`,
      revenue: item.monthlyRevenue || 0,
      netProfit: monthlyExpenses || 0,
      productCost: item.totalProductPrice || 0,
      expenses: monthlyExpenses || 0,
      quantity: item.totalQuantity || 0,
      grossProfit: item.grossProfit || 0,
      stockValue: item.stockValue || 0,
    })) || [];

  const MonthlySummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {[
        { title: 'Monthly Revenue', value: response?.data?.summary?.monthlyRevenue || 0, unit: 'frw' },
        { title: 'Monthly Net Profit', value: response?.data?.summary?.monthlyNetProfit - monthlyExpenses || 0, unit: 'frw' },
        { title: 'Monthly Expenses', value: monthlyExpenses || 0, unit: 'frw' },
        { title: 'Monthly Purchased Amount', value: MonthlytotalPurchases || 0, unit: 'frw' },
      ].map((item, idx) => (
        <Card key={idx} bordered={false} className="shadow-sm">
          <Statistic
            title={item.title}
            value={item.value}
           
            suffix={item.unit === 'frw' ? 'frw' : undefined}
          />
        </Card>
      ))}
    </div>
  );

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={(value) => `${value.toLocaleString()}`} />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'quantity' ? `${value.toLocaleString()} units` : `${value.toLocaleString()} frw`
                }
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              />
              <Legend />
              {['revenue', 'grossProfit', 'netProfit', 'productCost', 'expenses', 'quantity'].map((key, index) => (
                <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} name={key} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={(value) => `${value.toLocaleString()}`} />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'quantity' ? `${value.toLocaleString()} units` : `${value.toLocaleString()} frw`
                }
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              />
              <Legend />
              {['revenue', 'grossProfit', 'netProfit', 'productCost', 'expenses', 'quantity'].map((key, index) => (
                <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} name={key} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={(value) => `${value.toLocaleString()}`} />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'quantity' ? `${value.toLocaleString()} units` : `${value.toLocaleString()} frw`
                }
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#0088FE" name="Revenue" />
              <Line type="monotone" dataKey="grossProfit" stroke="#82ca9d" name="Gross Profit" />
              <Bar dataKey="stockValue" fill="#8884d8" name="Stock Value" />
            </ComposedChart>
          </ResponsiveContainer>
        );
      case 'pie':
        const pieData = data.reduce(
          (acc, curr) => [
            ...acc,
            ...['revenue', 'grossProfit', 'netProfit', 'productCost', 'expenses', 'quantity'].map((key) => ({
              name: key,
              value: curr[key],
            })),
          ],
          []
        );

        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number, name: string) => 
                  name === 'quantity' ? `${value.toLocaleString()} units` : `${value.toLocaleString()} frw`} 
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <Title level={4}>Monthly Financial Analysis</Title>
      <MonthlySummary />
      <Flex justify="end" align="center" className="mb-4">
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
      {renderChart()}
    </Card>
  );
};

export default MonthlyChart;
