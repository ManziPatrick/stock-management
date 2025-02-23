import React, { useState } from 'react';
import Loader from '../components/Loader';
import DailyChart from '../components/Charts/DailyChart';
import MonthlyChart from '../components/Charts/MonthlyChart';
import YearlySalesChart from '../components/Charts/YearlyChart';
import { useYearlySaleQuery } from '../redux/features/management/saleApi';
import {
  useDeletePurchaseMutation,
  useGetAllPurchasesQuery,
} from '../redux/features/management/purchaseApi';
import { useGetAllSaleQuery } from '../redux/features/management/saleApi';
import { useGetAllProductsQuery } from '../redux/features/management/productApi';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
  });
const { data: products } = useGetAllProductsQuery(query);
  const { data: TotalMagrinProfit, isFetching } = useGetAllSaleQuery(query);
  const totalMarginProfit = TotalMagrinProfit?.meta?.totalSales?.stats?.totalMarginProfit ?? 0;

  const totaltotalValue = products?.meta?.summary?.totalValue || 0;
  const totalSellingPrice = TotalMagrinProfit?.meta?.totalSales?.stats?.totalSellingPrice ?? 0 ;
console.log("hhhbhhhiuk",TotalMagrinProfit)

  const { data: yearlyData, isLoading } = useYearlySaleQuery(undefined);
  const { data: purchaseData } = useGetAllPurchasesQuery(query);
  
  const yearlyTotalPurchases = purchaseData?.meta?.totalPurchasedAmount?.yearlyStats?.[0]?.yearlyTotal || 0;

  if (isLoading) {
    return <Loader />;
  }

  const rawData = yearlyData?.data || [];
  const totalRevenue = yearlyData?.totalRevenue?.totalOverallRevenue || 0;
  const totalOverallStock = yearlyData?.totalRevenue?.totalOverallStock || 0;

  const aggregateMetrics = {
    totalSalesRevenue: totalSellingPrice || 0,
    totalExpenses: rawData[0]?.expenses || 0,
    netprofit: rawData?.[0]?.netProfit || 0,
    totalStock: totaltotalValue|| 0,
  };

  const MetricCard = ({ title, value, color = 'black' }) => (
    
      <div className=" rounded-lg shadow p-6 bg-gradient-to-tr from-white via-slate-200 justify-center items-center bg-white">
        <h3 className="text-sm text-gray-600 mb-2">{title}</h3>
        <h1 className="text-lg font-extrabold" style={{ color }}>
          {value.toLocaleString()} 
        </h1>
        <span className="font-bold absolute right-2 bottom-1">/frw</span>
      </div>
    
  );

  const TabButton = ({ label, id }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-6 py-2 font-medium rounded-t-lg transition-colors ${
        activeTab === id
          ? 'bg-white text-blue-600 border-t border-x border-slate-200'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen ">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 justify-center items-center gap-4 py-4 mb-6">
        <MetricCard title="Total Sales Revenue" value={aggregateMetrics.totalSalesRevenue} color="blue" />
        <MetricCard title="Total Margin Profit" value={totalMarginProfit} color="green" />
        <MetricCard title="Total Expenses" value={aggregateMetrics.totalExpenses} color="red" />
        <MetricCard title="Total Purchase" value={yearlyTotalPurchases} color="purple" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 py-4 lg:grid-cols-4 justify-center items-center gap-4 mb-6">
        
        <MetricCard
          title="Total Net Profit"
          value={aggregateMetrics.netprofit}
          color={aggregateMetrics.netprofit >= 0 ? 'green' : 'red'}
        />
        <MetricCard title="Total Stock" value={aggregateMetrics.totalStock} color="orange" />
      </div>

      <div className="w-full mt-8">
        <div className="flex gap-2 mb-0">
          <TabButton label="Daily View" id="daily" />
          <TabButton label="Monthly View" id="monthly" />
          <TabButton label="Yearly View" id="yearly" />
        </div>
        
        <div className="border bg-white shadow-sm border-slate-200 w-full p-4 rounded-lg rounded-tl-none">
          {activeTab === 'daily' && (
            <>
              <h1 className="text-center text-xl font-semibold mb-4">Daily Sale and Revenue</h1>
              <DailyChart data={rawData} />
            </>
          )}
          {activeTab === 'monthly' && (
            <>
              <h1 className="text-center text-xl font-semibold mb-4">Monthly Revenue</h1>
              <MonthlyChart data={rawData} />
            </>
          )}
          {activeTab === 'yearly' && (
            <>
              <h1 className="text-center text-xl font-semibold mb-4">Yearly Revenue</h1>
              <YearlySalesChart data={rawData} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;