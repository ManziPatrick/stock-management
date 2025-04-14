import React, { useState } from "react";
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
  const [activeView, setActiveView] = useState("daily");
  const { data: salesData, isLoading } = useGetAllSaleQuery({ page: 1, limit: 10, search: "" });

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!salesData?.meta?.totalSales) {
    return <div className="p-4">No data available</div>;
  }

  const COLORS = ["#64748b", "#3b82f6", "#22c55e", "#6366f1"];
  const formatCurrency = (value) => `${value.toLocaleString()}`;

  const StatCard = ({ title, value, color }) => (
    <div className={`bg-white rounded-lg shadow p-6 border-t-4 ${color}`}>
      <div className="text-sm text-gray-600 mb-2">{title}</div>
      <div className="text-2xl font-semibold">{formatCurrency(value)}</div>
    </div>
  );

  const PaymentPieChart = ({ data, title }) => {
    const pieData = [
      { name: "Cash", value: data.cashTotal || 0 },
      { name: "Mobile Money", value: data.momoTotal || 0 },
      { name: "Cheque", value: data.chequeTotal || 0 },
      { name: "Transfer", value: data.transferTotal || 0 }
    ].filter(item => item.value > 0);

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
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

  const TimeSeriesChart = ({ data, title }) => {
    const formattedData = data.map(item => ({
      date: `${item._id.day || item._id.month || item._id.year}`,
      Cash: item.cashTotal,
      "Mobile Money": item.momoTotal,
      Cheque: item.chequeTotal,
      Transfer: item.transferTotal
    }));

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="Cash" fill={COLORS[0]} stackId="stack" />
              <Bar dataKey="Mobile Money" fill={COLORS[1]} stackId="stack" />
              <Bar dataKey="Cheque" fill={COLORS[2]} stackId="stack" />
              <Bar dataKey="Transfer" fill={COLORS[3]} stackId="stack" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const PaymentSummary = ({ data, title }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="border-b pb-2">
            <div className="font-semibold text-gray-800">
              {item._id.day ? `${item._id.day}/` : ""}
              {item._id.month ? `${item._id.month}/` : ""}
              {item._id.year}
            </div>
            {item.payments.map((payment, i) => (
              <div key={i} className="text-gray-600">
                {payment.mode.charAt(0).toUpperCase() + payment.mode.slice(1)}:{" "}
                <span className="font-medium">{formatCurrency(payment.total)}</span> ({payment.count} transactions)
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const { stats, dailyStats, monthlyStats, yearlyStats } = salesData.meta.totalSales;

  // Calculate total amounts for each payment method across all time periods
  // We'll use the current view's data to display the relevant totals
  let viewData;
  if (activeView === "daily") {
    viewData = dailyStats;
  } else if (activeView === "monthly") {
    viewData = monthlyStats;
  } else {
    viewData = yearlyStats;
  }

  // Get the most recent data point for the current view
  const currentData = viewData[0] || {};

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Replaced cards section with payment method totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Cash Total" value={currentData.cashTotal || 0} color="border-gray-500" />
        <StatCard title="Mobile Money Total" value={currentData.momoTotal || 0} color="border-blue-500" />
        <StatCard title="Cheque Total" value={currentData.chequeTotal || 0} color="border-green-500" />
        <StatCard title="Transfer Total" value={currentData.transferTotal || 0} color="border-indigo-500" />
      </div>

      <div className="flex space-x-4 mb-6">
        {["daily", "monthly", "yearly"].map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`px-4 py-2 rounded-lg ${
              activeView === view ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)} View
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeView === "daily" && (
          <>
            <TimeSeriesChart data={dailyStats} title="Daily Sales Distribution" />
            <PaymentPieChart data={dailyStats[0] || {}} title="Today's Payment Distribution" />
            <PaymentSummary data={dailyStats} title="Daily Payment Summary" />
          </>
        )}
        {activeView === "monthly" && (
          <>
            <TimeSeriesChart data={monthlyStats} title="Monthly Sales Distribution" />
            <PaymentPieChart data={monthlyStats[0] || {}} title="Current Month's Payment Distribution" />
            <PaymentSummary data={monthlyStats} title="Monthly Payment Summary" />
          </>
        )}
        {activeView === "yearly" && (
          <>
            <TimeSeriesChart data={yearlyStats} title="Yearly Sales Distribution" />
            <PaymentPieChart data={yearlyStats[0] || {}} title="Current Year's Payment Distribution" />
            <PaymentSummary data={yearlyStats} title="Yearly Payment Summary" />
          </>
        )}
      </div>
    </div>
  );
};

export default SalesStatisticsDashboard;