'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function SalesPersonDashboard() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
      }
    };
    getUser();
  }, []);

  // Import components
  const CustomersManagement = require('./CustomersManagement').default;
  const OrdersManagement = require('./OrdersManagement').default;
  const SalesManagement = require('./SalesManagement').default;

  const renderContent = () => {
    switch (currentPage) {
      case 'customers':
        return <CustomersManagement />;
      case 'orders':
        return <OrdersManagement />;
      case 'sales':
        return <SalesManagement />;
      default:
        return <DashboardContent />;
    }
  };

  const DashboardContent = () => {
    const [dashboardData, setDashboardData] = useState({
      totalCustomers: 0,
      pendingOrders: 0,
      todaysSales: 0,
      monthlyRevenue: 0,
      recentSales: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
      try {
        // Assuming you have these API endpoints
        const [customersRes, ordersRes, salesRes] = await Promise.all([
          fetch('/api/customers').catch(() => ({ ok: false })),
          fetch('/api/orders').catch(() => ({ ok: false })),
          fetch('/api/sales').catch(() => ({ ok: false }))
        ]);

        const customers = customersRes.ok ? await customersRes.json() : [];
        const orders = ordersRes.ok ? await ordersRes.json() : [];
        const sales = salesRes.ok ? await salesRes.json() : [];

        const totalCustomers = customers.length;
        const pendingOrders = orders.filter(order => order.status === 'pending').length;

        const today = new Date().toISOString().split('T')[0];
        const todaysSales = sales
          .filter(sale => sale.sale_date === today)
          .reduce((sum, sale) => sum + parseFloat(sale.total_price || 0), 0);

        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyRevenue = sales
          .filter(sale => sale.sale_date.startsWith(currentMonth))
          .reduce((sum, sale) => sum + parseFloat(sale.total_price || 0), 0);

        // Get recent sales (last 5)
        const recentSales = sales
          .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))
          .slice(0, 5);

        setDashboardData({
          totalCustomers,
          pendingOrders,
          todaysSales,
          monthlyRevenue,
          recentSales
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales Person Dashboard</h1>

        {loading ? (
          <div className="text-center py-8">Loading dashboard data...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setCurrentPage('customers')}
              >
                <h3 className="text-lg font-medium text-gray-900">Total Customers</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{dashboardData.totalCustomers}</p>
              </div>

              <div
                className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setCurrentPage('orders')}
              >
                <h3 className="text-lg font-medium text-gray-900">Pending Orders</h3>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{dashboardData.pendingOrders}</p>
              </div>

              <div
                className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setCurrentPage('sales')}
              >
                <h3 className="text-lg font-medium text-gray-900">Today's Sales</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">${dashboardData.todaysSales.toFixed(2)}</p>
              </div>

              <div
                className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setCurrentPage('sales')}
              >
                <h3 className="text-lg font-medium text-gray-900">Monthly Revenue</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">${dashboardData.monthlyRevenue.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Sales</h2>
              <div className="space-y-3">
                {dashboardData.recentSales.length > 0 ? (
                  dashboardData.recentSales.map((sale, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">Sale: ${parseFloat(sale.total_price).toFixed(2)} - {sale.customer_name || 'Customer'}</p>
                        <p className="text-xs text-gray-500">{new Date(sale.sale_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No recent sales</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };



  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout
      role="sales_person"
      user={user}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
    >
      {renderContent()}
    </DashboardLayout>
  );
}
