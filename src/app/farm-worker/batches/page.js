import DashboardLayout from '../../../components/DashboardLayout';
import auth from '../../../lib/auth';
import BatchesManagement from '../BatchesManagement';

export default async function BatchesPage() {
  const user = await auth.getUserSession();
  if (!user) {
    // Redirect to login if no session
    return { redirect: '/login' };
  }

  return (
    <DashboardLayout role="farm_worker" user={user}>
      <BatchesManagement />
    </DashboardLayout>
  );
}
