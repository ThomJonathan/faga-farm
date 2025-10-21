import DashboardLayout from '../../../components/DashboardLayout';
import auth from '../../../lib/auth';
import { redirect } from 'next/navigation';
import InventoryManagement from '../InventoryManagement';

export default async function InventoryPage() {
  const user = await auth.getUserSession();
  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardLayout role="manager" user={user}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <InventoryManagement />
      </div>
    </DashboardLayout>
  );
}
