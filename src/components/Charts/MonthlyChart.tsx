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
import { useMonthlySaleQuery } from '../../redux/features/management/saleApi';
import { useGetAllExpensesQuery } from '../../redux/features/management/expenseApi';
import { useGetAllPurchasesQuery } from '../../redux/features/management/purchaseApi';

interface ChartProps {
  data?: any;
}

const MonthlyChart: React.FC<ChartProps> = () => {
  const [chartType, setChartType] = useState('area');
  
  // Fetch monthly data without filters
  const { data: salesData, isLoading: isLoadingSales } = useMonthlySaleQuery({});
  const { data: expensesData, isLoading: isLoadingExpenses } = useGetAllExpensesQuery({});
  const { data: purchaseData, isLoading: isLoadingPurchases } = useGetAllPurchasesQuery({});

  if (isLoadingSales || isLoadingExpenses || isLoadingPurchases) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  // Process monthly data
  const processedData = salesData?.data?.map((monthlyData) => {
    const year = monthlyData._id?.year;
    const month = monthlyData._id?.month;
    
    // Convert month number to name
    const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' });
    const monthYearName = `${monthName} ${year}`;
    
    return {
      name: monthYearName,
      monthNum: month,
      year: year,
      date: new Date(year, month - 1, 1).getTime(),
      
      // Sales data
      revenue: monthlyData.monthlyTotal || 0,
      sellingPrice: monthlyData.totalSales || 0,
      profit: monthlyData.monthlyProfit || 0,
      netProfit: monthlyData.netProfit || 0,
      margin: monthlyData.totalMargin || 0,
      quantity: monthlyData.totalQuantity || 0,
      expenses: monthlyData.totalExpenses || 0,
      
      // Payment methods
      cash: monthlyData.cashTotal || 0,
      momo: monthlyData.momoTotal || 0,
      cheque: monthlyData.chequeTotal || 0,
      transfer: monthlyData.transferTotal || 0,
      
      // Credit information
      creditAmount: monthlyData.totalCreditAmount || 0,
      creditCount: monthlyData.totalCreditCount || 0,
      paidCredit: monthlyData.totalPaidCreditAmount || 0,
      remainingCredit: monthlyData.totalRemainingCredit || 0,
      
      // Calculate product cost from sales and margin
      productCost: (monthlyData.totalSales - monthlyData.totalMargin) || 0,
    };
  }) || [];

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
    transfer: acc.transfer + curr.transfer,
    productCost: acc.productCost + curr.productCost,
    creditAmount: acc.creditAmount + curr.creditAmount,
    remainingCredit: acc.remainingCredit + curr.remainingCredit
  }), {
    revenue: 0, profit: 0, expenses: 0, quantity: 0,
    cash: 0, momo: 0, cheque: 0, transfer: 0, productCost: 0,
    creditAmount: 0, remainingCredit: 0
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
        labelFormatter={(label) => `${label}`}
      />
      <Legend />
      {sortedData.length > 6 && (
        <Brush 
          dataKey="name"
          height={30}
          stroke="#8884d8"
          startIndex={Math.max(0, sortedData.length - 6)}
        />
      )}
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
            <Area type="monotone" dataKey="creditAmount" stackId="3" fill="#e67e22" stroke="#e67e22" name="Credit Amount" />
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
            <Bar dataKey="creditAmount" fill="#e67e22" name="Credit Amount" />
          </BarChart>
        );

      case 'payment':
        return (
          <BarChart {...commonProps}>
            {commonChildren}
            <Bar dataKey="cash" fill="#27ae60" name="Cash" />
            <Bar dataKey="momo" fill="#3498db" name="MoMo" />
            <Bar dataKey="cheque" fill="#9b59b6" name="Cheque" />
            <Bar dataKey="transfer" fill="#f1c40f" name="Transfer" />
            <Bar dataKey="creditAmount" fill="#e67e22" name="Credit" />
          </BarChart>
        );
     
      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {commonChildren}
            <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
            <Bar dataKey="expenses" fill="#ff8042" name="Expenses" />
            <Area type="monotone" dataKey="margin" fill="#8884d8" stroke="#8884d8" name="Margin" />
            <Line type="monotone" dataKey="creditAmount" stroke="#e67e22" strokeWidth={2} name="Credit" dot={{ r: 4 }} />
            <Line type="monotone" dataKey="remainingCredit" stroke="#e74c3c" strokeWidth={2} name="Remaining Credit" dot={{ r: 4 }} />
          </ComposedChart>
        );

      case 'pie':
        const pieData = [
          { name: 'Revenue', value: totals.revenue },
          { name: 'Product Cost', value: totals.productCost },
          { name: 'Profit', value: totals.profit },
          { name: 'Expenses', value: totals.expenses },
          { name: 'Credit', value: totals.creditAmount }
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

      case 'creditFocus':
        return (
          <ComposedChart {...commonProps}>
            {commonChildren}
            <Bar dataKey="creditAmount" fill="#e67e22" name="Total Credit" />
            <Bar dataKey="paidCredit" fill="#27ae60" name="Paid Credit" />
            <Line type="monotone" dataKey="remainingCredit" stroke="#e74c3c" strokeWidth={2} name="Remaining Credit" dot={{ r: 4 }} />
            <Line type="monotone" dataKey="creditCount" stroke="#3498db" strokeWidth={2} name="Credit Count" yAxisId="right" dot={{ r: 4 }} />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => value}
              tick={{ fontSize: 12 }}
            />
          </ComposedChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Monthly Sales Overview</h2>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Chart Type</label>
            <select
              className="p-2 border rounded-md"
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
            >
              <option value="area">Area Chart</option>
              <option value="bar">Bar Chart</option>
              <option value="payment">Payment Methods</option>
              <option value="composed">Composed Chart</option>
              <option value="creditFocus">Credit Focus</option>
              <option value="pie">Pie Chart</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm text-gray-600 mb-2">Total Sales</h3>
            <p className="font-semibold">
              {totals.revenue.toLocaleString()} RWF
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="text-sm text-gray-600 mb-2">Total Profit</h3>
            <p className="font-semibold">
              {totals.profit.toLocaleString()} RWF
            </p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-sm text-gray-600 mb-2">Total Expenses</h3>
            <p className="font-semibold">
              {totals.expenses.toLocaleString()} RWF
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <h3 className="text-sm text-gray-600 mb-2">Total Credit</h3>
            <p className="font-semibold">
              {totals.creditAmount.toLocaleString()} RWF
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <h3 className="text-sm text-gray-600 mb-2">Remaining Credit</h3>
            <p className="font-semibold">
              {totals.remainingCredit.toLocaleString()} RWF
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="text-sm text-gray-600 mb-2">Total Quantity</h3>
            <p className="font-semibold">
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

export default MonthlyChart;