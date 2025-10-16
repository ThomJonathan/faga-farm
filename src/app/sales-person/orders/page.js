'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import OrdersManagement from '../OrdersManagement';

export default function OrdersPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
      }
    };
    getUser();
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout role="sales_person" user={user}>
      <OrdersManagement />
    </DashboardLayout>
  );
}
