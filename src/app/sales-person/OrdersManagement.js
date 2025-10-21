'use client';

import { useState, useEffect } from 'react';

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showOrderItems, setShowOrderItems] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    order_date: new Date().toISOString().split('T')[0],
    total_amount: '0',
    status: 'pending',
    notes: '',
    items: [],
    currentItem: {
      product_id: '',
      quantity: '',
      batch_id: ''
    }
  });

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchProducts();
    fetchOrderItems();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
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
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOrderItems = async () => {
    try {
      const response = await fetch('/api/order-items');
      if (response.ok) {
        const data = await response.json();
        setOrderItems(data);
      }
    } catch (error) {
      console.error('Error fetching order items:', error);
    }
  };

  const addOrderItem = () => {
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
      product_id: parseInt(formData.currentItem.product_id),
      product_name: selectedProduct.product_name,
      quantity: quantity,
      unit_price: parseFloat(selectedProduct.current_price || 0),
      total_price: parseFloat(selectedProduct.current_price || 0) * quantity,
      batch_id: formData.currentItem.batch_id || null
    };

    const updatedItems = [...formData.items, newItem];
    const newTotalAmount = updatedItems.reduce((sum, item) => sum + item.total_price, 0);

    setFormData({
      ...formData,
      items: updatedItems,
      total_amount: newTotalAmount.toFixed(2),
      currentItem: {
        product_id: '',
        quantity: '',
        batch_id: ''
      }
    });
  };

  const removeOrderItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    const newTotalAmount = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
    
    setFormData({
      ...formData,
      items: updatedItems,
      total_amount: newTotalAmount.toFixed(2)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      alert('Please add at least one item to the order');
      return;
    }

    try {
      const sessionResponse = await fetch('/api/auth/session');
      if (!sessionResponse.ok) {
        alert('Unable to get user session');
        return;
      }
      const userData = await sessionResponse.json();

      // First create the order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: parseInt(formData.customer_id),
          order_date: formData.order_date,
          total_amount: parseFloat(formData.total_amount),
          status: formData.status,
          notes: formData.notes,
          sales_person_id: userData.id,
          items: formData.items // Send items along with the order
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        alert(errorData.message || 'Error creating order');
        return;
      }

      // Refresh data and reset form
      await fetchOrders();
      await fetchOrderItems();
      setShowAddForm(false);
      setFormData({
        customer_id: '',
        order_date: new Date().toISOString().split('T')[0],
        total_amount: '0',
        status: 'pending',
        notes: '',
        items: [],
        currentItem: {
          product_id: '',
          quantity: '',
          batch_id: ''
        }
      });
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Error saving order');
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setFormData({
      customer_id: '',
      order_date: new Date().toISOString().split('T')[0],
      total_amount: '0',
      status: 'pending',
      notes: '',
      items: [],
      currentItem: {
        product_id: '',
        quantity: '',
        batch_id: ''
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Order
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Order</h2>
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
                <label className="block text-sm font-medium text-gray-700">Order Date</label>
                <input
                  type="date"
                  required
                  value={formData.order_date}
                  onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                />
              </div>
            </div>

            {/* Order Items Section */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
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
                        {product.product_name} - MWK {product.current_price}
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
                    onClick={addOrderItem}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-full"
                  >
                    Add Item
                  </button>
                </div>
              </div>

              {/* Order Items List */}
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
                              onClick={() => removeOrderItem(index)}
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
                          MWK {parseFloat(formData.total_amount).toFixed(2)}
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
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
                  rows="3"
                  placeholder="Order notes"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Order
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
          <h2 className="text-lg font-medium text-gray-900">Orders</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No orders found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => {
                  const orderItemsForOrder = orderItems.filter(item => item.order_id === order.id);
                  return (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id}
                        {orderItemsForOrder.length > 0 && (
                          <button
                            onClick={() => setShowOrderItems(showOrderItems === order.id ? null : order.id)}
                            className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                          >
                            ({orderItemsForOrder.length} items)
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.order_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        MWK {parseFloat(order.total_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {order.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showOrderItems && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Order Items for Order #{showOrderItems}</h2>
          </div>
          <div className="overflow-x-auto">
            {orderItems.filter(item => item.order_id === showOrderItems).length === 0 ? (
              <div className="p-6 text-center text-gray-500">No items found for this order</div>
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
                  {orderItems.filter(item => item.order_id === showOrderItems).map((item) => (
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
