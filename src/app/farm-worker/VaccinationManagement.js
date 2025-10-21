'use client';

import { useState, useEffect } from 'react';

export default function VaccinationManagement() {
  const [vaccinations, setVaccinations] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [summary, setSummary] = useState(null);
  const [formData, setFormData] = useState({
    batch_id: '',
    vaccine_name: '',
    vaccination_date: new Date().toISOString().split('T')[0],
    dosage: '',
    cost_per_unit: '',
    total_cost: '',
    next_due_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchVaccinations();
    fetchBatches();
  }, []);

  const fetchVaccinations = async () => {
    try {
      const response = await fetch('/api/vaccinations');
      if (response.ok) {
        const data = await response.json();
        setVaccinations(data.data);
        calculateSummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching vaccinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      if (response.ok) {
        const data = await response.json();
        // Only show active batches, especially chicks that need vaccination
        setBatches(data.filter(batch => batch.status === 'active'));
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const calculateSummary = (vaccinationData) => {
    const totalVaccinations = vaccinationData.length;
    const totalCost = vaccinationData.reduce((sum, v) => sum + (v.total_cost || 0), 0);
    const upcomingVaccinations = vaccinationData.filter(v => {
      if (!v.next_due_date) return false;
      const dueDate = new Date(v.next_due_date);
      const today = new Date();
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 7 && daysUntilDue >= 0;
    }).length;

    setSummary({
      total_vaccinations: totalVaccinations,
      total_cost: totalCost,
      upcoming_vaccinations: upcomingVaccinations
    });
  };

  const calculateTotalCost = () => {
    const costPerUnit = parseFloat(formData.cost_per_unit) || 0;
    const dosage = parseFloat(formData.dosage) || 0;
    const totalCost = costPerUnit * dosage;
    setFormData(prev => ({ ...prev, total_cost: totalCost.toFixed(2) }));
  };

  useEffect(() => {
    calculateTotalCost();
  }, [formData.cost_per_unit, formData.dosage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/vaccinations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchVaccinations();
        fetchBatches(); // Refresh batch vaccination dates
        setShowAddForm(false);
        setFormData({
          batch_id: '',
          vaccine_name: '',
          vaccination_date: new Date().toISOString().split('T')[0],
          dosage: '',
          cost_per_unit: '',
          total_cost: '',
          next_due_date: '',
          notes: ''
        });
      } else {
        const errorData = await response.json();
        alert(errorData.error);
      }
    } catch (error) {
      console.error('Error saving vaccination:', error);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setFormData({
      batch_id: '',
      vaccine_name: '',
      vaccination_date: new Date().toISOString().split('T')[0],
      dosage: '',
      cost_per_unit: '',
      total_cost: '',
      next_due_date: '',
      notes: ''
    });
  };

  const getStatusColor = (nextDueDate) => {
    if (!nextDueDate) return 'bg-gray-100 text-gray-800';

    const today = new Date();
    const dueDate = new Date(nextDueDate);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) return 'bg-red-100 text-red-800'; // Overdue
    if (daysUntilDue <= 3) return 'bg-red-100 text-red-800'; // Due soon
    if (daysUntilDue <= 7) return 'bg-yellow-100 text-yellow-800'; // Upcoming
    return 'bg-green-100 text-green-800'; // Future
  };

  const getStatusText = (nextDueDate) => {
    if (!nextDueDate) return 'No follow-up scheduled';

    const today = new Date();
    const dueDate = new Date(nextDueDate);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) return `Overdue by ${Math.abs(daysUntilDue)} days`;
    if (daysUntilDue === 0) return 'Due today';
    if (daysUntilDue === 1) return 'Due tomorrow';
    if (daysUntilDue <= 7) return `Due in ${daysUntilDue} days`;
    return `Due in ${daysUntilDue} days`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Vaccination Management</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Record Vaccination
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Record Vaccination</h2>
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
                <label className="block text-sm font-medium text-gray-700">Vaccine Name</label>
                <input
                  type="text"
                  required
                  value={formData.vaccine_name}
                  onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  placeholder="e.g., Newcastle Disease Vaccine"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vaccination Date</label>
                <input
                  type="date"
                  required
                  value={formData.vaccination_date}
                  onChange={(e) => setFormData({ ...formData, vaccination_date: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dosage (per bird)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  placeholder="e.g., 0.5 ml per bird"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cost per Unit ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  placeholder="Cost per ml/dose"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_cost}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 text-gray-900"
                  placeholder="Auto-calculated"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Next Due Date</label>
                <input
                  type="date"
                  value={formData.next_due_date}
                  onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  rows="3"
                  placeholder="Optional notes about the vaccination"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Record Vaccination
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
            <h3 className="text-lg font-medium text-gray-900">Total Vaccinations</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{summary.total_vaccinations}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Cost</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">${summary.total_cost.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Vaccinations</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{summary.upcoming_vaccinations}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Vaccination Records</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">Loading vaccination records...</div>
          ) : vaccinations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No vaccination records found</div>
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
                    Vaccine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dosage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vaccinations.map((vaccination) => (
                  <tr key={vaccination.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(vaccination.vaccination_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vaccination.batch_number}
                      <br />
                      <span className="text-xs text-gray-400">
                        {vaccination.breed_name} ({vaccination.level})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vaccination.vaccine_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vaccination.dosage || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${vaccination.total_cost || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vaccination.next_due_date ? new Date(vaccination.next_due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vaccination.next_due_date)}`}>
                        {getStatusText(vaccination.next_due_date)}
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
