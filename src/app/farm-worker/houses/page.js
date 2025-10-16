import DashboardLayout from '../../../components/DashboardLayout';
import auth from '../../../lib/auth';
import HousesManagement from '../HousesManagement';

export default async function HousesPage() {
  const user = await auth.getUserSession();
  if (!user) {
    // Redirect to login if no session
    return { redirect: '/login' };
  }

  return (
    <DashboardLayout role="farm_worker" user={user}>
      <HousesManagement />
    </DashboardLayout>
  );
}
