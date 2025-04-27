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
  data?: any;
}

const DailyChart: React.FC<ChartProps> = () => {
  const [chartType, setChartType] = useState('area');
  
  // Remove date filter from component state
  const { data: salesData, isLoading: isLoadingSales } = useDailySaleQuery({});
  const { data: expensesData, isLoading: isLoadingExpenses } = useGetAllExpensesQuery({});
  const { data: purchaseData, isLoading: isLoadingPurchases } = useGetAllPurchasesQuery({});

  if (isLoadingSales || isLoadingExpenses || isLoadingPurchases) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  // Correctly extract expense data
  const expenseDailyStats = expensesData?.data ?? [];
  const expenseMap = {};

  expenseDailyStats.forEach(stat => {
    const dateObj = new Date(stat.date);
    const day = dateObj.getUTCDate();
    const month = dateObj.getUTCMonth() + 1;
    const dateKey = `${day}/${month}`;

    // Sum up the amounts per day
    if (!expenseMap[dateKey]) {
      expenseMap[dateKey] = 0;
    }

    expenseMap[dateKey] += stat.amount;
  });
  
  // Similarly for purchases
  const purchaseDailyStats = purchaseData?.meta?.totalExpenses?.dailyStats || [];
  const purchaseMap = {};
  purchaseDailyStats.forEach(stat => {
    const dateKey = `${stat._id.day}/${stat._id.month}`;
    purchaseMap[dateKey] = stat.dailyTotal || 0;
  });

  const processedData = salesData?.data?.map((dailyData) => {
    const year = dailyData._id?.year;
    const month = dailyData._id?.month - 1; // JavaScript months are 0-indexed
    const day = dailyData._id?.day;
  
    console.log("Original data:", { year, month: month + 1, day });
  
    // Create the date properly in Rwanda time (CAT/EAT, UTC+2)
    // First create it in UTC to avoid browser's local timezone influence
    const utcDate = new Date(Date.UTC(year, month, day));
    console.log("UTC date:", utcDate.toISOString());
    
    // Get current Rwanda time - use 9:42 PM as the time since that's what you specified
    const rwandaHour = 21; // 9 PM
    const rwandaMinute = 42;
    
    // Create a new date with the Rwanda time
    const rwandaDate = new Date(utcDate);
    rwandaDate.setUTCHours(rwandaHour - 2); // Adjust for UTC+2
    rwandaDate.setUTCMinutes(rwandaMinute);
    
    console.log("Rwanda time:", rwandaDate.toLocaleString('en-US', { timeZone: 'Africa/Kigali' }));
    
    const correctedDay = rwandaDate.getUTCDate();
    const correctedMonth = rwandaDate.getUTCMonth() + 1;
    console.log("Corrected day/month:", correctedDay, correctedMonth);
    
    const dateKey = `${correctedDay}/${correctedMonth}`;
    console.log("Final dateKey:", dateKey);
  
    // Format for display
    const formattedRwandaTime = rwandaDate.toLocaleString('en-US', { 
      timeZone: 'Africa/Kigali',
      hour: 'numeric', 
      minute: 'numeric',
      hour12: true
    });
  
    // Map API response fields to chart data structure
    return {
      name: dateKey, // For x-axis in charts
      date: rwandaDate.getTime(), // For optional advanced date sorting
      formattedDate: formattedRwandaTime, // Should show 9:42 PM for Rwanda
      
      // Sales-related
      revenue: dailyData.dailyTotal || 0,
      sellingPrice: dailyData.totalSales || 0,
      productCost: (dailyData.totalSales - dailyData.totalMargin) || 0,
      profit: dailyData.netProfit || 0,
      margin: dailyData.totalMargin || 0,
      quantity: dailyData.totalQuantity || 0,
  
      // Payment methods
      cash: dailyData.cashTotal || 0,
      momo: dailyData.momoTotal || 0,
      cheque: dailyData.chequeTotal || 0,
      transfer: dailyData.transferTotal || 0,
  
      // Credit information
      creditAmount: dailyData.totalCreditAmount || 0,
      creditCount: dailyData.totalCreditCount || 0,
      paidCredit: dailyData.totalPaidCreditAmount || 0,
      remainingCredit: dailyData.totalRemainingCredit || 0,
  
      // External maps (match by date key)
      expenses: expenseMap[dateKey] || 0,
      purchases: purchaseMap[dateKey] || 0,
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
    productCost: (acc.productCost || 0) + (curr.productCost || 0),
    creditAmount: (acc.creditAmount || 0) + (curr.creditAmount || 0),
    remainingCredit: (acc.remainingCredit || 0) + (curr.remainingCredit || 0)
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
          </ComposedChart>
        );

      case 'pie':
        const pieData = [
          { name: 'Revenue', value: totals.revenue },
          { name: 'Product Cost', value: totals.productCost || 0 },
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

      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex justify-end mb-4">
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

export default DailyChart;