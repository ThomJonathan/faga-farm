import DashboardLayout from '../../../components/DashboardLayout';
import auth from '../../../lib/auth';
import { redirect } from 'next/navigation';

export default async function ExpensesLayout({ children }) {
  const user = await auth.getUserSession();
  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardLayout role="manager" user={user}>
      <div className="space-y-6">
        {children}
      </div>
    </DashboardLayout>
  );
}
