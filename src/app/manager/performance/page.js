'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';

export default function PerformancePage() {
  const [user, setUser] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchPerformanceData();
    }
  }, [user, selectedPeriod]);

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch(`/api/performance?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout role="manager" user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Performance Management</h1>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading performance data...</div>
        ) : performanceData ? (
          <>
            {/* Revenue and Profitability Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Total Revenue</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">MWK {performanceData.revenue.total.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-1">Period: {selectedPeriod}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Net Profit</h3>
                <p className={`text-3xl font-bold mt-2 ${performanceData.profitability.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  MWK {performanceData.profitability.net_profit.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Profit Margin: {performanceData.profitability.margin.toFixed(1)}%</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Egg Production</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{performanceData.production.eggs.total.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">Total eggs collected</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Meat Production</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">{performanceData.production.meat.total_kg.toFixed(1)}kg</p>
                <p className="text-sm text-gray-500 mt-1">{performanceData.production.meat.birds} batches</p>
              </div>
            </div>

            {/* Production Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Production Breakdown</h2>
              <div className="space-y-4">
                {performanceData.production_breakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${
                        item.type === 'eggs' ? 'bg-blue-500' :
                        item.type === 'meat' ? 'bg-purple-500' : 'bg-amber-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{item.type}</p>
                        <p className="text-sm text-gray-500">
                          {item.type === 'eggs' ? `${item.quantity.toLocaleString()} units` :
                           item.type === 'meat' ? `${item.quantity.toFixed(1)} kg` :
                           `${item.quantity.toFixed(1)} kg`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">MWK {item.revenue.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Breed Performance */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Breed Performance</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Breed Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Efficiency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Production Count
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {performanceData.breeds.map((breed, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {breed.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {breed.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${breed.efficiency}%` }}
                              ></div>
                            </div>
                            <span>{breed.efficiency.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {breed.production_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cost Analysis */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Cost Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Total Costs</h3>
                  <p className="text-3xl font-bold text-red-600">MWK {performanceData.costs.total.toFixed(2)}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Cost per unit: MWK {performanceData.costs.per_unit.toFixed(2)}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Cost Breakdown</h3>
                  <div className="space-y-2">
                    {performanceData.costs.breakdown.map((cost, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 capitalize">{cost.category || 'Other'}</span>
                        <span className="text-sm font-medium text-gray-900">MWK {cost.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Insights</h2>
              <div className="space-y-3">
                {performanceData.insights.improvements.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">No performance data available</div>
        )}
      </div>
    </DashboardLayout>
  );
}
