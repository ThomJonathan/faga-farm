import DashboardLayout from '../../../components/DashboardLayout';
import auth from '../../../lib/auth';
import EggIncubationManagement from '../EggIncubationManagement';

export default async function EggIncubationPage() {
  const user = await auth.getUserSession();
  if (!user) {
    // Redirect to login if no session
    return { redirect: '/login' };
  }

  return (
    <DashboardLayout role="farm_worker" user={user}>
      <EggIncubationManagement />
    </DashboardLayout>
  );
}
