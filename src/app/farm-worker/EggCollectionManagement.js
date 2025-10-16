'use client';

import { useState, useEffect } from 'react';

export default function EggCollectionManagement() {
  const [collections, setCollections] = useState([]);
  const [batches, setBatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'week', 'month', 'year'
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    batch_id: '',
    collection_date: new Date().toISOString().split('T')[0],
    quantity: '',
    egg_type: 'sales',
    collected_by: '',
    notes: ''
  });

  useEffect(() => {
    fetchCollections();
    fetchBatches();
    fetchUsers();
  }, [filter, filterDate]);

  const fetchCollections = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('filter', filter);
        params.append('date', filterDate);
      }

      const response = await fetch(`/api/egg-collection?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCollections(data.records);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching egg collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      if (response.ok) {
        const data = await response.json();
        // Only show active batches
        setBatches(data.filter(batch => batch.status === 'active'));
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      // For now, we'll use a simple approach - in a real app you'd have a users API
      // This is a placeholder - you might want to create a users API endpoint
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const userData = await response.json();
        setUsers([userData]); // Just current user for now
        setFormData(prev => ({ ...prev, collected_by: userData.id }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/egg-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchCollections();
        setShowAddForm(false);
        setFormData({
          batch_id: '',
          collection_date: new Date().toISOString().split('T')[0],
          quantity: '',
          egg_type: 'sales',
          collected_by: formData.collected_by, // Keep the current user
          notes: ''
        });
      } else {
        const errorData = await response.json();
        alert(errorData.message);
      }
    } catch (error) {
      console.error('Error saving egg collection:', error);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setFormData({
      batch_id: '',
      collection_date: new Date().toISOString().split('T')[0],
      quantity: '',
      egg_type: 'sales',
      collected_by: formData.collected_by,
      notes: ''
    });
  };

  const getEggTypeColor = (type) => {
    switch (type) {
      case 'incubation': return 'bg-blue-100 text-blue-800';
      case 'sales': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Egg Collection Management</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Record Collection
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Eggs Collected</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{summary.total_quantity}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Collection Records</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{summary.total_records}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">For Incubation</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {summary.by_egg_type.incubation || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Filter Collections</h2>
        <div className="flex space-x-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">Filter Type</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          {filter !== 'all' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
              />
            </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Record Egg Collection</h2>
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
                      {batch.batch_number} - {batch.breed_name} ({batch.level})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Collection Date</label>
                <input
                  type="date"
                  required
                  value={formData.collection_date}
                  onChange={(e) => setFormData({ ...formData, collection_date: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  placeholder="Number of eggs collected"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Egg Type</label>
                <select
                  required
                  value={formData.egg_type}
                  onChange={(e) => setFormData({ ...formData, egg_type: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                >
                  <option value="sales">For Sales</option>
                  <option value="incubation">For Incubation</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  rows="3"
                  placeholder="Optional notes about the collection"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Record Collection
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

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Egg Collections</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">Loading collections...</div>
          ) : collections.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No egg collections found</div>
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
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collected By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {collections.map((collection) => (
                  <tr key={collection.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(collection.collection_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {collection.batch_number}
                      <br />
                      <span className="text-xs text-gray-400">
                        {collection.breed_name} ({collection.level})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {collection.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEggTypeColor(collection.egg_type)}`}>
                        {collection.egg_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {collection.collected_by_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {collection.notes || '-'}
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
