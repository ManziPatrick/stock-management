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
  Brush
} from 'recharts';
import { useYearlySaleQuery } from '../../redux/features/management/saleApi';
import { useGetAllExpensesQuery } from '../../redux/features/management/expenseApi';

interface ChartProps {

    data: any;
  
  }

const YearlySalesChart :React.FC<ChartProps>  = () => {
  const [chartType, setChartType] = useState('composed');
  const { data: saleResponse, isLoading } = useYearlySaleQuery(undefined);
  const { data: expenses } = useGetAllExpensesQuery({});

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const processedData = saleResponse?.data?.map(item => ({
    name: `${item._id.year}`,
    quantity: item.totalQuantitySold || 0,
    sales: item.totalSaleAmount || 0,
    sellingPrice: item.totalSellingPrice || 0,
    TotalExpenses: item.expenses|| 0,
    profit: item.netProfit || 0,
    margin: item.totalMarginProfit || 0,
    avgSale: item.averageSaleAmount || 0,
    cash: item.cashTotal || 0,
    momo: item.momoTotal || 0,
    cheque: item.chequeTotal || 0,
    transfer: item.transferTotal || 0,
    
  })) || [];

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
              <Bar dataKey="TotalExpenses" fill="#82ca9d" name="Total Expenses" />
              <Bar dataKey="profit" fill="#ffc658" name="Profit" />
              <Bar dataKey="margin" fill="#ff7300" name="Margin" />
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
              <Line type="monotone" dataKey="avgSale" stroke="#ffc658" name="Average Sale" />
            </LineChart>
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
              <Bar dataKey="TotalExpenses" fill="#ff7300" name="Total Expenses" />
              <Line type="monotone" dataKey="profit" stroke="#82ca9d" name="Profit" />
              <Line type="monotone" dataKey="margin" stroke="#ffc658" name="Margin" />
            </ComposedChart>
          </ResponsiveContainer>
        );
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
            <option value="composed">Composed Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm text-gray-600 mb-2">Total Sales</h3>
          <p className=" font-semibold">
            {processedData[0]?.sales?.toLocaleString() || 0} RWF
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="text-sm text-gray-600 mb-2">Total Margin</h3>
          <p className=" font-semibold">
            {processedData[0]?.margin?.toLocaleString() || 0} RWF
          </p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="text-sm text-gray-600 mb-2">Total Expenses</h3>
          <p className=" font-semibold">
            {processedData[0]?.TotalExpenses?.toLocaleString() || 0} RWF
          </p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="text-sm text-gray-600 mb-2">Total Quantity</h3>
          <p className=" font-semibold">
            {processedData[0]?.quantity?.toLocaleString() || 0} units
          </p>
        </div>
      </div>

      {renderChart()}

   
    </div>
  );
};

export default YearlySalesChart;