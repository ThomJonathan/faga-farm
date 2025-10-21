'use client';

import { useState, useEffect } from 'react';

export default function EggIncubationManagement() {
  const [incubations, setIncubations] = useState([]);
  const [incubators, setIncubators] = useState([]);
  const [eggCollections, setEggCollections] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showHatchForm, setShowHatchForm] = useState(false);
  const [selectedIncubation, setSelectedIncubation] = useState(null);
  const [summary, setSummary] = useState(null);
  const [formData, setFormData] = useState({
    egg_batch_name: '',
    collection_id: '',
    incubator_id: '',
    start_date: new Date().toISOString().split('T')[0],
    number_of_eggs: '',
    notes: ''
  });
  const [hatchedChicks, setHatchedChicks] = useState(0);

  useEffect(() => {
    fetchIncubations();
    fetchIncubators();
    fetchEggCollections();
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

  const fetchEggCollections = async () => {
    try {
      const response = await fetch('/api/egg-collection');
      if (response.ok) {
        const data = await response.json();
        // Filter for incubation type collections
        setEggCollections(data.records.filter(collection => collection.egg_type === 'incubation'));
      }
    } catch (error) {
      console.error('Error fetching egg collections:', error);
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
        fetchIncubators();
        fetchEggCollections(); // Refresh egg collections after incubation starts
        setShowAddForm(false);
        setFormData({
          egg_batch_name: '',
          collection_id: '',
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

  const handleHatch = async (incubationId, hatchData) => {
    try {
      const response = await fetch('/api/egg-incubation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: incubationId,
          ...hatchData
        }),
      });

      if (response.ok) {
        fetchIncubations();
        fetchIncubators(); // Refresh incubator capacities
        setShowHatchForm(false);
        setSelectedIncubation(null);
        setHatchedChicks(0);
      } else {
        const errorData = await response.json();
        alert(errorData.message);
      }
    } catch (error) {
      console.error('Error recording hatch:', error);
    }
  };

  const handleCreateBatchFromHatchedChicks = async (incubation) => {
    // Navigate to batch creation with pre-filled data
    const batchData = {
      breed_id: incubation.breed_id,
      date_produced: new Date().toISOString().split('T')[0],
      initial_quantity: incubation.hatched_chicks,
      level: 'chick',
      notes: `Hatched from incubation batch: ${incubation.egg_batch_name}`,
      incubation_id: incubation.id // Track which incubation this batch came from
    };

    // Store in sessionStorage for the batch creation form
    sessionStorage.setItem('newBatchData', JSON.stringify(batchData));

    // Navigate to batches page
    window.location.href = '/farm-worker/batches';
  };

  const resetForm = () => {
    setShowAddForm(false);
    setFormData({
      egg_batch_name: '',
      collection_id: '',
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

  const getDaysRemaining = (startDate, breedId) => {
    const hatchDays = getHatchDays(breedId);
    if (hatchDays === 0) return null;

    const start = new Date(startDate);
    const today = new Date();
    const daysPassed = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    const daysRemaining = hatchDays - daysPassed;

    return daysRemaining;
  };

  const getCollectionInfo = (collectionId) => {
    const collection = eggCollections.find(c => c.id === collectionId);
    return collection ? `${collection.batch_number} - ${collection.breed_name}` : 'Unknown';
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
                <label className="block text-sm font-medium text-gray-700">Egg Collection</label>
                <select
                  required
                  value={formData.collection_id}
                  onChange={(e) => setFormData({ ...formData, collection_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                >
                  <option value="">Select Egg Collection</option>
                  {eggCollections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.batch_number} - {collection.breed_name} ({collection.quantity} eggs available)
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

      {/* Active Incubations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {incubations.filter(inc => inc.status !== 'hatched').map((incubation) => (
          <div key={incubation.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{incubation.egg_batch_name}</h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(incubation.status)}`}>
                {incubation.status}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Collection:</strong> {getCollectionInfo(incubation.collection_id)}</p>
              <p><strong>Incubator:</strong> {incubation.incubator_name}</p>
              <p><strong>Eggs:</strong> {incubation.number_of_eggs}</p>
              <p><strong>Start Date:</strong> {new Date(incubation.start_date).toLocaleDateString()}</p>

              {(() => {
                const daysRemaining = getDaysRemaining(incubation.start_date, incubation.breed_id);
                return daysRemaining !== null ? (
                  <p className={daysRemaining <= 0 ? 'text-red-600 font-semibold' : daysRemaining <= 3 ? 'text-orange-600 font-semibold' : ''}>
                    <strong>Days to Hatch:</strong> {daysRemaining <= 0 ? 'Overdue' : daysRemaining}
                  </p>
                ) : null;
              })()}
            </div>

            {incubation.status !== 'hatched' && (
              <button
                onClick={() => {
                  setSelectedIncubation(incubation);
                  setShowHatchForm(true);
                  setHatchedChicks(0);
                }}
                className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Record Hatch
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Hatch Form Modal */}
      {showHatchForm && selectedIncubation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Record Hatch - {selectedIncubation.egg_batch_name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Total eggs: {selectedIncubation.number_of_eggs}
              </p>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const unhatchedChicks = selectedIncubation.number_of_eggs - hatchedChicks;

              handleHatch(selectedIncubation.id, {
                hatch_date: e.target.hatch_date.value,
                hatched_chicks: hatchedChicks,
                unhatched_chicks: unhatchedChicks,
                notes: e.target.notes.value
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hatch Date</label>
                  <input
                    type="date"
                    name="hatch_date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hatched Chicks</label>
                  <input
                    type="number"
                    name="hatched_chicks"
                    required
                    min="0"
                    max={selectedIncubation.number_of_eggs}
                    value={hatchedChicks}
                    onChange={(e) => setHatchedChicks(parseInt(e.target.value) || 0)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                    placeholder="Enter number of hatched chicks"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Unhatched eggs: {selectedIncubation.number_of_eggs - hatchedChicks}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    name="notes"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                    rows="3"
                    placeholder="Optional notes about the hatch"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Record Hatch
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowHatchForm(false);
                    setSelectedIncubation(null);
                    setHatchedChicks(0);
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Active Incubations</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {incubations.filter(inc => inc.status !== 'hatched').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Eggs</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{summary.total_eggs}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Hatched Chicks</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">{summary.total_hatched}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Incubation History</h2>
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
                    Collection
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
                      {getCollectionInfo(incubation.collection_id)}
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
