'use client';

import { useState, useEffect } from 'react';

export default function TreatmentManagement() {
  const [treatments, setTreatments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [summary, setSummary] = useState(null);
  const [formData, setFormData] = useState({
    batch_id: '',
    treatment_type: '',
    treatment_date: new Date().toISOString().split('T')[0],
    medication_name: '',
    dosage: '',
    cost_per_unit: '',
    total_cost: '',
    next_due_date: '',
    effectiveness_rating: 'good',
    notes: ''
  });

  useEffect(() => {
    fetchTreatments();
    fetchBatches();
  }, []);

  const fetchTreatments = async () => {
    try {
      const response = await fetch('/api/treatments');
      if (response.ok) {
        const data = await response.json();
        setTreatments(data.data);
        calculateSummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching treatments:', error);
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

  const calculateSummary = (treatmentData) => {
    const totalTreatments = treatmentData.length;
    const totalCost = treatmentData.reduce((sum, t) => sum + (parseFloat(t.total_cost) || 0), 0);
    const upcomingTreatments = treatmentData.filter(t => {
      if (!t.next_due_date) return false;
      const dueDate = new Date(t.next_due_date);
      const today = new Date();
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 7 && daysUntilDue >= 0;
    }).length;

    const effectivenessCounts = treatmentData.reduce((acc, t) => {
      acc[t.effectiveness_rating] = (acc[t.effectiveness_rating] || 0) + 1;
      return acc;
    }, {});

    setSummary({
      total_treatments: totalTreatments,
      total_cost: totalCost,
      upcoming_treatments: upcomingTreatments,
      effectiveness: effectivenessCounts
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
      const response = await fetch('/api/treatments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchTreatments();
        fetchBatches(); // Refresh batch treatment dates
        setShowAddForm(false);
        setFormData({
          batch_id: '',
          treatment_type: '',
          treatment_date: new Date().toISOString().split('T')[0],
          medication_name: '',
          dosage: '',
          cost_per_unit: '',
          total_cost: '',
          next_due_date: '',
          effectiveness_rating: 'good',
          notes: ''
        });
      } else {
        const errorData = await response.json();
        alert(errorData.error);
      }
    } catch (error) {
      console.error('Error saving treatment:', error);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setFormData({
      batch_id: '',
      treatment_type: '',
      treatment_date: new Date().toISOString().split('T')[0],
      medication_name: '',
      dosage: '',
      cost_per_unit: '',
      total_cost: '',
      next_due_date: '',
      effectiveness_rating: 'good',
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

  const getEffectivenessColor = (rating) => {
    switch (rating) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Record Treatment
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Record Treatment</h2>
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
                <label className="block text-sm font-medium text-gray-700">Treatment Type</label>
                <select
                  required
                  value={formData.treatment_type}
                  onChange={(e) => setFormData({ ...formData, treatment_type: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                >
                  <option value="">Select Treatment Type</option>
                  <option value="medication">Medication</option>
                  <option value="vaccination">Vaccination</option>
                  <option value="deworming">Deworming</option>
                  <option value="supplement">Supplement</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Treatment Date</label>
                <input
                  type="date"
                  required
                  value={formData.treatment_date}
                  onChange={(e) => setFormData({ ...formData, treatment_date: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Medication Name</label>
                <input
                  type="text"
                  value={formData.medication_name}
                  onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  placeholder="e.g., Amoxicillin, Vitamin supplement"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dosage</label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  placeholder="e.g., 5ml per bird, 1 tablet per kg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cost per Unit (MWK)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  placeholder="Cost per ml/tablet/etc"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Cost (MWK)</label>
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
                <label className="block text-sm font-medium text-gray-700">Effectiveness Rating</label>
                <select
                  value={formData.effectiveness_rating}
                  onChange={(e) => setFormData({ ...formData, effectiveness_rating: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
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
                  placeholder="Optional notes about the treatment"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Record Treatment
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
            <h3 className="text-lg font-medium text-gray-900">Total Treatments</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">{summary.total_treatments}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Cost</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">MWK {summary.total_cost.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Treatments</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{summary.upcoming_treatments}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Effectiveness</h3>
            <div className="mt-2 space-y-1 text-gray-900">
              {Object.entries(summary.effectiveness).map(([rating, count]) => (
                <div key={rating} className="flex justify-between text-sm">
                  <span className="capitalize">{rating}:</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Treatment Records</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">Loading treatment records...</div>
          ) : treatments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No treatment records found</div>
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
                    Treatment Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medication
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Effectiveness
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
                {treatments.map((treatment) => (
                  <tr key={treatment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(treatment.treatment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {treatment.batch_number}
                      <br />
                      <span className="text-xs text-gray-400">
                        {treatment.breed_name} ({treatment.level})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {treatment.treatment_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {treatment.medication_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEffectivenessColor(treatment.effectiveness_rating)}`}>
                        {treatment.effectiveness_rating}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      MWK {treatment.total_cost || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {treatment.next_due_date ? new Date(treatment.next_due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(treatment.next_due_date)}`}>
                        {getStatusText(treatment.next_due_date)}
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
