'use client';

import { useState, useEffect } from 'react';

export default function PerformanceManagement() {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedPeriod]);

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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Performance Dashboard</h2>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-900">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-600 mt-1">
            MWK {performanceData?.revenue?.total?.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {performanceData?.revenue?.change >= 0 ? '+' : ''}{performanceData?.revenue?.change || 0}% from last period
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-900">Egg Production</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {performanceData?.production?.eggs?.total?.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {performanceData?.production?.eggs?.change >= 0 ? '+' : ''}{performanceData?.production?.eggs?.change || 0}% from last period
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-900">Meat Production</h3>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {performanceData?.production?.meat?.total_kg?.toFixed(1) || '0'}kg
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {performanceData?.production?.meat?.birds?.toLocaleString() || '0'} birds
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-900">Profit Margin</h3>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {performanceData?.profitability?.margin?.toFixed(1) || '0'}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            MWK {performanceData?.profitability?.net_profit?.toLocaleString() || '0'} net profit
          </p>
        </div>
      </div>

      {/* Production Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-base font-medium text-gray-900 mb-3">Production by Product Type</h3>
          <div className="space-y-3">
            {performanceData?.production?.breakdown?.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    item.type === 'eggs' ? 'bg-yellow-500' :
                    item.type === 'meat' ? 'bg-red-500' :
                    item.type === 'manure' ? 'bg-amber-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900 capitalize">{item.type}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {item.type === 'meat' ? `${item.quantity?.toFixed(1)}kg` : item.quantity?.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    MWK {item.revenue?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            )) || (
              <p className="text-sm text-gray-500">No production data available</p>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-base font-medium text-gray-900 mb-3">Breed Performance</h3>
          <div className="space-y-3">
            {performanceData?.breeds?.map((breed, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{breed.name}</p>
                  <p className="text-xs text-gray-500">{breed.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {breed.efficiency?.toFixed(1)}% efficiency
                  </p>
                  <p className="text-xs text-gray-500">
                    {breed.production_count} units
                  </p>
                </div>
              </div>
            )) || (
              <p className="text-sm text-gray-500">No breed performance data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Cost Analysis */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-base font-medium text-gray-900 mb-3">Cost Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              MWK {performanceData?.costs?.total?.toLocaleString() || '0'}
            </p>
            <p className="text-sm text-gray-600">Total Costs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              MWK {performanceData?.costs?.per_unit?.toFixed(2) || '0'}
            </p>
            <p className="text-sm text-gray-600">Cost per Unit</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {performanceData?.costs?.breakdown?.length || '0'}
            </p>
            <p className="text-sm text-gray-600">Cost Categories</p>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-base font-medium text-gray-900 mb-3">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Top Performing Products</h4>
            <ul className="space-y-1">
              {performanceData?.insights?.top_products?.map((product, index) => (
                <li key={index} className="text-sm text-gray-600">
                  • {product.name}: MWK {product.revenue?.toLocaleString()} ({product.margin?.toFixed(1)}% margin)
                </li>
              )) || (
                <li className="text-sm text-gray-500">No data available</li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Areas for Improvement</h4>
            <ul className="space-y-1">
              {performanceData?.insights?.improvements?.map((improvement, index) => (
                <li key={index} className="text-sm text-gray-600">
                  • {improvement.area}: {improvement.suggestion}
                </li>
              )) || (
                <li className="text-sm text-gray-500">No recommendations available</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
