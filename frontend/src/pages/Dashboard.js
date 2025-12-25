import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { reportService } from '../services/services';
import useAuthStore from '../context/authStore';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await reportService.getSalesReport(
        new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
        new Date().toISOString()
      );
      // Transform data for charts
      setSalesData(response.data.data?.sales || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Total Sales', value: '$12,500', change: '+5.2%' },
    { label: 'Orders', value: '256', change: '+2.1%' },
    { label: 'Products', value: '1,342', change: '-0.5%' },
    { label: 'Revenue', value: '$45,300', change: '+12.5%' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        {t('app.dashboard')}
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">{stat.value}</p>
            <p className="text-green-600 text-sm mt-2">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Daily Sales
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalAmount" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Payment Methods
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { method: 'Cash', count: 125 },
              { method: 'Card', count: 89 },
              { method: 'Cheque', count: 34 },
              { method: 'UPI', count: 56 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
