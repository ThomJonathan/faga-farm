import DashboardLayout from '../../../components/DashboardLayout';
import auth from '../../../lib/auth';
import { redirect } from 'next/navigation';

export default async function UsersPage() {
  const user = await auth.getUserSession();
  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardLayout role="manager" user={user}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">User management functionality coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
