'use client';

import { useState, useEffect } from 'react';

export default function ProductPriceManagement() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [formData, setFormData] = useState({
    product_type: '',
    breed_name: '',
    price_per_unit: '',
    unit: '',
    effective_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/product-prices');
      if (response.ok) {
        const data = await response.json();
        setPrices(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingPrice ? `/api/product-prices/${editingPrice.id}` : '/api/product-prices';
      const method = editingPrice ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchPrices();
        resetForm();
      } else {
        const errorData = await response.json();
        alert(errorData.error);
      }
    } catch (error) {
      console.error('Error saving price:', error);
    }
  };

  const handleEdit = (price) => {
    setEditingPrice(price);
    setFormData({
      product_type: price.product_type,
      breed_name: price.breed_name || '',
      price_per_unit: price.price_per_unit,
      unit: price.unit,
      effective_date: price.effective_date,
      notes: price.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this price?')) return;

    try {
      const response = await fetch(`/api/product-prices/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPrices();
      } else {
        const errorData = await response.json();
        alert(errorData.error);
      }
    } catch (error) {
      console.error('Error deleting price:', error);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingPrice(null);
    setFormData({
      product_type: '',
      breed_name: '',
      price_per_unit: '',
      unit: '',
      effective_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const getProductTypeColor = (type) => {
    switch (type) {
      case 'eggs': return 'bg-yellow-100 text-yellow-800';
      case 'chicks': return 'bg-orange-100 text-orange-800';
      case 'meat': return 'bg-red-100 text-red-800';
      case 'manure': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div></div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          {editingPrice ? 'Update Price' : 'Set Product Price'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {editingPrice ? 'Update Product Price' : 'Set New Product Price'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">Product Type</label>
                <select
                  required
                  value={formData.product_type}
                  onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm text-gray-900"
                >
                  <option value="">Select Product Type</option>
                  <option value="eggs">Eggs</option>
                  <option value="chicks">Live Chicks</option>
                  <option value="meat">Meat</option>
                  <option value="manure">Manure</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Breed (Optional)</label>
                <input
                  type="text"
                  value={formData.breed_name}
                  onChange={(e) => setFormData({ ...formData, breed_name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm text-gray-900"
                  placeholder="e.g., Rhode Island Red"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Price per Unit (MWK)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={formData.price_per_unit}
                  onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm text-gray-900"
                  placeholder="Enter price"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Unit</label>
                <select
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm text-gray-900"
                >
                  <option value="">Select Unit</option>
                  <option value="piece">Per Piece (eggs/chicks)</option>
                  <option value="kg">Per Kilogram (meat/manure)</option>
                  <option value="dozen">Per Dozen (eggs)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Effective Date</label>
                <input
                  type="date"
                  required
                  value={formData.effective_date}
                  onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm text-gray-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm text-gray-900"
                  rows="2"
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingPrice ? 'Update Price' : 'Set Price'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-base font-medium text-gray-900">Product Prices</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4 text-center">Loading product prices...</div>
          ) : prices.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No product prices set</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Breed
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Effective Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prices.map((price) => (
                  <tr key={price.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProductTypeColor(price.product_type)}`}>
                        {price.product_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {price.breed_name || 'All Breeds'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      MWK {parseFloat(price.price_per_unit).toFixed(2)} / {price.unit}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(price.effective_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(price)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(price.id)}
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
