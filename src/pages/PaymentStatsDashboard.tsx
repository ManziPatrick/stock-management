import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useGetAllSaleQuery } from '../redux/features/management/saleApi';

const PaymentStatsDashboard = () => {
  const [query] = React.useState({
    page: 1,
    limit: 10,
    search: '',
  });

  const { data: salesData, isLoading } = useGetAllSaleQuery(query);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!salesData?.data?.meta?.totalSales) {
    return <div className="p-4">No data available</div>;
  }

  const { dailyStats, monthlyStats, yearlyStats } = salesData.data.meta.totalSales;

  const processPayments = (paymentModes) => {
    const payments = {
      cash: 0,
      momo: 0,
      cheque: 0,
      transfer: 0
    };

    paymentModes?.forEach(payment => {
      const mode = payment.mode?.toLowerCase() || 'cash';
      if (mode in payments) {
        payments[mode] += payment.amount;
      } else if (mode === 'bank transfer') {
        payments.transfer += payment.amount;
      }
    });

    return payments;
  };

  const processDailyPayments = () => {
    return dailyStats.map(day => {
      const payments = processPayments(day.paymentModes);
      const total = Object.values(payments).reduce((sum, amount) => sum + amount, 0);
      
      return {
        date: `${day._id.month}/${day._id.day}`,
        ...payments,
        total
      };
    });
  };

  const processMonthlyPayments = () => {
    return monthlyStats.map(month => {
      const payments = processPayments(month.paymentModes);
      const total = Object.values(payments).reduce((sum, amount) => sum + amount, 0);
      
      return {
        date: `${month._id.year}-${month._id.month}`,
        ...payments,
        total
      };
    });
  };

  const COLORS = ['#64748b', '#3b82f6', '#22c55e', '#6366f1'];
  const currentDayStats = dailyStats[0] || {};
  const currentMonthStats = monthlyStats[0] || {};
  const yearStats = yearlyStats[0] || {};

  const PaymentCards = ({ payments, title }) => (
    <div className="mb-8">
      <div className="text-lg mb-4">{title}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(payments).map(([method, amount]) => (
          <div key={method} className="bg-white p-4 rounded shadow-sm">
            <div className="text-sm text-gray-600 mb-1">
              {method.charAt(0).toUpperCase() + method.slice(1)}
            </div>
            <div>{amount.toLocaleString()} RWF</div>
          </div>
        ))}
        <div className="bg-white p-4 rounded shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Total</div>
          <div>
            {Object.values(payments)
            //@ts-ignore
              .reduce((sum, amount) => sum + amount, 0)
              .toLocaleString()} RWF
          </div>
        </div>
      </div>
    </div>
  );

  const PaymentChart = ({ data, title }) => (
    <div className="bg-white p-4 rounded shadow-sm mb-8">
      <div className="text-lg mb-4">{title}</div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => `${value.toLocaleString()} RWF`} />
            <Legend />
            <Bar dataKey="cash" fill={COLORS[0]} name="Cash" />
            <Bar dataKey="momo" fill={COLORS[1]} name="MoMo" />
            <Bar dataKey="cheque" fill={COLORS[2]} name="Cheque" />
            <Bar dataKey="transfer" fill={COLORS[3]} name="Bank Transfer" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Daily View */}
      <PaymentCards 
        payments={processPayments(currentDayStats.paymentModes)}
        title={`Daily Payment Methods - ${currentDayStats._id?.month}/${currentDayStats._id?.day}/${currentDayStats._id?.year}`}
      />
      <PaymentChart 
        data={processDailyPayments()}
        title="Daily Payment Distribution"
      />

      {/* Monthly View */}
      <PaymentCards 
        payments={processPayments(currentMonthStats.paymentModes)}
        title={`Monthly Payment Methods - ${currentMonthStats._id?.month}/${currentMonthStats._id?.year}`}
      />
      <PaymentChart 
        data={processMonthlyPayments()}
        title="Monthly Payment Distribution"
      />

      {/* Yearly View */}
      <PaymentCards 
        payments={processPayments(yearStats.paymentModes)}
        title={`Yearly Payment Methods - ${yearStats._id?.year}`}
      />
    </div>
  );
};

export default PaymentStatsDashboard;