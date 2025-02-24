// @ts-nocheck 
import React, { useState } from 'react';
import Loader from '../components/Loader';
import DailyChart from '../components/Charts/DailyChart';
import MonthlyChart from '../components/Charts/MonthlyChart';
import { useYearlySaleQuery } from '../redux/features/management/saleApi';
import {
  useDeletePurchaseMutation,
  useGetAllPurchasesQuery,
} from '../redux/features/management/purchaseApi';
import { useGetAllSaleQuery } from '../redux/features/management/saleApi';

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
    const [query, setQuery] = useState({
      page: 1,
      limit: 10,
      search: '',
    });

    const { data: TotalMagrinProfit, isFetching } = useGetAllSaleQuery(query);
    console.log(TotalMagrinProfit);
    const totalMarginProfit = TotalMagrinProfit?.data?.meta?.totalSales?.yearlyStats?.[0]?.profit ?? 0;
    const totalSellingPrice = TotalMagrinProfit?.data?.meta?.totalSales?.yearlyStats?.[0]?.yearlyTotalSellingPrice ?? 0;
     

    const { data: yearlyData, isLoading } = useYearlySaleQuery<YearlyResponse>(undefined);
    const { data: purchaseData } = useGetAllPurchasesQuery(query);
    
    // Extract yearly total from purchase data
    const yearlyTotalPurchases = purchaseData?.meta?.totalPurchasedAmount?.yearlyStats?.[0]?.yearlyTotal || 0;

    if (isLoading) {
      return <Loader />;
    }

    // Extract data safely from the response
    const rawData = yearlyData?.data || [];
    const totalRevenue = yearlyData?.totalRevenue?.totalOverallRevenue || 0;
    const totalOverallStock = yearlyData?.totalRevenue?.totalOverallStock || 0;

    const aggregateMetrics = {
      totalSalesRevenue: totalSellingPrice || 0,
      totalExpenses: rawData[0]?.totalExpenses || 0,
      netprofit: totalMarginProfit - rawData[0]?.totalExpenses || 0,
      totalStock: totalRevenue || 0,
    };

    const MetricCard: React.FC<MetricCardProps> = ({ title, value, color = 'black' }) => (
      <div className="min-w-60 max-w-96 p-2">
        <div className="flex flex-col rounded-lg bg-gradient-to-tr from-white via-slate-200 justify-center items-center bg-white shadow-sm max-w-96 p-8 my-6 border border-slate-200 relative">
          <h3 className="text-base font-bold mb-2">{title}</h3>
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
          <MetricCard title="Total Margin Profit" value={totalMarginProfit} color="green" />
          <MetricCard title="Total Expenses" value={aggregateMetrics.totalExpenses} color="red" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-4 mt-4">
          <MetricCard title="Total Purchase" value={yearlyTotalPurchases} color="purple" />
          <MetricCard
            title="Total Net Profit"
            value={aggregateMetrics.netprofit}
            color={aggregateMetrics.netprofit >= 0 ? 'green' : 'red'}
          />
          <MetricCard title="Total Stock" value={aggregateMetrics.totalStock} color="orange" />
        </div>

        {/* Daily Sales Chart */}
        <div className="mt-8 border bg-white shadow-sm border-slate-200 w-full p-0 md:p-0">
          <h1 className="text-center text-xl font-semibold mb-4">Daily Sale and Revenue</h1>
          <DailyChart data={rawData} />
        </div>

        <div className="mt-8 border bg-white shadow-sm border-slate-200 w-full p-4">
          <h1 className="text-center text-xl font-semibold mb-4">Monthly Revenue</h1>
          <MonthlyChart data={rawData} />
        </div>
      </div>
    );
};

export default Dashboard;