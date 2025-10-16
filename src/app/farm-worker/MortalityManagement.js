'use client';

import { useState, useEffect } from 'react';

export default function MortalityManagement() {
  const [mortalityRecords, setMortalityRecords] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [summary, setSummary] = useState(null);
  const [formData, setFormData] = useState({
    batch_id: '',
    date_recorded: new Date().toISOString().split('T')[0],
    dead_count: '',
    cause: '',
    notes: ''
  });

  useEffect(() => {
    fetchMortalityRecords();
    fetchBatches();
  }, []);

  const fetchMortalityRecords = async () => {
    try {
      const response = await fetch('/api/mortality');
      if (response.ok) {
        const data = await response.json();
        setMortalityRecords(data);

        // Calculate summary
        const totalDeaths = data.reduce((sum, record) => sum + record.dead_count, 0);
        const uniqueBatches = new Set(data.map(record => record.batch_id)).size;
        const avgDeathsPerBatch = uniqueBatches > 0 ? (totalDeaths / uniqueBatches).toFixed(1) : 0;

        setSummary({
          total_deaths: totalDeaths,
          total_records: data.length,
          avg_deaths_per_batch: avgDeathsPerBatch
        });
      }
    } catch (error) {
      console.error('Error fetching mortality records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      if (response.ok) {
        const data = await response.json();
        setBatches(data.filter(batch => batch.status === 'active'));
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/mortality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchMortalityRecords();
        fetchBatches(); // Refresh batch quantities
        setShowAddForm(false);
        setFormData({
          batch_id: '',
          date_recorded: new Date().toISOString().split('T')[0],
          dead_count: '',
          cause: '',
          notes: ''
        });
      } else {
        const errorData = await response.json();
        alert(errorData.message);
      }
    } catch (error) {
      console.error('Error saving mortality record:', error);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setFormData({
      batch_id: '',
      date_recorded: new Date().toISOString().split('T')[0],
      dead_count: '',
      cause: '',
      notes: ''
    });
  };

  const getCauseColor = (cause) => {
    switch (cause?.toLowerCase()) {
      case 'disease': return 'bg-red-100 text-red-800';
      case 'injury': return 'bg-orange-100 text-orange-800';
      case 'starvation': return 'bg-yellow-100 text-yellow-800';
      case 'predation': return 'bg-purple-100 text-purple-800';
      case 'heat stress': return 'bg-pink-100 text-pink-800';
      case 'cold stress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Mortality Tracking</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Record Mortality
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Record Mortality</h2>
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
                      {batch.batch_number} - {batch.breed_name} ({batch.current_quantity} remaining)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date Recorded</label>
                <input
                  type="date"
                  required
                  value={formData.date_recorded}
                  onChange={(e) => setFormData({ ...formData, date_recorded: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dead Count</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.dead_count}
                  onChange={(e) => setFormData({ ...formData, dead_count: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  placeholder="Number of deaths"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cause</label>
                <select
                  value={formData.cause}
                  onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                >
                  <option value="">Select Cause (Optional)</option>
                  <option value="Disease">Disease</option>
                  <option value="Injury">Injury</option>
                  <option value="Starvation">Starvation</option>
                  <option value="Predation">Predation</option>
                  <option value="Heat Stress">Heat Stress</option>
                  <option value="Cold Stress">Cold Stress</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  rows="3"
                  placeholder="Additional notes about the mortality"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Record Mortality
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Deaths</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{summary.total_deaths}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Records</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{summary.total_records}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Avg Deaths/Batch</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{summary.avg_deaths_per_batch}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Mortality Records</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">Loading mortality records...</div>
          ) : mortalityRecords.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No mortality records found</div>
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
                    Breed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dead Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cause
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mortalityRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(record.date_recorded).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.batch_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.breed_name}
                      <br />
                      <span className="text-xs text-gray-400">
                        {record.breed_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {record.dead_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.cause ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCauseColor(record.cause)}`}>
                          {record.cause}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
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
