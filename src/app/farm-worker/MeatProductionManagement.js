'use client';

import { useState, useEffect } from 'react';

export default function MeatProductionManagement() {
  const [meatRecords, setMeatRecords] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [summary, setSummary] = useState(null);
  const [formData, setFormData] = useState({
    batch_id: '',
    production_date: new Date().toISOString().split('T')[0],
    quantity_kg: '',
    average_weight_kg: '',
    quality_rating: 'standard',
    processing_cost: '',
    notes: ''
  });

  useEffect(() => {
    fetchMeatRecords();
    fetchBatches();
  }, []);

  const fetchMeatRecords = async () => {
    try {
      const response = await fetch('/api/meat-production');
      if (response.ok) {
        const data = await response.json();
        setMeatRecords(data.data);
        calculateSummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching meat records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      if (response.ok) {
        const data = await response.json();
        // Only show active batches, especially those ready for meat production
        setBatches(data.filter(batch => batch.status === 'active'));
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const calculateSummary = (records) => {
    const totalRecords = records.length;
    const totalQuantity = records.reduce((sum, record) => sum + parseFloat(record.quantity_kg || 0), 0);
    const totalProcessingCost = records.reduce((sum, record) => sum + parseFloat(record.processing_cost || 0), 0);
    const avgWeight = records.length > 0
      ? records.reduce((sum, record) => sum + parseFloat(record.average_weight_kg || 0), 0) / records.length
      : 0;

    const qualityCounts = records.reduce((acc, record) => {
      acc[record.quality_rating] = (acc[record.quality_rating] || 0) + 1;
      return acc;
    }, {});

    const monthlyProduction = records.reduce((acc, record) => {
      const month = new Date(record.production_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      acc[month] = (acc[month] || 0) + parseFloat(record.quantity_kg || 0);
      return acc;
    }, {});

    setSummary({
      total_records: totalRecords,
      total_quantity: totalQuantity,
      total_processing_cost: totalProcessingCost,
      avg_weight: avgWeight,
      quality_counts: qualityCounts,
      monthly_production: monthlyProduction
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/meat-production', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchMeatRecords();
        setShowAddForm(false);
        setFormData({
          batch_id: '',
          production_date: new Date().toISOString().split('T')[0],
          quantity_kg: '',
          average_weight_kg: '',
          quality_rating: 'standard',
          processing_cost: '',
          notes: ''
        });
      } else {
        const errorData = await response.json();
        alert(errorData.error);
      }
    } catch (error) {
      console.error('Error saving meat record:', error);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setFormData({
      batch_id: '',
      production_date: new Date().toISOString().split('T')[0],
      quantity_kg: '',
      average_weight_kg: '',
      quality_rating: 'standard',
      processing_cost: '',
      notes: ''
    });
  };

  const getQualityColor = (rating) => {
    switch (rating) {
      case 'premium': return 'bg-green-100 text-green-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'economy': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Meat Production Management</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Record Meat Production
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Record Meat Production</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Batch</label>
                <select
                  required
                  value={formData.batch_id}
                  onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                >
                  <option value="">Select Batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_number} - {batch.breed_name} ({batch.level}) - {batch.current_quantity} birds
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Production Date</label>
                <input
                  type="date"
                  required
                  value={formData.production_date}
                  onChange={(e) => setFormData({ ...formData, production_date: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity (kg)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={formData.quantity_kg}
                  onChange={(e) => setFormData({ ...formData, quantity_kg: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  placeholder="Total meat weight in kg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Average Weight per Bird (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.average_weight_kg}
                  onChange={(e) => setFormData({ ...formData, average_weight_kg: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  placeholder="Optional: average weight per bird"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quality Rating</label>
                <select
                  value={formData.quality_rating}
                  onChange={(e) => setFormData({ ...formData, quality_rating: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                >
                  <option value="premium">Premium</option>
                  <option value="standard">Standard</option>
                  <option value="economy">Economy</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Processing Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.processing_cost}
                  onChange={(e) => setFormData({ ...formData, processing_cost: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  placeholder="Cost of processing/slaughtering"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  rows="3"
                  placeholder="Optional notes about the meat production"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Record Production
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Records</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{summary.total_records}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Quantity</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{summary.total_quantity.toFixed(2)} kg</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Processing Cost</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">${summary.total_processing_cost.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Avg Bird Weight</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">{summary.avg_weight.toFixed(2)} kg</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Meat Production Records</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">Loading meat production records...</div>
          ) : meatRecords.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No meat production records found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processing Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {meatRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(record.production_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.batch_number}
                      <br />
                      <span className="text-xs text-gray-400">
                        {record.breed_name} ({record.level})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.quantity_kg} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.average_weight_kg ? `${record.average_weight_kg} kg` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getQualityColor(record.quality_rating)}`}>
                        {record.quality_rating}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${record.processing_cost || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
