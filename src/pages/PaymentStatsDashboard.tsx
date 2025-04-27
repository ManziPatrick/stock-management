import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useGetAllSaleQuery } from "../redux/features/management/saleApi";

const SalesStatisticsDashboard = () => {
  const { data: salesData, isLoading } = useGetAllSaleQuery({ page: 1, limit: 10, search: "" });

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // More defensive check - ensure all required data paths exist
  if (!salesData || !salesData.meta || !salesData.meta.totalSales || !salesData.meta.totalSales.stats) {
    return <div className="p-4">No sales data available</div>;
  }

  const stats = salesData.meta.totalSales.stats;
  const transactions = salesData.data || [];

  const COLORS = ["#64748b", "#3b82f6", "#22c55e", "#6366f1", "#a855f7"];
  const formatCurrency = (value) => `${(value || 0).toLocaleString()}`;

  const StatCard = ({ title, value, color }) => (
    <div className={`bg-white rounded-lg shadow p-6 border-t-4 ${color}`}>
      <div className="text-sm text-gray-600 mb-2">{title}</div>
      <div className="text-2xl font-semibold">{formatCurrency(value)}</div>
    </div>
  );

  const PaymentPieChart = ({ stats }) => {
    // Ensure we have valid values by using || 0 for each property
    const pieData = [
      { name: "Cash", value: stats.cashTotal || 0 },
      { name: "Mobile Money", value: stats.momoTotal || 0 },
      { name: "Cheque", value: stats.chequeTotal || 0 },
      { name: "Transfer", value: stats.transferTotal || 0 },
      { name: "Credit Paid", value: stats.creditPaidTotal || 0 }
    ].filter(item => item.value > 0);

    // If no payment data, show a message
    if (pieData.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">No payment data available</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const PaymentMethodsChart = ({ stats }) => {
    const chartData = [
      {
        name: "Payment Methods",
        "Cash": stats.cashTotal || 0,
        "Mobile Money": stats.momoTotal || 0,
        "Cheque": stats.chequeTotal || 0,
        "Transfer": stats.transferTotal || 0,
        "Credit Paid": stats.creditPaidTotal || 0
      }
    ];

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="Cash" fill={COLORS[0]} />
              <Bar dataKey="Mobile Money" fill={COLORS[1]} />
              <Bar dataKey="Cheque" fill={COLORS[2]} />
              <Bar dataKey="Transfer" fill={COLORS[3]} />
              <Bar dataKey="Credit Paid" fill={COLORS[4]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const TransactionsList = ({ transactions }) => {
    if (!transactions || transactions.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <p className="text-gray-500">No recent transactions</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Buyer</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Date</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Payment</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Amount</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td className="px-4 py-2 whitespace-nowrap">{transaction.buyerName}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {transaction.paymentMode ? (
                      transaction.paymentMode.charAt(0).toUpperCase() + transaction.paymentMode.slice(1)
                    ) : "N/A"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {formatCurrency(transaction.totalAmount)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === "paid" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {transaction.status ? transaction.status.toUpperCase() : "N/A"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render the dashboard with focus on payment methods
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard 
          title="Cash" 
          value={stats.cashTotal || 0} 
          color="border-gray-500" 
        />
        <StatCard 
          title="Mobile Money" 
          value={stats.momoTotal || 0} 
          color="border-blue-500" 
        />
        <StatCard 
          title="Cheque" 
          value={stats.chequeTotal || 0} 
          color="border-green-500" 
        />
        <StatCard 
          title="Transfer" 
          value={stats.transferTotal || 0} 
          color="border-indigo-500" 
        />
        <StatCard 
          title="Credit Paid" 
          value={stats.creditPaidTotal || 0} 
          color="border-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentPieChart stats={stats} />
        <PaymentMethodsChart stats={stats} />
        <TransactionsList transactions={transactions} />
      </div>
    </div>
  );
};

export default SalesStatisticsDashboard;