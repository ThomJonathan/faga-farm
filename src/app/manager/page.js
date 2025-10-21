'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import InventoryManagement from './InventoryManagement';

export default function ManagerDashboard() {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    activeBatches: 0,
    monthlyRevenue: 0,
    stockAlerts: 0
  });
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      // Set up real-time updates every 30 seconds
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [inventoryRes, batchesRes, salesSummaryRes] = await Promise.all([
        fetch('/api/inventory/reports').catch(() => ({ ok: false })),
        fetch('/api/batches').catch(() => ({ ok: false })),
        fetch('/api/sales-summary').catch(() => ({ ok: false }))
      ]);

      const inventoryReports = inventoryRes.ok ? await inventoryRes.json() : [{}];
      const batches = batchesRes.ok ? await batchesRes.json() : [];
      const salesSummary = salesSummaryRes.ok ? await salesSummaryRes.json() : { data: { sales: { total_revenue: 0 } } };

      const reports = inventoryReports[0] || {};
      const activeBatches = batches.filter(batch => batch.status === 'active').length;
      const monthlyRevenue = salesSummary.data?.sales?.total_revenue || 0;
      const stockAlerts = (reports.low_stock_count || 0) + (reports.out_of_stock_count || 0);

      setDashboardData({
        totalProducts: reports.total_products || 0,
        activeBatches,
        monthlyRevenue,
        stockAlerts
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout role="manager" user={user}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>

        {loading ? (
          <div className="text-center py-8">Loading dashboard data...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Total Products</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{dashboardData.totalProducts}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Active Batches</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">{dashboardData.activeBatches}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Monthly Revenue</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">MWK {dashboardData.monthlyRevenue.toFixed(2)}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Stock Alerts</h3>
                <p className="text-3xl font-bold text-red-600 mt-2">{dashboardData.stockAlerts}</p>
              </div>
            </div>

            {/* Inventory Management Component */}
            <div className="mt-8">
              <InventoryManagement />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
