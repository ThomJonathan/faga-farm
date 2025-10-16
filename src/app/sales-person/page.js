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
      availableProducts: {
        eggs: 0,
        chicks: 0,
        meat: 0,
        manure: 0
      }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
      try {
        // Fetch data from multiple APIs
        const [customersRes, ordersRes, salesRes, eggCollectionRes, batchesRes, mortalityRes] = await Promise.all([
          fetch('/api/customers').catch(() => ({ ok: false })),
          fetch('/api/orders').catch(() => ({ ok: false })),
          fetch('/api/sales').catch(() => ({ ok: false })),
          fetch('/api/egg-collection').catch(() => ({ ok: false })),
          fetch('/api/batches').catch(() => ({ ok: false })),
          fetch('/api/mortality').catch(() => ({ ok: false }))
        ]);

        const customers = customersRes.ok ? await customersRes.json() : [];
        const orders = ordersRes.ok ? await ordersRes.json() : [];
        const sales = salesRes.ok ? await salesRes.json() : [];
        const eggCollections = eggCollectionRes.ok ? await eggCollectionRes.json() : { records: [] };
        const batches = batchesRes.ok ? await batchesRes.json() : [];
        const mortality = mortalityRes.ok ? await mortalityRes.json() : [];

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

        // Calculate available products
        const availableProducts = {
          eggs: eggCollections.records
            .filter(record => record.egg_type === 'sales')
            .reduce((sum, record) => sum + record.quantity, 0),
          chicks: batches
            .filter(batch => batch.level === 'chick' && batch.status === 'active')
            .reduce((sum, batch) => sum + batch.current_quantity, 0),
          meat: batches
            .filter(batch => batch.level === 'adult' && batch.status === 'active')
            .reduce((sum, batch) => sum + batch.current_quantity, 0),
          manure: batches
            .filter(batch => batch.status === 'active')
            .reduce((sum, batch) => sum + batch.current_quantity, 0) * 0.5 // Assuming 0.5kg manure per bird per day
        };

        setDashboardData({
          totalCustomers,
          pendingOrders,
          todaysSales,
          monthlyRevenue,
          availableProducts
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold mr-3">
                      🥚
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Eggs</p>
                      <p className="text-lg font-bold text-yellow-600">{dashboardData.availableProducts.eggs}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold mr-3">
                      🐔
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Chicks</p>
                      <p className="text-lg font-bold text-orange-600">{dashboardData.availableProducts.chicks}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold mr-3">
                      🍗
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Meat</p>
                      <p className="text-lg font-bold text-red-600">{dashboardData.availableProducts.meat}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-brown-50 p-4 rounded-lg border border-brown-200">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold mr-3">
                      💩
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Manure</p>
                      <p className="text-lg font-bold text-amber-600">{dashboardData.availableProducts.manure.toFixed(1)}kg</p>
                    </div>
                  </div>
                </div>
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
