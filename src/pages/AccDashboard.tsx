import React, { useState, useEffect, useRef } from 'react';
import Loader from '../components/Loader';
import DailyChart from '../components/Charts/DailyChart';
import MonthlyChart from '../components/Charts/MonthlyChart';
import YearlySalesChart from '../components/Charts/YearlyChart';
import { useYearlySaleQuery } from '../redux/features/management/saleApi';
import { useGetAllPurchasesQuery } from '../redux/features/management/purchaseApi';
import { useGetAllExpensesQuery } from '../redux/features/management/expenseApi';
import { useGetAllSaleQuery } from '../redux/features/management/saleApi';
import { useGetAllProductsQuery } from '../redux/features/management/productApi';
import { useLazyGetPettyCashQuery, useTopUpPettyCashMutation } from '../redux/features/management/pettyCashApi';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupDescription, setTopupDescription] = useState('Petty cash top-up');
  const amountInputRef = useRef(null);
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
  });

  // Fetch data using Redux Toolkit Query
  const [getPettyCash, { data: pettyCashData }] = useLazyGetPettyCashQuery();
  const [topUpPettyCash] = useTopUpPettyCashMutation();
  const { data: products } = useGetAllProductsQuery(query);
  const { data: TotalMagrinProfit, isFetching } = useGetAllSaleQuery(query);
  const { data: yearlyData, isLoading } = useYearlySaleQuery(undefined);
  const { data: purchaseData } = useGetAllPurchasesQuery(query);
  const { data: expensesData } = useGetAllExpensesQuery({
    page: 1,
    limit: 100,
  });

  // Fetch petty cash data on component mount
  useEffect(() => {
    getPettyCash();
  }, [getPettyCash]);

  // Focus input when modal opens
  useEffect(() => {
    if (showTopupModal && amountInputRef.current) {
      setTimeout(() => {
        amountInputRef.current.focus();
      }, 100);
    }
  }, [showTopupModal]);

  // Extract values from API responses
  const totalSellingPrice = TotalMagrinProfit?.meta?.totalSales?.stats?.totalSellingPrice ?? 0;
  const totaltotalValue = products?.meta?.summary?.totalValue || 0;
  const yearlyTotalPurchases = purchaseData?.meta?.totalPurchasedAmount?.yearlyStats?.[0]?.yearlyTotal || 0;

  // Function to handle petty cash top-up
  const handleTopup = async (e) => {
    e.preventDefault();
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      await topUpPettyCash({
        amount,
        description: topupDescription,
      }).unwrap();

      // Refetch petty cash data after successful top-up
      getPettyCash();
      setTopupAmount('');
      setTopupDescription('Petty cash top-up');
      setShowTopupModal(false);
    } catch (error) {
      console.error('Failed to top up petty cash:', error);
      // Handle error (show notification/toast)
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  const rawData = yearlyData?.data || [];
  const totalRevenue = yearlyData?.totalRevenue?.totalOverallRevenue || 0;

  const aggregateMetrics = {
    totalSalesRevenue: totalSellingPrice || 0,
    totalExpenses: rawData[0]?.expenses || 0,
    totalStock: totaltotalValue || 0,
  };

  // Component for metric cards
  const MetricCard = ({ title, value, color = 'black' }) => (
    <div className="rounded-lg shadow p-6 bg-gradient-to-tr from-white via-slate-50 to-slate-100 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-20 h-20 opacity-10 rounded-full bg-current transform translate-x-6 -translate-y-6"></div>
      <h3 className="text-gray-600 mb-2 font-medium">{title}</h3>
      <div className="flex items-baseline">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color }}>
          {value.toLocaleString()}
        </h1>
        <span className="ml-1 text-sm font-medium text-gray-500">/frw</span>
      </div>
    </div>
  );

  // Component for tab buttons
  const TabButton = ({ label, id }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-6 py-2 font-medium rounded-t-lg transition-colors ${
        activeTab === id
          ? 'bg-white text-blue-600 border-t border-x border-slate-200 font-semibold'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );

  // Petty Cash Card Component
  const PettyCashCard = () => {
    // Safe date formatting function that handles invalid dates
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      
      try {
        const date = new Date(dateString);
        // Check if date is valid before using toISOString
        if (isNaN(date.getTime())) {
          return 'Invalid Date';
        }
        return date.toISOString().split('T')[0];
      } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
      }
    };

    // Extract petty cash data safely
    const pettyCash = pettyCashData?.data?.pettyCash || {
      balance: 0,
      lastTopup: null,
      transactions: [],
    };

    // Use optional chaining to safely access transactions
    const transactions = pettyCash?.transactions || [];

    return (
      <div className="rounded-lg shadow bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-white p-6 border-b border-blue-100">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Petty Cash Management</h3>
            <button
              onClick={() => setShowTopupModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Top-up
            </button>
          </div>

          <div className="flex flex-col mt-4">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-gray-600">Current Balance</span>
              <span
                className={`text-xl font-bold ${
                  (pettyCash.balance || 0) < 20000 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {(pettyCash.balance || 0).toLocaleString()} <span className="text-sm font-normal">/frw</span>
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Last Top-up</span>
              <span className="text-gray-700">{formatDate(pettyCash.lastTopup)}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Recent Transactions
          </h4>
          
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.slice(0, 3).map((transaction, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{transaction.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(transaction.date)}</p>
                    </div>
                    <span
                      className={`font-medium text-sm ${
                        transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.amount >= 0 ? '+' : ''}{(transaction.amount || 0).toLocaleString()} /frw
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-sm text-gray-500">No recent transactions</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Top-up Modal
  const TopupModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => {
      if (e.target === e.currentTarget) {
        setShowTopupModal(false);
      }
    }}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Top-up Petty Cash</h2>
        <form onSubmit={handleTopup}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-medium">Amount (frw)</label>
            <div className="relative">
              <input
                ref={amountInputRef}
                type="text" // Changed from number to text to prevent auto-disable
                value={topupAmount}
                onChange={(e) => {
                  // Only allow numbers
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setTopupAmount(value);
                  }
                }}
                className="w-full p-3 pl-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter amount"
                autoComplete="off" // Prevent browser autocomplete
              />
              <span className="absolute right-3 top-3 text-gray-400 pointer-events-none">/frw</span>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-medium">Description</label>
            <input
              type="text"
              value={topupDescription}
              onChange={(e) => setTopupDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter description"
              autoComplete="off" // Prevent browser autocomplete
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowTopupModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              disabled={!topupAmount || parseFloat(topupAmount) <= 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Redesigned metric cards layout - removed Total Margin Profit and Net Profit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <MetricCard title="Total Sales Revenue" value={aggregateMetrics.totalSalesRevenue} color="#3B82F6" />
        <MetricCard title="Total Expenses" value={aggregateMetrics.totalExpenses} color="#EF4444" />
        <MetricCard title="Total Purchase" value={yearlyTotalPurchases} color="#8B5CF6" />
      </div>

      {/* Second row with 2 cards - Total Stock and Petty Cash (wider) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <MetricCard title="Total Stock" value={aggregateMetrics.totalStock} color="#F59E0B" />
        <div className="md:col-span-2">
          <PettyCashCard />
        </div>
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
              <h1 className="text-center text-xl font-semibold mb-4">Daily Sale and Purchases</h1>
              <DailyChart data={yearlyData?.data || []} />
            </>
          )}
          {activeTab === 'monthly' && (
            <>
              <h1 className="text-center text-xl font-semibold mb-4">Monthly Sale and Purchases</h1>
              <MonthlyChart data={yearlyData?.data || []} />
            </>
          )}
          {activeTab === 'yearly' && (
            <>
              <h1 className="text-center text-xl font-semibold mb-4">Yearly Sale and Purchases</h1>
              <YearlySalesChart data={yearlyData?.data || []} />
            </>
          )}
        </div>
      </div>

      {/* Show the top-up modal */}
      {showTopupModal && <TopupModal />}
    </div>
  );
};

export default Dashboard;