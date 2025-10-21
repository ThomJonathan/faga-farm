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
            <p className="text-3xl font-bold text-purple-600 mt-2">MWK --</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Stock Alerts</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{(reports.low_stock_count || 0) + (reports.out_of_stock_count || 0)}</p>
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
