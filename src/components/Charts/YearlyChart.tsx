import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Brush,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useYearlySaleQuery } from '../../redux/features/management/saleApi';
import { useGetAllExpensesQuery } from '../../redux/features/management/expenseApi';

interface ChartProps {
  data?: any;
}

const YearlySalesChart: React.FC<ChartProps> = () => {
  const [chartType, setChartType] = useState('composed');

  // Use the API without year range filters
  const { data: saleResponse, isLoading } = useYearlySaleQuery({});
  const { data: expenses } = useGetAllExpensesQuery({});

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const processedData = saleResponse?.data?.map(item => ({
    name: `${item._id.year}`,
    quantity: item.totalQuantity || item.totalQuantitySold || 0,
    sales: item.totalSales || item.totalSaleAmount || item.yearlyTotal || 0,
    sellingPrice: item.totalSellingPrice || 0,
    expenses: item.totalExpenses || item.expenses || 0,
    profit: item.netProfit || item.yearlyProfit || 0,
    margin: item.totalMargin || item.totalMarginProfit || 0,
    avgSale: item.averageSaleAmount || 0,
    cash: item.cashTotal || 0,
    momo: item.momoTotal || 0,
    cheque: item.chequeTotal || 0,
    transfer: item.transferTotal || 0,
    creditAmount: item.totalCreditAmount || item.totalCredit || 0,
    creditCount: item.totalCreditCount || 0,
    paidCredit: item.totalPaidCreditAmount || 0,
    remainingCredit: item.totalRemainingCredit || item.remainingCredit || 0
  })) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#e67e22'];

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toLocaleString()} RWF`} />
              <Legend />
              <Brush dataKey="name" height={30} stroke="#8884d8" />
              <Bar dataKey="sales" fill="#8884d8" name="Sales Amount" />
              <Bar dataKey="expenses" fill="#82ca9d" name="Total Expenses" />
              <Bar dataKey="profit" fill="#ffc658" name="Profit" />
              <Bar dataKey="margin" fill="#ff7300" name="Margin" />
              <Bar dataKey="creditAmount" fill="#e67e22" name="Credit Amount" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toLocaleString()} RWF`} />
              <Legend />
              <Brush dataKey="name" height={30} stroke="#8884d8" />
              <Line type="monotone" dataKey="sales" stroke="#8884d8" name="Sales Amount" />
              <Line type="monotone" dataKey="sellingPrice" stroke="#82ca9d" name="Selling Price" />
              <Line type="monotone" dataKey="profit" stroke="#ffc658" name="Profit" />
              <Line type="monotone" dataKey="creditAmount" stroke="#e67e22" strokeWidth={2} name="Credit Amount" />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'payment':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toLocaleString()} RWF`} />
              <Legend />
              <Brush dataKey="name" height={30} stroke="#8884d8" />
              <Bar dataKey="cash" fill="#27ae60" name="Cash" />
              <Bar dataKey="momo" fill="#3498db" name="MoMo" />
              <Bar dataKey="cheque" fill="#9b59b6" name="Cheque" />
              <Bar dataKey="transfer" fill="#f1c40f" name="Transfer" />
              <Bar dataKey="creditAmount" fill="#e67e22" name="Credit" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        if (!processedData || processedData.length === 0) return null;
        
        // Get the most recent year's data for the pie chart
        const latestData = processedData.sort((a, b) => parseInt(b.name) - parseInt(a.name))[0];
        const pieData = [
          { name: 'Sales', value: latestData.sales },
          { name: 'Expenses', value: latestData.expenses },
          { name: 'Profit', value: latestData.profit },
          { name: 'Credit', value: latestData.creditAmount },
          { name: 'Remaining Credit', value: latestData.remainingCredit }
        ];
        
        return (
          <ResponsiveContainer width="100%" height={500}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toLocaleString()} RWF`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'composed':
      default:
        return (
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toLocaleString()} RWF`} />
              <Legend />
              <Brush dataKey="name" height={30} stroke="#8884d8" />
              <Bar dataKey="sales" fill="#8884d8" name="Sales Amount" />
              <Bar dataKey="expenses" fill="#ff7300" name="Total Expenses" />
              <Line type="monotone" dataKey="profit" stroke="#82ca9d" name="Profit" />
              <Line type="monotone" dataKey="margin" stroke="#ffc658" name="Margin" />
              <Line type="monotone" dataKey="creditAmount" stroke="#e67e22" strokeWidth={2} name="Credit" />
            </ComposedChart>
          </ResponsiveContainer>
        );
    }
  };

  // Get the latest year's data for the summary metrics
  const latestData = processedData.length > 0 ? 
    processedData.sort((a, b) => parseInt(b.name) - parseInt(a.name))[0] : 
    { sales: 0, margin: 0, expenses: 0, quantity: 0, creditAmount: 0, remainingCredit: 0 };

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
              <option value="composed">Composed Chart</option>
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="payment">Payment Methods</option>
              <option value="pie">Pie Chart</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm text-gray-600 mb-2">Total Sales</h3>
          <p className="font-semibold">
            {latestData.sales?.toLocaleString() || 0} RWF
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="text-sm text-gray-600 mb-2">Total Margin</h3>
          <p className="font-semibold">
            {latestData.margin?.toLocaleString() || 0} RWF
          </p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="text-sm text-gray-600 mb-2">Total Expenses</h3>
          <p className="font-semibold">
            {latestData.expenses?.toLocaleString() || 0} RWF
          </p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg">
          <h3 className="text-sm text-gray-600 mb-2">Total Credit</h3>
          <p className="font-semibold">
            {latestData.creditAmount?.toLocaleString() || 0} RWF
          </p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <h3 className="text-sm text-gray-600 mb-2">Remaining Credit</h3>
          <p className="font-semibold">
            {latestData.remainingCredit?.toLocaleString() || 0} RWF
          </p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="text-sm text-gray-600 mb-2">Total Quantity</h3>
          <p className="font-semibold">
            {latestData.quantity?.toLocaleString() || 0} units
          </p>
        </div>
      </div>

      {renderChart()}
    </div>
  );
};

export default YearlySalesChart;