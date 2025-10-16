'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children, role, user, currentPage, onPageChange }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navigation = {
    farm_worker: [
      { name: 'Dashboard', href: '/farm-worker', icon: '📊' },
      { name: 'Houses', href: '/farm-worker/houses', icon: '🏠' },
      { name: 'Breeds', href: '/farm-worker/breeds', icon: '🐔'},
      { name: 'Incubators', href: '/farm-worker/incubators', icon: '🥚' },
      { name: 'Batches', href: '/farm-worker/batches', icon: '📦' },
      { name: 'Egg Collection', href: '/farm-worker/egg-collection', icon: '🧺' },
      { name: 'Egg Incubation', href: '/farm-worker/egg-incubation', icon: '🌡️' },
      { name: 'Mortality', href: '/farm-worker/mortality', icon: '💀' },
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

  const handleNavClick = (item, e) => {
    if (item.comingSoon) {
      e.preventDefault();
      alert('Coming Soon!');
      return;
    }
  };

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {/* Top header (fixed) - reusable */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b h-16 flex items-center px-4">
        <div className="flex items-center space-x-3">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 p-2 rounded-md hover:bg-gray-100"
            aria-label="Open menu"
          >
            ☰
          </button>
          <img src="/fagaFarm.png" alt="Faga Farm Logo" className="h-10 w-10 rounded-full" />
          <div className="hidden sm:block">
            <div className="text-lg font-semibold text-gray-900">Faga Production Inventory Management System</div>
            <div className="text-xs text-gray-500">Poultry Farm Management</div>
          </div>
        </div>

        {/* spacer */}
        <div className="flex-1" />

        {/* profile area (right) */}
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-700 hidden md:block">{user?.name || 'Username'}</div>
          {/* Profile icon using Heroicons (Tailwind) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 rounded-full border bg-gray-200 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9.001 9.001 0 0112 15c2.21 0 4.21.805 5.879 2.146M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </header>

      {/* Mobile sidebar (overlay) - appears below header */}
      <div className={`fixed inset-x-0 top-16 bottom-0 z-50 ${sidebarOpen ? 'block' : 'hidden'} lg:hidden`}>
        {/* overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} />
        {/* sidebar panel */}
        <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <button onClick={() => setSidebarOpen(false)} className="text-gray-500">✕</button>
          </div>
          <nav className="p-4 mt-2">
            {currentNav.map((item) => {
              const isActive = role === 'sales_person' ? currentPage === item.name.toLowerCase().replace(' ', '') : pathname === item.href;
              return (
                <div
                  key={item.name}
                  className={`block px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : item.comingSoon
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={(e) => {
                    if (item.comingSoon) {
                      e.preventDefault();
                      alert('Coming Soon!');
                      return;
                    }
                    if (role === 'sales_person' && onPageChange) {
                      onPageChange(item.name.toLowerCase().replace(' ', ''));
                    } else {
                      // For other roles, use Link behavior
                      window.location.href = item.href;
                    }
                  }}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                  {item.comingSoon && <span className="ml-2 text-xs">(Soon)</span>}
                </div>
              );
            })}
            <div className="mt-4 border-t pt-4">
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  router.push('/login');
                  setSidebarOpen(false);
                }}
                className="block w-full text-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Logout
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar - below header */}
      <aside className="hidden lg:block lg:fixed lg:top-16 lg:left-0 lg:w-64 lg:bottom-0">
        <div className="flex flex-col h-full bg-white shadow-lg">
          <nav className="flex-1 p-4 overflow-auto">
            {currentNav.map((item) => {
              const isActive = role === 'sales_person' ? currentPage === item.name.toLowerCase().replace(' ', '') : pathname === item.href;
              return (
                <div
                  key={item.name}
                  className={`block px-3 py-2 rounded-md text-sm font-medium mb-1 cursor-pointer ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : item.comingSoon
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={(e) => {
                    if (item.comingSoon) {
                      e.preventDefault();
                      alert('Coming Soon!');
                      return;
                    }
                    if (role === 'sales_person' && onPageChange) {
                      onPageChange(item.name.toLowerCase().replace(' ', ''));
                    } else {
                      // For other roles, use Link behavior
                      window.location.href = item.href;
                    }
                  }}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                  {item.comingSoon && <span className="ml-2 text-xs">(Soon)</span>}
                </div>
              );
            })}
          </nav>
          <div className="p-4 border-t">
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.push('/login');
              }}
              className="block w-full text-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content - push down by header height and pad for sidebar on lg */}
      <div className="mt-16 lg:pl-64 h-[calc(100vh-4rem)] overflow-hidden">
        <main className="p-4 h-full overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
