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

        // Fetch available products from the new API
        const availableProductsRes = await fetch('/api/available-products').catch(() => ({ ok: false }));
        const availableProducts = availableProductsRes.ok ? await availableProductsRes.json() : {
          eggs: { total: 0, by_breed: [] },
          chicks: { total: 0, by_breed_and_age: [] },
          meat: { total_kg: 0, total_birds: 0, by_breed: [] },
          manure: { total_kg: 0 }
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
                <p className="text-3xl font-bold text-green-600 mt-2">MWK {dashboardData.todaysSales.toFixed(2)}</p>
              </div>

              <div
                className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setCurrentPage('sales')}
              >
                <h3 className="text-lg font-medium text-gray-900">Monthly Revenue</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">MWK {dashboardData.monthlyRevenue.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border-2 border-yellow-200 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-lg mr-3 shadow-sm">
                      🥚
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-900">Eggs</p>
                      <p className="text-2xl font-extrabold text-yellow-600">{dashboardData.availableProducts.eggs.total}</p>
                    </div>
                  </div>
                  {dashboardData.availableProducts.eggs.by_breed.length > 0 && (
                    <div className="space-y-1">
                      {dashboardData.availableProducts.eggs.by_breed.map((breed, idx) => (
                        <div key={idx} className="bg-yellow-200 bg-opacity-50 rounded p-2 border border-yellow-300">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-800 text-xs">{breed.breed}</span>
                            <span className="font-bold text-yellow-700 text-sm">{breed.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border-2 border-orange-200 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg mr-3 shadow-sm">
                      🐔
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-900">Chicks</p>
                      <p className="text-2xl font-extrabold text-orange-600">{dashboardData.availableProducts.chicks.total}</p>
                    </div>
                  </div>
                  {dashboardData.availableProducts.chicks.by_breed_and_age.length > 0 && (
                    <div className="space-y-1">
                      {dashboardData.availableProducts.chicks.by_breed_and_age.map((item, idx) => (
                        <div key={idx} className="bg-orange-200 bg-opacity-50 rounded p-2 border border-orange-300">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-gray-800 text-xs">{item.breed}</span>
                            <span className="font-bold text-orange-700 text-sm">{item.quantity}</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {item.age_weeks === 0 ? `${item.age_days} days old` : `${item.age_weeks} weeks old`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border-2 border-red-200 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-lg mr-3 shadow-sm">
                      🍗
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-900">Meat</p>
                      <p className="text-2xl font-extrabold text-red-600">{dashboardData.availableProducts.meat.total_kg.toFixed(1)}kg</p>
                      <p className="text-xs text-gray-600">{dashboardData.availableProducts.meat.total_birds} birds</p>
                    </div>
                  </div>
                  {dashboardData.availableProducts.meat.by_breed.length > 0 && (
                    <div className="space-y-1">
                      {dashboardData.availableProducts.meat.by_breed.map((breed, idx) => (
                        <div key={idx} className="bg-red-200 bg-opacity-50 rounded p-2 border border-red-300">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-gray-800 text-xs">{breed.breed}</span>
                            <span className="font-bold text-red-700 text-sm">{breed.kg.toFixed(1)}kg</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {breed.birds} birds
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border-2 border-amber-200 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold text-lg mr-3 shadow-sm">
                      💩
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-900">Manure</p>
                      <p className="text-3xl font-extrabold text-amber-600">{dashboardData.availableProducts.manure.total_kg.toFixed(1)}kg</p>
                    </div>
                  </div>
                  <div className="bg-amber-200 bg-opacity-50 rounded p-2 border border-amber-300">
                    <div className="text-center">
                      <span className="text-xs font-medium text-gray-700">Organic Fertilizer</span>
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
