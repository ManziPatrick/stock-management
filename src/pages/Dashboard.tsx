// @ts-nocheck

import React from 'react';
import MonthlyChart from '../components/Charts/MonthlyChart';
import DailyChart from '../components/Charts/DailyChart';
import Loader from '../components/Loader';
import { useCountProductsQuery } from '../redux/features/management/productApi';
import { useYearlySaleQuery } from '../redux/features/management/saleApi';

interface YearlyDataRecord {
  totalQuantity: number;
  totalSellingPrice: number;
  totalExpenses: number;
  totalProfit: number;
}

interface TotalRevenue {
  totalOverallRevenue: number;
  totalOverallStock:number;
  sizeWiseRevenue: Array<{
    _id: string;
    totalRevenue: number;
    totalStock: number;
    averagePrice: number;
   
  }>;
}

interface YearlyResponse {
  yearlyData: YearlyDataRecord[];
  totalRevenue: TotalRevenue;
  
}

interface ProductResponse {
  data: {
    totalQuantity: number;
  };
}

interface MetricCardProps {
  title: string;
  value: number;
  color?: string;
}

const Dashboard: React.FC = () => {
  // @ts-ignore
  const { data: products, isLoading: isLoadingProducts } = useCountProductsQuery<{ data: ProductResponse }>(undefined);
  // @ts-ignore
  const { data: yearlyData, isLoading: isLoadingSales } = useYearlySaleQuery<{ data: YearlyResponse }>(undefined);

  if (isLoadingProducts || isLoadingSales) {
    return <Loader />;
  }
// @ts-ignore
  const rawData = yearlyData?.data?.yearlyData || [];
  // @ts-ignore
  const totalRevenue = yearlyData?.data?.totalRevenue?.totalOverallRevenue || 0;
// @ts-ignore
  const totalOverallStock = yearlyData?.data?.totalRevenue?.totalOverallStock || 0;
  // Process data for metrics
  const aggregateMetrics = rawData.reduce(
    (acc, record) => ({
      totalQuantity: record.totalQuantity || 0,
      totalSellingPrice: record.totalSellingPrice || 0,
      totalExpenses: record.totalExpenses || 0,
      totalProfit: record.totalProfit || 0  
    }),
    { totalQuantity: 0, totalSellingPrice: 0, totalExpenses: 0, totalProfit: 0 }
  );

  const MetricCard: React.FC<MetricCardProps> = ({ title, value, color = 'black' }) => (
    <div className="min-w-60 max-w-96 p-2">
      <div className="flex flex-col rounded-lg justify-center items-center bg-white shadow-sm max-w-96 p-8 my-6 border border-slate-200 relative">
        <h3 className="text-base font-medium mb-2">{title}</h3>
        <h1 className="text-lg font-extrabold" style={{ color }}>
          {value.toLocaleString()}
        </h1>
        <span className=' font-bold absolute right-2 bottom-1'>/frw</span>
      </div>
      
    </div>
  );

  return (
    <div className="container flex flex-col justify-center items-center  w-full px-4">
    
      <div className="grid grid-cols-1  md:grid-cols-2 w-full gap-4">
     
        <MetricCard 
          title="Total Revenue Potential" 
          value={totalRevenue} 
          color="blue"
        />
        <MetricCard 
          title="Total Selling Price" 
          value={aggregateMetrics.totalSellingPrice.toFixed(0)} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-4 mt-4">
      
          <MetricCard 
          title="Total Expenses" 
          value={aggregateMetrics.totalExpenses.toFixed(0)} 
          color="red" 
        />
        <MetricCard 
          title="Total Profit" 
          value={aggregateMetrics.totalProfit.toFixed(0)} 
          color={aggregateMetrics.totalProfit >= 0 ? 'green' : 'red'} 
        />
      </div>

      <div className="mt-8 border bg-white shadow-sm border-slate-200 w-full p-4">
        <h1 className="text-center text-xl font-semibold mb-4">Daily Sale and Revenue</h1>
        // @ts-ignore
        <DailyChart data={rawData} />
      </div>
     
      <div className="mt-8 border bg-white shadow-sm border-slate-200 w-full p-4">
        <h1 className="text-center text-xl font-semibold mb-4">Monthly Revenue</h1>
        // @ts-ignore
        <MonthlyChart data={rawData} />
     
    </div>
    </div>
  );
};

export default Dashboard;