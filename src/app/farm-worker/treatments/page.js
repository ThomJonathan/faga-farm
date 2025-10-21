import DashboardLayout from '../../../components/DashboardLayout';
import auth from '../../../lib/auth';
import { redirect } from 'next/navigation';
import TreatmentManagement from '../TreatmentManagement';

export default async function TreatmentsPage() {
  const user = await auth.getUserSession();
  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardLayout role="farm_worker" user={user}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Treatments Management</h1>
        <TreatmentManagement />
      </div>
    </DashboardLayout>
  );
}
