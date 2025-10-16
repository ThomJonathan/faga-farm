import DashboardLayout from '../../../components/DashboardLayout';
import auth from '../../../lib/auth';
import EggCollectionManagement from '../EggCollectionManagement';

export default async function EggCollectionPage() {
  const user = await auth.getUserSession();
  if (!user) {
    // Redirect to login if no session
    return { redirect: '/login' };
  }

  return (
    <DashboardLayout role="farm_worker" user={user}>
      <EggCollectionManagement />
    </DashboardLayout>
  );
}
