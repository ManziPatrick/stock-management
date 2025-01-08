// @ts-nocheck 

import React from 'react';
import Loader from '../components/Loader';
import DailyChart from '../components/Charts/DailyChart';
import MonthlyChart from '../components/Charts/MonthlyChart';
import { useYearlySaleQuery } from '../redux/features/management/saleApi';

interface YearlyDataRecord {
  totalQuantity: number;
  totalSellingPrice: number;
  totalProductPrice: number;
  totalPurchasedAmount: number;
  totalExpenses: number;
  totalProfit: number;
}

interface TotalRevenue {
  totalOverallRevenue: number;
  totalOverallStock: number;
}

interface YearlyResponse {
  success: boolean;
  data: YearlyDataRecord[];
  totalRevenue: TotalRevenue;
}

interface MetricCardProps {
  title: string;
  value: number;
  color?: string;
}

const Dashboard: React.FC = () => {
  const { data: yearlyData, isLoading } = useYearlySaleQuery<YearlyResponse>(undefined);

  if (isLoading) {
    return <Loader />;
  }

  // Extract data safely from the response
  const rawData = yearlyData?.data || [];
  const totalRevenue = yearlyData?.totalRevenue?.totalOverallRevenue || 0;
  console.log("Total Revenue:", totalRevenue);

  const totalOverallStock = yearlyData?.totalRevenue?.totalOverallStock || 0;

  // Process aggregated metrics
  const aggregateMetrics = {
    totalSalesRevenue: rawData[0]?.totalPurchasedAmount - totalRevenue || 0, // Get from backend directly
    totalMarginProfit: rawData[0]?.totalSellingPrice - rawData[0]?.totalProductPrice || 0,
    totalExpenses: rawData[0]?.totalExpenses || 0,
    totalPurchase: rawData[0]?.totalPurchasedAmount || 0,
    totalNetProfit: rawData[0]?.totalProfit || 0,
    totalStock:  totalRevenue|| 0,
  };

  const MetricCard: React.FC<MetricCardProps> = ({ title, value, color = 'black' }) => (
    <div className="min-w-60 max-w-96 p-2">
      <div className="flex flex-col rounded-lg justify-center items-center bg-white shadow-sm max-w-96 p-8 my-6 border border-slate-200 relative">
        <h3 className="text-base font-medium mb-2">{title}</h3>
        <h1 className="text-lg font-extrabold" style={{ color }}>
          {value.toLocaleString()}
        </h1>
        <span className="font-bold absolute right-2 bottom-1">/frw</span>
      </div>
    </div>
  );

  return (
    <div className="container flex flex-col justify-center items-center w-full px-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-4">
        <MetricCard title="Total Sales Revenue" value={aggregateMetrics.totalSalesRevenue} color="blue" />
        <MetricCard title="Total Margin Profit" value={aggregateMetrics.totalMarginProfit} color="green" />
        <MetricCard title="Total Expenses" value={aggregateMetrics.totalExpenses} color="red" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-4 mt-4">
        <MetricCard title="Total Purchase" value={aggregateMetrics.totalPurchase} color="purple" />
        <MetricCard
          title="Total Net Profit"
          value={aggregateMetrics.totalNetProfit}
          color={aggregateMetrics.totalNetProfit >= 0 ? 'green' : 'red'}
        />
        <MetricCard title="Total Stock" value={aggregateMetrics.totalStock} color="orange" />
      </div>

      {/* Daily Sales Chart */}
      <div className="mt-8 border bg-white shadow-sm border-slate-200 w-full p-4">
        <h1 className="text-center text-xl font-semibold mb-4">Daily Sale and Revenue</h1>
        <DailyChart data={rawData} />
      </div>

      {/* Monthly Revenue Chart */}
      <div className="mt-8 border bg-white shadow-sm border-slate-200 w-full p-4">
        <h1 className="text-center text-xl font-semibold mb-4">Monthly Revenue</h1>
        <MonthlyChart data={rawData} />
      </div>
    </div>
  );
};

export default Dashboard;
