import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Brush,
  ReferenceLine
} from 'recharts';
import { useDailySaleQuery } from '../../redux/features/management/saleApi';
import { useGetAllExpensesQuery } from '../../redux/features/management/expenseApi';
import { useGetAllPurchasesQuery } from '../../redux/features/management/purchaseApi';

interface ChartProps {

  data: any;

}
const DailySalesChart: React.FC<ChartProps>  = () => {
  const [chartType, setChartType] = useState('area');
  const { data: salesData, isLoading: isLoadingSales } = useDailySaleQuery({});
  const { data: expensesData, isLoading: isLoadingExpenses } = useGetAllExpensesQuery({});
  const { data: purchaseData, isLoading: isLoadingPurchases } = useGetAllPurchasesQuery({});

  if (isLoadingSales || isLoadingExpenses || isLoadingPurchases) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  // Process multiple days of data
  const processedData = salesData?.data?.map(dailyData => ({
    name: `${dailyData._id?.day}/${dailyData._id?.month}`,
    date: new Date(dailyData._id?.year, dailyData._id?.month - 1, dailyData._id?.day).getTime(),
    revenue: dailyData.totalSaleAmount || 0,
    sellingPrice: dailyData.totalSellingPrice || 0,
    productCost: dailyData.totalProductPrice || 0,
    profit: dailyData.netProfit || 0,
    margin: dailyData.totalMarginProfit || 0,
    quantity: dailyData.totalQuantitySold || 0,
    cash: dailyData.cashTotal || 0,
    momo: dailyData.momoTotal || 0,
    cheque: dailyData.chequeTotal || 0,
    transfer: dailyData.transferTotal || 0,
    expenses: dailyData.expenses || 0,
    purchases: purchaseData?.meta?.totalPurchasedAmount?.dailyStats?.[0]?.dailyTotal || 0
  })) || [];

  // Sort data by date
  const sortedData = processedData.sort((a, b) => a.date - b.date);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Calculate totals for summary
  const totals = processedData.reduce((acc, curr) => ({
    revenue: acc.revenue + curr.revenue,
    profit: acc.profit + curr.profit,
    expenses: acc.expenses + curr.expenses,
    quantity: acc.quantity + curr.quantity,
    cash: acc.cash + curr.cash,
    momo: acc.momo + curr.momo,
    cheque: acc.cheque + curr.cheque,
    transfer: acc.transfer + curr.transfer
  }), {
    revenue: 0, profit: 0, expenses: 0, quantity: 0,
    cash: 0, momo: 0, cheque: 0, transfer: 0
  });

  const renderChart = () => {
    const commonProps = {
      data: sortedData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    };

    const commonChildren = <>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis 
        dataKey="name"
        tick={{ fontSize: 12 }}
        interval="preserveStartEnd"
      />
      <YAxis 
        tickFormatter={(value) => `${value.toLocaleString()} RWF`}
        tick={{ fontSize: 12 }}
      />
      <Tooltip 
        formatter={(value) => `${value.toLocaleString()} RWF`}
        labelFormatter={(label) => `Day: ${label}`}
      />
      <Legend />
      <Brush 
        dataKey="name"
        height={30}
        stroke="#8884d8"
        startIndex={Math.max(0, sortedData.length - 7)}
      />
      <ReferenceLine y={0} stroke="#000" />
    </>;

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {commonChildren}
            <Area type="monotone" dataKey="sellingPrice" stackId="1" fill="#8884d8" stroke="#8884d8" name="Selling Price" />
            <Area type="monotone" dataKey="revenue" stackId="1" fill="#82ca9d" stroke="#82ca9d" name="Revenue" />
            <Area type="monotone" dataKey="profit" stackId="2" fill="#ffc658" stroke="#ffc658" name="Profit" />
            <Area type="monotone" dataKey="expenses" stackId="2" fill="#ff8042" stroke="#ff8042" name="Expenses" />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {commonChildren}
            <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
            <Bar dataKey="productCost" fill="#8884d8" name="Product Cost" />
            <Bar dataKey="profit" fill="#ffc658" name="Profit" />
            <Bar dataKey="expenses" fill="#ff8042" name="Expenses" />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            {commonChildren}
            <Line type="monotone" dataKey="sellingPrice" stroke="#8884d8" name="Selling Price" dot={false} />
            <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue" dot={false} />
            <Line type="monotone" dataKey="profit" stroke="#ffc658" name="Profit" dot={false} />
            <Line type="monotone" dataKey="quantity" stroke="#ff8042" name="Quantity" yAxisId="right" dot={false} />
          </LineChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {commonChildren}
            <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
            <Bar dataKey="expenses" fill="#ff8042" name="Expenses" />
            <Line type="monotone" dataKey="profit" stroke="#ffc658" name="Profit" dot={false} />
            <Area type="monotone" dataKey="margin" fill="#8884d8" stroke="#8884d8" name="Margin" />
          </ComposedChart>
        );

      case 'pie':
        const pieData = [
          { name: 'Revenue', value: totals.revenue },
          { name: 'Product Cost', value: totals.expenses },
          { name: 'Profit', value: totals.profit },
          { name: 'Expenses', value: totals.expenses }
        ];
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value.toLocaleString()} RWF`} />
            <Legend />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
      <div className="flex justify-end mb-4">
          <select
            className="p-2 border rounded-md"
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
          >
            <option value="area">Area Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="composed">Composed Chart</option>
            <option value="pie">Pie Chart</option>
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm text-gray-600 mb-2">Total Sales</h3>
            <p className=" font-semibold">
              {totals.revenue.toLocaleString()} RWF
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="text-sm text-gray-600 mb-2">Total Profit</h3>
            <p className=" font-semibold">
              {totals.profit.toLocaleString()} RWF
            </p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-sm text-gray-600 mb-2">Total Expenses</h3>
            <p className=" font-semibold">
              {totals.expenses.toLocaleString()} RWF
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="text-sm text-gray-600 mb-2">Total Quantity</h3>
            <p className=" font-semibold">
              {totals.quantity.toLocaleString()} units
            </p>
          </div>
        </div>

        

        
      </div>

      <ResponsiveContainer width="100%" height={400}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default DailySalesChart;