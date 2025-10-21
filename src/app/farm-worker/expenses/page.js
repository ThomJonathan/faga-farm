import DashboardLayout from '../../../components/DashboardLayout';
import auth from '../../../lib/auth';
import { redirect } from 'next/navigation';
import ExpenseManagement from '../ExpenseManagement';

export default async function ExpensesPage() {
  const user = await auth.getUserSession();
  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardLayout role="farm_worker" user={user}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Expenses Management</h1>
        <ExpenseManagement />
      </div>
    </DashboardLayout>
  );
}
