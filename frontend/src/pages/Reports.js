import React from 'react';
import { useTranslation } from 'react-i18next';

const Reports = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        {t('reports.title')}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {t('reports.sales')}
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Total Revenue:</span>
              <span className="font-bold text-lg">$45,300</span>
            </div>
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Total Transactions:</span>
              <span className="font-bold text-lg">256</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Order Value:</span>
              <span className="font-bold text-lg">$176.95</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {t('reports.revenue')}
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">This Month:</span>
              <span className="font-bold text-lg">$15,000</span>
            </div>
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Last Month:</span>
              <span className="font-bold text-lg">$12,500</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Growth:</span>
              <span className="font-bold text-green-600">+20%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
