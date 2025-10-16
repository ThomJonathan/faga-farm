import DashboardLayout from '../../../components/DashboardLayout';
import auth from '../../../lib/auth';
import MortalityManagement from '../MortalityManagement';

export default async function MortalityPage() {
  const user = await auth.getUserSession();
  if (!user) {
    // Redirect to login if no session
    return { redirect: '/login' };
  }

  return (
    <DashboardLayout role="farm_worker" user={user}>
      <MortalityManagement />
    </DashboardLayout>
  );
}
