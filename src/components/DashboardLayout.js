'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children, role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navigation = {
    farm_worker: [
      { name: 'Dashboard', href: '/farm-worker', icon: '🏠' },
      { name: 'Batches', href: '/farm-worker/batches', icon: '🐔' },
      { name: 'Egg Collection', href: '/farm-worker/egg-collection', icon: '🥚' },
      { name: 'Mortality', href: '/farm-worker/mortality', icon: '⚠️' },
    ],
    sales_person: [
      { name: 'Dashboard', href: '/sales-person', icon: '🏠' },
      { name: 'Customers', href: '/sales-person/customers', icon: '👥' },
      { name: 'Orders', href: '/sales-person/orders', icon: '📋' },
      { name: 'Sales', href: '/sales-person/sales', icon: '💰' },
    ],
    manager: [
      { name: 'Dashboard', href: '/manager', icon: '🏠' },
      { name: 'Reports', href: '/manager/reports', icon: '📊' },
      { name: 'Users', href: '/manager/users', icon: '👤' },
    ],
  };

  const currentNav = navigation[role] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-500">✕</button>
          </div>
          <nav className="p-4">
            {currentNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:block">
        <div className="flex flex-col h-full bg-white shadow-lg">
          <div className="flex items-center p-4 border-b">
            <h1 className="text-xl font-bold text-gray-900">Farm Manager</h1>
          </div>
          <nav className="flex-1 p-4">
            {currentNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-sm font-medium mb-1 ${
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <Link
              href="/login"
              className="block w-full text-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Logout
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-10 bg-white border-b lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-semibold text-gray-900">Farm Manager</h1>
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              ☰
            </button>
          </div>
        </div>
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
