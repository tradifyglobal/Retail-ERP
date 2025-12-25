import React from 'react';
import { useTranslation } from 'react-i18next';

const Orders = () => {
  const { t } = useTranslation();

  const dummyOrders = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      customer: 'John Doe',
      total: '$150.00',
      status: 'completed',
      date: '2024-01-15'
    },
    {
      id: '2',
      orderNumber: 'ORD-002',
      customer: 'Jane Smith',
      total: '$250.50',
      status: 'pending',
      date: '2024-01-16'
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        {t('orders.title')}
      </h1>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                {t('orders.orderNumber')}
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                {t('orders.customer')}
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                {t('orders.total')}
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                {t('orders.status')}
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                {t('orders.date')}
              </th>
            </tr>
          </thead>
          <tbody>
            {dummyOrders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-800">{order.orderNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-800">{order.customer}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-800">{order.total}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
