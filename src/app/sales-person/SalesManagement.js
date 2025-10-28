'use client';

import { useState, useEffect } from 'react';

export default function SalesManagement() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSaleItems, setShowSaleItems] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    sale_date: new Date().toISOString().split('T')[0],
    total_price: '0',
    payment_status: 'pending',
    notes: '',
    items: [],
    currentItem: {
      product_id: '',
      quantity: '',
      batch_id: ''
    }
  });

  useEffect(() => {
    fetchSales();
    fetchCustomers();
    fetchProducts();
    fetchSaleItems();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales');
      if (response.ok) {
        const data = await response.json();
        setSales(data);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        // Filter to only show products with available stock
        const availableProducts = data.filter(product =>
          product.available_quantity > 0 &&
          product.is_active &&
          product.current_price > 0
        );
        setProducts(availableProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSaleItems = async () => {
    try {
      const response = await fetch('/api/sale-items');
      if (response.ok) {
        const data = await response.json();
        setSaleItems(data);
      }
    } catch (error) {
      console.error('Error fetching sale items:', error);
    }
  };

  const addSaleItem = () => {
    const selectedProduct = products.find(p => p.id === parseInt(formData.currentItem.product_id));
    if (!selectedProduct || !formData.currentItem.quantity) {
      alert('Please select a product and enter quantity');
      return;
    }

    const quantity = parseInt(formData.currentItem.quantity);
    if (quantity <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    const newItem = {
      id: Date.now() + Math.random(), // unique id for React key
      product_id: parseInt(formData.currentItem.product_id),
      product_name: selectedProduct.product_name,
      quantity: quantity,
      unit_price: parseFloat(selectedProduct.current_price || 0),
      total_price: parseFloat(selectedProduct.current_price || 0) * quantity,
      batch_id: formData.currentItem.batch_id || null
    };

    const updatedItems = [...formData.items, newItem];
    const newTotalPrice = updatedItems.reduce((sum, item) => sum + item.total_price, 0);

    setFormData({
      ...formData,
      items: updatedItems,
      total_price: newTotalPrice.toFixed(2),
      currentItem: {
        product_id: '',
        quantity: '',
        batch_id: ''
      }
    });
  };

  const removeSaleItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    const newTotalPrice = updatedItems.reduce((sum, item) => sum + item.total_price, 0);

    setFormData({
      ...formData,
      items: updatedItems,
      total_price: newTotalPrice.toFixed(2)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      alert('Please add at least one item to the sale');
      return;
    }

    try {
      // Get current user session to get sold_by id
      const sessionResponse = await fetch('/api/auth/session');
      if (!sessionResponse.ok) {
        alert('Unable to get user session');
        return;
      }
      const userData = await sessionResponse.json();
      // changed: handle different session shapes and ensure numeric id
      const userId = userData?.id || userData?.user?.id;
      if (!userId) {
        alert('Unable to determine user id from session');
        return;
      }

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: parseInt(formData.customer_id),
          sale_date: formData.sale_date,
          total_price: parseFloat(formData.total_price),
          payment_status: formData.payment_status,
          notes: formData.notes,
          sold_by: parseInt(userId, 10), // changed: send numeric id
          items: formData.items // Send items along with the sale
        }),
      });

      if (response.ok) {
        fetchSales();
        fetchSaleItems();
        setShowAddForm(false);
        setFormData({
          customer_id: '',
          sale_date: new Date().toISOString().split('T')[0],
          total_price: '0',
          payment_status: 'pending',
          notes: '',
          items: [],
          currentItem: {
            product_id: '',
            quantity: '',
            batch_id: ''
          }
        });
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error recording sale');
      }
    } catch (error) {
      console.error('Error saving sale:', error);
      alert('Error saving sale');
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setFormData({
      customer_id: '',
      sale_date: new Date().toISOString().split('T')[0],
      total_price: '0',
      payment_status: 'pending',
      notes: '',
      items: [],
      currentItem: {
        product_id: '',
        quantity: '',
        batch_id: ''
      }
    });
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.total_price || 0), 0);
  const todaysSales = sales
    .filter(sale => sale.sale_date === new Date().toISOString().split('T')[0])
    .reduce((sum, sale) => sum + parseFloat(sale.total_price || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Record Sale
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Record New Sale</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer</label>
                <select
                  required
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.email || customer.phone}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sale Date</label>
                <input
                  type="date"
                  required
                  value={formData.sale_date}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                />
              </div>
            </div>

            {/* Sale Items Section */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sale Items</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product</label>
                  <select
                    value={formData.currentItem.product_id}
                    onChange={(e) => setFormData({
                      ...formData,
                      currentItem: { ...formData.currentItem, product_id: e.target.value }
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.product_name} - MWK {product.current_price} (Stock: {product.available_quantity})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.currentItem.quantity}
                    onChange={(e) => setFormData({
                      ...formData,
                      currentItem: { ...formData.currentItem, quantity: e.target.value }
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addSaleItem}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-full"
                  >
                    Add Item
                  </button>
                </div>
              </div>

              {/* Sale Items List */}
              {formData.items.length > 0 && (
                <div className="mt-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.product_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">MWK {item.unit_price.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">MWK {item.total_price.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              type="button"
                              onClick={() => removeSaleItem(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td colSpan="3" className="px-6 py-4 text-right font-medium">Total Amount:</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          MWK {parseFloat(formData.total_price).toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                <select
                  required
                  value={formData.payment_status}
                  onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  rows="3"
                  placeholder="Sale notes"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Record Sale
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Sales</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">MWK {totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Today's Sales</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">MWK {todaysSales.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Transactions</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{sales.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Sales Records</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">Loading sales...</div>
          ) : sales.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No sales records found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sale ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => {
                  const saleItemsForSale = saleItems.filter(item => item.sale_id === sale.id);
                  return (
                    <tr key={sale.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{sale.id}
                        {saleItemsForSale.length > 0 && (
                          <button
                            onClick={() => setShowSaleItems(showSaleItems === sale.id ? null : sale.id)}
                            className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                          >
                            ({saleItemsForSale.length} items)
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sale.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sale.sale_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        MWK {parseFloat(sale.total_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(sale.payment_status)}`}>
                          {sale.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {sale.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showSaleItems && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Sale Items for Sale #{showSaleItems}</h2>
          </div>
          <div className="overflow-x-auto">
            {saleItems.filter(item => item.sale_id === showSaleItems).length === 0 ? (
              <div className="p-6 text-center text-gray-500">No items found for this sale</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {saleItems.filter(item => item.sale_id === showSaleItems).map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.product_name || `Product #${item.product_id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        MWK {parseFloat(item.unit_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        MWK {parseFloat(item.total_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.batch_number || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
