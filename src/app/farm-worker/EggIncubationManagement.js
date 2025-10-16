'use client';

import { useState, useEffect } from 'react';

export default function EggIncubationManagement() {
  const [incubations, setIncubations] = useState([]);
  const [incubators, setIncubators] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [summary, setSummary] = useState(null);
  const [formData, setFormData] = useState({
    egg_batch_name: '',
    breed_id: '',
    incubator_id: '',
    start_date: new Date().toISOString().split('T')[0],
    number_of_eggs: '',
    notes: ''
  });

  useEffect(() => {
    fetchIncubations();
    fetchIncubators();
    fetchBreeds();
  }, []);

  const fetchIncubations = async () => {
    try {
      const response = await fetch('/api/egg-incubation');
      if (response.ok) {
        const data = await response.json();
        setIncubations(data.records);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching egg incubations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncubators = async () => {
    try {
      const response = await fetch('/api/incubators');
      if (response.ok) {
        const data = await response.json();
        setIncubators(data.filter(incubator => incubator.is_active));
      }
    } catch (error) {
      console.error('Error fetching incubators:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/egg-incubation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchIncubations();
        fetchIncubators(); // Refresh incubator capacities
        setShowAddForm(false);
        setFormData({
          egg_batch_name: '',
          breed_id: '',
          incubator_id: '',
          start_date: new Date().toISOString().split('T')[0],
          number_of_eggs: '',
          notes: ''
        });
      } else {
        const errorData = await response.json();
        alert(errorData.message);
      }
    } catch (error) {
      console.error('Error saving egg incubation:', error);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setFormData({
      egg_batch_name: '',
      breed_id: '',
      incubator_id: '',
      start_date: new Date().toISOString().split('T')[0],
      number_of_eggs: '',
      notes: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'hatched': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBreedType = (breedId) => {
    const breed = breeds.find(b => b.id === breedId);
    return breed ? breed.type : 'Unknown';
  };

  const getHatchDays = (breedId) => {
    const breed = breeds.find(b => b.id === breedId);
    return breed && breed.type === 'chicken' ? 21 : breed && breed.type === 'quail' ? 18 : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Egg Incubation Management</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Incubation
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Start Egg Incubation</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Batch Name</label>
                <input
                  type="text"
                  required
                  value={formData.egg_batch_name}
                  onChange={(e) => setFormData({ ...formData, egg_batch_name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  placeholder="e.g., Chicken Batch 001"
                />
              </div>
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
                      {breed.name} ({breed.type}) - {breed.purpose}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Incubator</label>
                <select
                  required
                  value={formData.incubator_id}
                  onChange={(e) => setFormData({ ...formData, incubator_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                >
                  <option value="">Select Incubator</option>
                  {incubators.map((incubator) => (
                    <option key={incubator.id} value={incubator.id}>
                      {incubator.incubator_name} (Capacity: {incubator.capacity}, Available: {incubator.capacity - incubator.current_load})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Number of Eggs</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.number_of_eggs}
                  onChange={(e) => setFormData({ ...formData, number_of_eggs: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  placeholder="Number of eggs to incubate"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  rows="3"
                  placeholder="Optional notes about the incubation"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Incubation
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
            <h3 className="text-lg font-medium text-gray-900">Total Batches</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{summary.total_batches}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Eggs</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{summary.total_eggs}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Hatched Chicks</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">{summary.total_hatched}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Avg Hatch Rate</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{summary.avg_hatch_rate}%</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Egg Incubations</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">Loading incubations...</div>
          ) : incubations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No egg incubations found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Breed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incubator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hatch Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Eggs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hatched
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incubations.map((incubation) => (
                  <tr key={incubation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {incubation.egg_batch_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {incubation.breed_name}
                      <br />
                      <span className="text-xs text-gray-400">
                        {getBreedType(incubation.breed_id)} - {getHatchDays(incubation.breed_id)} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {incubation.incubator_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(incubation.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {incubation.hatch_date ? new Date(incubation.hatch_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {incubation.number_of_eggs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {incubation.hatched_chicks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {incubation.hatching_rate ? `${Number(incubation.hatching_rate).toFixed(1)}%` : '0%'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(incubation.status)}`}>
                        {incubation.status}
                      </span>
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
