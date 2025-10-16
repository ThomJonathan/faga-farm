'use client';

import { useState, useEffect } from 'react';

export default function BreedsManagement() {
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBreed, setEditingBreed] = useState(null);
  const [formData, setFormData] = useState({
    type: 'chicken',
    name: '',
    purpose: 'layer',
    description: ''
  });

  useEffect(() => {
    fetchBreeds();
  }, []);

  const fetchBreeds = async () => {
    try {
      const response = await fetch('/api/breeds');
      if (response.ok) {
        const data = await response.json();
        setBreeds(data);
      }
    } catch (error) {
      console.error('Error fetching breeds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingBreed ? `/api/breeds/${editingBreed.id}` : '/api/breeds';
      const method = editingBreed ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchBreeds();
        setShowAddForm(false);
        setEditingBreed(null);
        setFormData({
          type: 'chicken',
          name: '',
          purpose: 'layer',
          description: ''
        });
      }
    } catch (error) {
      console.error('Error saving breed:', error);
    }
  };

  const handleEdit = (breed) => {
    setEditingBreed(breed);
    setFormData({
      type: breed.type,
      name: breed.name,
      purpose: breed.purpose,
      description: breed.description
    });
    setShowAddForm(true);
  };

  const handleDelete = async (breedId) => {
    if (!confirm('Are you sure you want to delete this breed?')) return;

    try {
      const response = await fetch(`/api/breeds/${breedId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchBreeds();
      }
    } catch (error) {
      console.error('Error deleting breed:', error);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingBreed(null);
    setFormData({
      type: 'chicken',
      name: '',
      purpose: 'layer',
      description: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Breeds Management</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Breed
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingBreed ? 'Edit Breed' : 'Add New Breed'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                >
                  <option value="chicken">Chicken</option>
                  <option value="quail">Quail</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Purpose</label>
                <select
                  required
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                >
                  <option value="layer">Layer</option>
                  <option value="broiler">Broiler</option>
                  <option value="dual_purpose">Dual Purpose</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Breed Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  placeholder="Enter breed name"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  placeholder="Enter breed description"
                  rows="3"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingBreed ? 'Update Breed' : 'Add Breed'}
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
          <h2 className="text-lg font-medium text-gray-900">Breeds List</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">Loading breeds...</div>
          ) : breeds.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No breeds found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {breeds.map((breed) => (
                  <tr key={breed.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {breed.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {breed.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {breed.purpose}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {breed.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(breed)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(breed.id)}
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
