import DashboardLayout from '../../components/DashboardLayout';

export default function ManagerDashboard() {
  return (
    <DashboardLayout role="manager">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">--</p>
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
            <p className="text-3xl font-bold text-red-600 mt-2">--</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Overview</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Houses</span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Breeds</span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Products</span>
                <span className="font-medium">--</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Reports</h2>
            <div className="space-y-3">
              <p className="text-gray-600">No recent reports</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
