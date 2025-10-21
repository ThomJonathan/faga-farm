import DashboardLayout from '../../components/DashboardLayout';
import auth from '../../lib/auth';
import { redirect } from 'next/navigation';
import InventoryManagement from './InventoryManagement';

export default async function ManagerDashboard() {
  const user = await auth.getUserSession();
  if (!user) {
    // Redirect to login if no session
    redirect('/login');
  }

  // Fetch real data for dashboard
  const inventoryReports = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/inventory/reports`, {
    cache: 'no-store'
  }).then(res => res.json()).catch(() => [{}]);

  const reports = inventoryReports[0] || {};

  return (
    <DashboardLayout role="manager" user={user}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Products</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{reports.total_products || 0}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Active Batches</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">--</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Monthly Revenue</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">$--</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Stock Alerts</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{(reports.low_stock_count || 0) + (reports.out_of_stock_count || 0)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Inventory Overview</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Products</span>
                <span className="font-medium">{reports.total_products || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Low Stock Items</span>
                <span className="font-medium text-yellow-600">{reports.low_stock_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Out of Stock</span>
                <span className="font-medium text-red-600">{reports.out_of_stock_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Quantity</span>
                <span className="font-medium">{reports.total_quantity || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a href="/manager/inventory" className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block text-center">
                View Inventory Management
              </a>
              <button className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Generate Reports
              </button>
              <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
                Manage Stock Thresholds
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Management Component */}
        <div className="mt-8">
          <InventoryManagement />
        </div>
      </div>
    </DashboardLayout>
  );
}
