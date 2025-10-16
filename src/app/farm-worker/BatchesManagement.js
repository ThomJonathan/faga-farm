'use client';

import { useState, useEffect } from 'react';

export default function BatchesManagement() {
  const [batches, setBatches] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [formData, setFormData] = useState({
    breed_id: '',
    house_id: '',
    date_produced: '',
    initial_quantity: '',
    current_quantity: '',
    dead_count: 0,
    level: 'chick',
    status: 'active'
  });

  useEffect(() => {
    fetchBatches();
    fetchBreeds();
    fetchHouses();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBreeds = async () => {
    try {
      const response = await fetch('/api/breeds');
      if (response.ok) {
        const data = await response.json();
        setBreeds(data);
      }
    } catch (error) {
      console.error('Error fetching breeds:', error);
    }
  };

  const fetchHouses = async () => {
    try {
      const response = await fetch('/api/houses');
      if (response.ok) {
        const data = await response.json();
        setHouses(data);
      }
    } catch (error) {
      console.error('Error fetching houses:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingBatch ? `/api/batches/${editingBatch.id}` : '/api/batches';
      const method = editingBatch ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchBatches();
        fetchHouses(); // Refresh houses to update occupancy
        setShowAddForm(false);
        setEditingBatch(null);
        setFormData({
          breed_id: '',
          house_id: '',
          date_produced: '',
          initial_quantity: '',
          current_quantity: '',
          dead_count: 0,
          level: 'chick',
          status: 'active'
        });
      } else {
        const errorData = await response.json();
        alert(errorData.message);
      }
    } catch (error) {
      console.error('Error saving batch:', error);
    }
  };

  const handleEdit = (batch) => {
    setEditingBatch(batch);
    setFormData({
      breed_id: batch.breed_id || '',
      house_id: batch.house_id || '',
      date_produced: batch.date_produced ? batch.date_produced.split('T')[0] : '',
      initial_quantity: batch.initial_quantity,
      current_quantity: batch.current_quantity,
      dead_count: batch.dead_count || 0,
      level: batch.level,
      status: batch.status
    });
    setShowAddForm(true);
  };

  const handleDelete = async (batchId) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;

    try {
      const response = await fetch(`/api/batches/${batchId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchBatches();
        fetchHouses(); // Refresh houses to update occupancy
      }
    } catch (error) {
      console.error('Error deleting batch:', error);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingBatch(null);
    setFormData({
      breed_id: '',
      house_id: '',
      date_produced: '',
      initial_quantity: '',
      current_quantity: '',
      dead_count: 0,
      level: 'chick',
      status: 'active'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'chick': return 'bg-yellow-100 text-yellow-800';
      case 'grower': return 'bg-orange-100 text-orange-800';
      case 'finisher': return 'bg-purple-100 text-purple-800';
      case 'adult': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Batches Management</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Batch
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingBatch ? 'Edit Batch' : 'Add New Batch'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Breed</label>
                <select
                  required
                  value={formData.breed_id}
                  onChange={(e) => setFormData({ ...formData, breed_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                >
                  <option value="">Select Breed</option>
                  {breeds.map((breed) => (
                    <option key={breed.id} value={breed.id}>
                      {breed.name} ({breed.type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">House</label>
                <select
                  required
                  value={formData.house_id}
                  onChange={(e) => setFormData({ ...formData, house_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                >
                  <option value="">Select House</option>
                  {houses.filter(house => house.is_active).map((house) => (
                    <option key={house.id} value={house.id}>
                      {house.name} ({house.type}) - Available: {house.capacity - house.current_occupancy}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date Produced</label>
                <input
                  type="date"
                  required
                  value={formData.date_produced}
                  onChange={(e) => setFormData({ ...formData, date_produced: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Initial Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.initial_quantity}
                  onChange={(e) => setFormData({ ...formData, initial_quantity: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  placeholder="Enter initial quantity"
                />
              </div>
              {editingBatch && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Quantity</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.current_quantity}
                      onChange={(e) => setFormData({ ...formData, current_quantity: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                      placeholder="Enter current quantity"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dead Count</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.dead_count}
                      onChange={(e) => setFormData({ ...formData, dead_count: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                      placeholder="Enter dead count"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Level</label>
                <select
                  required
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                >
                  <option value="chick">Chick</option>
                  <option value="grower">Grower</option>
                  <option value="finisher">Finisher</option>
                  <option value="adult">Adult</option>
                </select>
              </div>
              {editingBatch && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingBatch ? 'Update Batch' : 'Add Batch'}
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
          <h2 className="text-lg font-medium text-gray-900">Batches List</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">Loading batches...</div>
          ) : batches.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No batches found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Breed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    House
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Initial Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dead Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {batches.map((batch) => (
                  <tr key={batch.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {batch.batch_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch.breed_name} ({batch.breed_type})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch.house_name} ({batch.house_type})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(batch.level)}`}>
                        {batch.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch.initial_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch.current_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch.dead_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(batch.status)}`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(batch)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(batch.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
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
