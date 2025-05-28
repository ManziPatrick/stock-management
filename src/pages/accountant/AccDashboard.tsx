//@ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import Loader from '../../components/Loader';
import DailyChart from '../../components/Charts/DailyChart';
import MonthlyChart from '../../components/Charts/MonthlyChart';
import YearlySalesChart from '../../components/Charts/YearlyChart';
import { useYearlySaleQuery } from '../../redux/features/management/saleApi';
import { useGetAllPurchasesQuery } from '../../redux/features/management/purchaseApi';
import { useGetAllExpensesQuery } from '../../redux/features/management/expenseApi';
import { useGetAllSaleQuery } from '../../redux/features/management/saleApi';
import { useGetAllProductsQuery } from '../../redux/features/management/productApi';
import { useLazyGetPettyCashQuery, useTopUpPettyCashMutation } from '../../redux/features/management/pettyCashApi';

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

  const [getPettyCash, { data: pettyCashData }] = useLazyGetPettyCashQuery();
  const [topUpPettyCash] = useTopUpPettyCashMutation();
  const { data: products } = useGetAllProductsQuery(query);
  const { data: salesData, isFetching } = useGetAllSaleQuery(query);
  const { data: yearlyData, isLoading } = useYearlySaleQuery(undefined);
  const { data: purchaseData } = useGetAllPurchasesQuery(query);
  const { data: expensesData } = useGetAllExpensesQuery({
    page: 1,
    limit: 100,
  });

  // Fetch petty cash data on component mount
  useEffect(() => {
    //@ts-ignore
    getPettyCash();
  }, [getPettyCash]);

  // Handle modal open and focus
  useEffect(() => {
    if (showTopupModal && amountInputRef.current) {
      setTimeout(() => {
        amountInputRef.current.focus();
      }, 100);
    }
  }, [showTopupModal]);

  // Extract values from API responses - now using the provided JSON structure
  const salesStats = salesData?.meta?.totalSales?.stats || {};
  console.log('salesStats:', salesStats);
  const totalSellingPrice = salesStats.totalSaleAmount || 0;
  const netProfit = salesStats.netProfit || 0;
  const totalCostPrice = salesStats.totalCostPrice || 0;
  const expenses = expensesData?.meta?.stats?.totalExpenses|| 0;
  console.log('expenses:', expenses);
  console.log('Total Selling Price:', totalSellingPrice);
  
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
      //@ts-ignore
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
    totalExpenses: expenses || 0,
    totalStock: totaltotalValue || 0,
  };

  // Component for metric cards with responsive design
  const MetricCard = ({ title, value, color = 'black' }) => (
    <div className="rounded-lg shadow p-4 sm:p-6 bg-gradient-to-tr from-white via-slate-50 to-slate-100 overflow-hidden relative h-auto min-h-[80px] sm:min-h-[100px]">
      <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 opacity-10 rounded-full bg-current transform translate-x-6 -translate-y-6"></div>
      <h3 className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-2 font-medium">{title}</h3>
      <div className="flex items-baseline"> 
        <h1 className="text-lg sm:text-xl font-bold tracking-tight" style={{ color }}>
          {value.toLocaleString()}
        </h1>
        <span className="ml-1 text-xs sm:text-sm font-medium text-gray-500">/frw</span>
      </div>
    </div>
  );

  // Component for tab buttons - made scrollable for small screens
  const TabButton = ({ label, id }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-3 sm:px-6 py-2 text-sm sm:text-base font-medium rounded-t-lg transition-colors whitespace-nowrap ${
        activeTab === id
          ? 'bg-white text-blue-600 border-t border-x border-slate-200 font-semibold'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );

  // Petty Cash Card Component with improved responsiveness
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
        <div className="bg-gradient-to-r from-blue-50 to-white p-4 sm:p-6 border-b border-blue-100">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-0">Petty Cash Management</h3>
            <button
              onClick={() => setShowTopupModal(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center sm:justify-start w-full sm:w-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Top-up
            </button>
          </div>

          <div className="flex flex-col mt-3 sm:mt-4">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-sm sm:text-base text-gray-600">Current Balance</span>
              <span
                className={`text-lg sm:text-xl font-bold ${
                  (pettyCash.balance || 0) < 20000 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {(pettyCash.balance || 0).toLocaleString()} <span className="text-xs sm:text-sm font-normal">/frw</span>
              </span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-gray-500">Last Top-up</span>
              <span className="text-gray-700">{formatDate(pettyCash.lastTopup)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Recent Transactions
          </h4>
          
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.slice(0, 3).map((transaction, index) => (
                <div key={index} className="p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-800">{transaction.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">{formatDate(transaction.date)}</p>
                    </div>
                    <span
                      className={`font-medium text-xs sm:text-sm ${
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
            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-xs sm:text-sm text-gray-500">No recent transactions</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Top-up Modal with improved responsiveness
  const TopupModal = () => {
    // Local state for input field to ensure smooth typing
    const [localAmount, setLocalAmount] = useState(topupAmount);
    const [localDescription, setLocalDescription] = useState(topupDescription);

    // Update parent state when modal closes
    useEffect(() => {
      if (showTopupModal) {
        setLocalAmount(topupAmount);
        setLocalDescription(topupDescription);
      }
    }, [showTopupModal]);

    // Handle form submission with local state
    const handleSubmit = (e) => {
      e.preventDefault();
      
      // Update parent state with local values
      setTopupAmount(localAmount);
      setTopupDescription(localDescription);
      
      // Parse the amount and validate
      const amount = parseFloat(localAmount);
      if (isNaN(amount) || amount <= 0) return;
      
      // Call the API
      topUpPettyCash({
        amount,
        description: localDescription,
      })
        .unwrap()
        .then(() => {
          //@ts-ignore
          getPettyCash();
          setTopupAmount('');
          setTopupDescription('Petty cash top-up');
          setShowTopupModal(false);
        })
        .catch((error) => {
          console.error('Failed to top up petty cash:', error);
        });
    };

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowTopupModal(false);
          }
        }}
      >
        <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Top-up Petty Cash</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3 sm:mb-4">
              <label className="block text-gray-700 mb-1 sm:mb-2 text-sm font-medium">Amount (frw)</label>
              <div className="relative">
                <input
                  ref={amountInputRef}
                  type="text" 
                  value={localAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty value or numeric values with optional decimal
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setLocalAmount(value);
                    }
                  }}
                  onKeyPress={(e) => {
                    // Allow only numbers and decimal point
                    const charCode = e.charCode || e.keyCode;
                    if (
                      (charCode < 48 || charCode > 57) && // 0-9
                      charCode !== 46 && // .
                      charCode !== 13 // Enter
                    ) {
                      e.preventDefault();
                    }
                    // Allow only one decimal point
                    if (charCode === 46 && localAmount.includes('.')) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full p-2 sm:p-3 pl-3 pr-12 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter amount"
                  autoComplete="off"
                />
                <span className="absolute right-3 top-2 sm:top-3 text-gray-400 pointer-events-none text-sm">/frw</span>
              </div>
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-700 mb-1 sm:mb-2 text-sm font-medium">Description</label>
              <input
                type="text"
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter description"
                autoComplete="off"
              />
            </div>
            <div className="flex justify-end space-x-2 sm:space-x-3">
              <button
                type="button"
                onClick={() => setShowTopupModal(false)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center ${
                  !localAmount || parseFloat(localAmount) <= 0 ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                disabled={!localAmount || parseFloat(localAmount) <= 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gray-50">
      {/* Responsive grid layout for metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <MetricCard title="Total Sales Revenue" value={aggregateMetrics.totalSalesRevenue} color="#3B82F6" />
        <MetricCard title="Total Expenses" value={aggregateMetrics.totalExpenses} color="#EF4444" />
        <MetricCard title="Total Purchase" value={yearlyTotalPurchases} color="#8B5CF6" />
        <MetricCard title="Total Stock" value={aggregateMetrics.totalStock} color="#F59E0B" />
        
        {/* Petty Cash card spans full width on small screens */}
        <div className="sm:col-span-2 lg:col-span-1">
          <MetricCard 
            title="Petty Cash" 
            value={(pettyCashData?.data?.pettyCash?.balance || 0)} 
            color="#10B981" 
          />
        </div>
      </div>

      <div className="mt-6 sm:mt-8 lg:hidden">
        <PettyCashCard />
      </div>

      {/* Show the top-up modal */}
      {showTopupModal && <TopupModal />}
    </div>
  );
};

export default Dashboard;