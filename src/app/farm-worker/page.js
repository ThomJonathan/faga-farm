import DashboardLayout from '../../components/DashboardLayout';
import auth from '../../lib/auth';
import { redirect } from 'next/navigation';

export default async function FarmWorkerDashboard() {
  const user = await auth.getUserSession();
  if (!user) {
    // Redirect to login if no session
    redirect('/login');
  }
  return (
    <DashboardLayout role="farm_worker" user={user}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Farm Worker Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Active Batches</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">--</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Today's Egg Collection</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">--</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Mortality Rate</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">--%</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Available Houses</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">--</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>
          <div className="space-y-3">
            <p className="text-gray-600">No recent activities</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
