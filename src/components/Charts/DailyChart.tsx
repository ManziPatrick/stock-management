import React, { useState, useEffect } from 'react';
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
  const [todayData, setTodayData] = useState(null);
  
  // Fetch data
  const { data: salesData, isLoading: isLoadingSales } = useDailySaleQuery({});
  const { data: expensesData, isLoading: isLoadingExpenses } = useGetAllExpensesQuery({});
  const { data: purchaseData, isLoading: isLoadingPurchases } = useGetAllPurchasesQuery({});

  useEffect(() => {
    if (!isLoadingSales && !isLoadingExpenses && !isLoadingPurchases) {
      // Get today's date in Rwanda time (CAT/EAT, UTC+2)
      const now = new Date();
      const rwandaDay = now.getDate();
      const rwandaMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
      const todayKey = `${rwandaDay}/${rwandaMonth}`;
      
      // Process expense data
      const expenseDailyStats = expensesData?.data ?? [];
      const expenseMap = {};
      expenseDailyStats.forEach(stat => {
        const dateObj = new Date(stat.date);
        const day = dateObj.getUTCDate();
        const month = dateObj.getUTCMonth() + 1;
        const dateKey = `${day}/${month}`;
        
        if (!expenseMap[dateKey]) {
          expenseMap[dateKey] = 0;
        }
        expenseMap[dateKey] += stat.amount;
      });
      
      // Process purchase data
      const purchaseDailyStats = purchaseData?.meta?.totalExpenses?.dailyStats || [];
      const purchaseMap = {};
      purchaseDailyStats.forEach(stat => {
        const dateKey = `${stat._id.day}/${stat._id.month}`;
        purchaseMap[dateKey] = stat.dailyTotal || 0;
      });

      // Process sales data to find today's data
      const processedData = salesData?.data?.map((dailyData) => {
        const year = dailyData._id?.year;
        const month = dailyData._id?.month - 1; // JavaScript months are 0-indexed
        const day = dailyData._id?.day;
      
        // Create the date properly in Rwanda time (CAT/EAT, UTC+2)
        const utcDate = new Date(Date.UTC(year, month, day));
        
        // Adjust for Rwanda timezone
        const rwandaDate = new Date(utcDate);
        rwandaDate.setUTCHours(21 - 2); // 9 PM adjusted for UTC+2
        rwandaDate.setUTCMinutes(42);
        
        const correctedDay = rwandaDate.getUTCDate();
        const correctedMonth = rwandaDate.getUTCMonth() + 1;
        
        const dateKey = `${correctedDay}/${correctedMonth}`;
      
        // Format for display
        const formattedRwandaTime = rwandaDate.toLocaleString('en-US', { 
          timeZone: 'Africa/Kigali',
          hour: 'numeric', 
          minute: 'numeric',
          hour12: true
        });
      
        return {
          name: dateKey,
          date: rwandaDate.getTime(),
          formattedDate: formattedRwandaTime,
          
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

      // Find today's data
      const todayDataPoint = processedData.find(item => item.name === todayKey) || {
        revenue: 0,
        profit: 0,
        expenses: 0,
        quantity: 0,
        creditAmount: 0,
        remainingCredit: 0,
        productCost: 0,
        cash: 0,
        momo: 0,
        cheque: 0,
        transfer: 0
      };     
      setTodayData(todayDataPoint);
    }
  }, [salesData, expensesData, purchaseData, isLoadingSales, isLoadingExpenses, isLoadingPurchases]);

  if (isLoadingSales || isLoadingExpenses || isLoadingPurchases) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  // Sort data by date for the chart
  const sortedData = (salesData?.data?.map((dailyData) => {
    const year = dailyData._id?.year;
    const month = dailyData._id?.month - 1;
    const day = dailyData._id?.day;
  
    // Create date in Rwanda time
    const utcDate = new Date(Date.UTC(year, month, day));
    const rwandaDate = new Date(utcDate);
    rwandaDate.setUTCHours(21 - 2);
    rwandaDate.setUTCMinutes(42);
    
    const correctedDay = rwandaDate.getUTCDate();
    const correctedMonth = rwandaDate.getUTCMonth() + 1;
    const dateKey = `${correctedDay}/${correctedMonth}`;
  
    // Format for display
    const formattedRwandaTime = rwandaDate.toLocaleString('en-US', { 
      timeZone: 'Africa/Kigali',
      hour: 'numeric', 
      minute: 'numeric',
      hour12: true
    });
  
    return {
      name: dateKey,
      date: rwandaDate.getTime(),
      formattedDate: formattedRwandaTime,
      
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
    };
  }) || []).sort((a, b) => a.date - b.date);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
        // Now showing pie chart with today's data only
        const pieData = [
          { name: 'Revenue', value: todayData?.revenue || 0 },
          { name: 'Product Cost', value: todayData?.productCost || 0 },
          { name: 'Profit', value: todayData?.profit || 0 },
          { name: 'Expenses', value: todayData?.expenses || 0 },
          { name: 'Credit', value: todayData?.creditAmount || 0 }
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

  // Format today's date for display
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Today's Statistics: {formattedDate}</h2>
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
            <h3 className="text-sm text-gray-600 mb-2">Today's Sales</h3>
            <p className="font-semibold">
              {(todayData?.revenue || 0).toLocaleString()} RWF
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="text-sm text-gray-600 mb-2">Today's Profit</h3>
            <p className="font-semibold">
              {(todayData?.profit || 0).toLocaleString()} RWF
            </p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-sm text-gray-600 mb-2">Today's Expenses</h3>
            <p className="font-semibold">
              {(todayData?.expenses || 0).toLocaleString()} RWF
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <h3 className="text-sm text-gray-600 mb-2">Today's Credit</h3>
            <p className="font-semibold">
              {(todayData?.creditAmount || 0).toLocaleString()} RWF
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <h3 className="text-sm text-gray-600 mb-2">Remaining Credit</h3>
            <p className="font-semibold">
              {(todayData?.remainingCredit || 0).toLocaleString()} RWF
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="text-sm text-gray-600 mb-2">Today's Quantity</h3>
            <p className="font-semibold">
              {(todayData?.quantity || 0).toLocaleString()} units
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