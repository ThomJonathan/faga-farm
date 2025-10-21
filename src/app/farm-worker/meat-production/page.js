import DashboardLayout from '../../../components/DashboardLayout';
import auth from '../../../lib/auth';
import { redirect } from 'next/navigation';
import MeatProductionManagement from '../MeatProductionManagement';

export default async function MeatProductionPage() {
  const user = await auth.getUserSession();
  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardLayout role="farm_worker" user={user}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Meat Production Management</h1>
        <MeatProductionManagement />
      </div>
    </DashboardLayout>
  );
}
