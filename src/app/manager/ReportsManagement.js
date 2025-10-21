'use client';

import { useState, useEffect } from 'react';

export default function ReportsManagement() {
  const [reportType, setReportType] = useState('production');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const reportTypes = [
    { id: 'production', name: 'Production Report', icon: '📊' },
    { id: 'sales', name: 'Sales Report', icon: '💰' },
    { id: 'financial', name: 'Financial Report', icon: '💰' },
    { id: 'inventory', name: 'Inventory Report', icon: '📦' },
    { id: 'performance', name: 'Performance Report', icon: '📈' }
  ];

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/reports/${reportType}?start=${dateRange.start}&end=${dateRange.end}`
      );
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format = 'pdf') => {
    setExporting(true);
    try {
      const response = await fetch(
        `/api/reports/${reportType}/export?start=${dateRange.start}&end=${dateRange.end}&format=${format}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${dateRange.start}-to-${dateRange.end}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      generateReport();
    }
  }, [reportType, dateRange]);

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'production':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-900">Total Eggs Produced</h3>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {reportData.summary?.total_eggs?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-900">Meat Production</h3>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {reportData.summary?.total_meat_kg?.toFixed(1) || '0'}kg
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-900">Manure Production</h3>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {reportData.summary?.total_manure_kg?.toFixed(1) || '0'}kg
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-base font-medium text-gray-900 mb-3">Production Breakdown by Breed</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Breed</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Eggs</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Meat (kg)</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Manure (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.breed_breakdown?.map((breed) => (
                      <tr key={breed.name || breed.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{breed.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{breed.eggs?.toLocaleString() || '0'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{breed.meat_kg?.toFixed(1) || '0'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{breed.manure_kg?.toFixed(1) || '0'}</td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan="4" className="px-4 py-3 text-center text-sm text-gray-500">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'financial':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-900">Total Revenue</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  MWK {reportData.summary?.total_revenue?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-900">Total Expenses</h3>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  MWK {reportData.summary?.total_expenses?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-900">Net Profit</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  MWK {reportData.summary?.net_profit?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-900">Profit Margin</h3>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {reportData.summary?.profit_margin?.toFixed(1) || '0'}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-base font-medium text-gray-900 mb-3">Revenue by Product</h3>
                <div className="space-y-3">
                  {reportData.revenue_breakdown?.map((item) => (
                    <div key={item.product} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900 capitalize">{item.product}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        MWK {item.amount?.toLocaleString()}
                      </span>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500">No revenue data available</p>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-base font-medium text-gray-900 mb-3">Expenses by Category</h3>
                <div className="space-y-3">
                  {reportData.expense_breakdown?.map((item) => (
                    <div key={item.category} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900 capitalize">{item.category}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        MWK {item.amount?.toLocaleString()}
                      </span>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500">No expense data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'inventory':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-900">Current Stock Value</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  MWK {reportData.summary?.stock_value?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-900">Low Stock Items</h3>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {reportData.summary?.low_stock_count || '0'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-900">Out of Stock</h3>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {reportData.summary?.out_of_stock_count || '0'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-900">Total Items</h3>
                <p className="text-2xl font-bold text-gray-600 mt-1">
                  {reportData.summary?.total_items || '0'}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-base font-medium text-gray-900 mb-3">Inventory Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.inventory_details?.map((item) => (
                      <tr key={item.name}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.current_stock} {item.unit}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">MWK {item.unit_cost?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">MWK {item.total_value?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                            item.status === 'low_stock' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {item.status?.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan="5" className="px-4 py-3 text-center text-sm text-gray-500">No inventory data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">Report type not implemented yet.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              {reportTypes.map((type) => (
                <option key={type.value || type.id} value={type.value || type.id}>
                  {type.icon} {type.label || type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={generateReport}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Export Options */}
      {reportData && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Export Report</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => exportReport('pdf')}
                disabled={exporting}
                className="bg-red-600 text-white px-4 py-2 text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
              <button
                onClick={() => exportReport('excel')}
                disabled={exporting}
                className="bg-green-600 text-white px-4 py-2 text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {exporting ? 'Exporting...' : 'Export Excel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Content */}
      {reportData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 capitalize">
            {reportTypes.find(type => type.value === reportType)?.label || reportType} Report
          </h2>
          {renderReportContent()}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Generating report...</span>
          </div>
        </div>
      )}
    </div>
  );
}
