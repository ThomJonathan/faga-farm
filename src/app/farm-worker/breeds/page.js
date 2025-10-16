import DashboardLayout from '../../../components/DashboardLayout';
import auth from '../../../lib/auth';
import BreedsManagement from '../BreedsManagement';

export default async function BreedsPage() {
  const user = await auth.getUserSession();
  if (!user) {
    // Redirect to login if no session
    return { redirect: '/login' };
  }

  return (
    <DashboardLayout role="farm_worker" user={user}>
      <BreedsManagement />
    </DashboardLayout>
  );
}
