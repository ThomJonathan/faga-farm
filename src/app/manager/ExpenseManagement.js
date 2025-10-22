'use client';

import { useState, useEffect } from 'react';

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [summary, setSummary] = useState(null);
  const [formData, setFormData] = useState({
    expense_type: '',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    category: '',
    reference_id: '',
    recorded_by: 1 // Default user ID, should be replaced with actual user ID
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/manager/expenses');
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.data);
        calculateSummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (expenseData) => {
    const totalExpenses = expenseData.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    const categoryTotals = expenseData.reduce((acc, e) => {
      const category = e.expense_type;
      acc[category] = (acc[category] || 0) + parseFloat(e.amount || 0);
      return acc;
    }, {});

    const monthlyExpenses = expenseData.reduce((acc, e) => {
      const month = new Date(e.expense_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      acc[month] = (acc[month] || 0) + parseFloat(e.amount || 0);
      return acc;
    }, {});

    setSummary({
      total_expenses: totalExpenses,
      category_totals: categoryTotals,
      monthly_expenses: monthlyExpenses,
      total_records: expenseData.length
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/manager/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchExpenses();
        setShowAddForm(false);
        setFormData({
          expense_type: '',
          description: '',
          amount: '',
          expense_date: new Date().toISOString().split('T')[0],
          category: '',
          reference_id: '',
          recorded_by: 1
        });
      } else {
        const errorData = await response.json();
        alert(errorData.error);
      }
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setFormData({
      expense_type: '',
      description: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      category: '',
      reference_id: '',
      recorded_by: 1
    });
  };

  const getExpenseTypeColor = (type) => {
    switch (type) {
      case 'vaccination': return 'bg-blue-100 text-blue-800';
      case 'treatment': return 'bg-purple-100 text-purple-800';
      case 'feed': return 'bg-green-100 text-green-800';
      case 'equipment': return 'bg-orange-100 text-orange-800';
      case 'utilities': return 'bg-yellow-100 text-yellow-800';
      case 'labor': return 'bg-red-100 text-red-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end items-center">
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-red-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-red-700 transition-colors"
        >
          Record Expense
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Record Expense</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">Expense Type</label>
                <select
                  required
                  value={formData.expense_type}
                  onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm text-gray-900"
                >
                  <option value="">Select Expense Type</option>
                  <option value="vaccination">Vaccination</option>
                  <option value="treatment">Treatment</option>
                  <option value="feed">Feed</option>
                  <option value="bedding">Bedding</option>
                  <option value="equipment">Equipment</option>
                  <option value="utilities">Utilities</option>
                  <option value="labor">Labor</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Amount (MWK)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm text-gray-900"
                  placeholder="Enter expense amount"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Expense Date</label>
                <input
                  type="date"
                  required
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm text-gray-900"
                  placeholder="Optional category"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm text-gray-900"
                  rows="2"
                  placeholder="Detailed description of the expense"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-red-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                Record Expense
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

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-xs font-medium text-gray-900">Total Expenses</h3>
            <p className="text-lg font-bold text-red-600 mt-1">MWK {summary.total_expenses.toFixed(2)}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-xs font-medium text-gray-900">Records</h3>
            <p className="text-lg font-bold text-blue-600 mt-1">{summary.total_records}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-xs font-medium text-gray-900">Top Category</h3>
            <p className="text-sm font-bold text-green-600 mt-1 capitalize">
              {Object.entries(summary.category_totals).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'}
            </p>
            <p className="text-xs text-gray-500">
              MWK {Object.entries(summary.category_totals).sort(([,a], [,b]) => b - a)[0]?.[1]?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-xs font-medium text-gray-900">Categories</h3>
            <div className="mt-1 space-y-1 max-h-12 overflow-y-auto">
              {Object.entries(summary.category_totals).slice(0, 2).map(([category, amount]) => (
                <div key={category} className="flex justify-between text-xs">
                  <span className="capitalize">{category}:</span>
                  <span className="font-semibold">MWK {amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-base font-medium text-gray-900">Expense Records</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4 text-center">Loading expense records...</div>
          ) : expenses.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No expense records found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getExpenseTypeColor(expense.expense_type)}`}>
                        {expense.expense_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {expense.description}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      MWK {parseFloat(expense.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {expense.category || '-'}
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
