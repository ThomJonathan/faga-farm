'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import SalesManagement from '../SalesManagement';

export default function SalesPage() {
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
      <SalesManagement />
    </DashboardLayout>
  );
}
