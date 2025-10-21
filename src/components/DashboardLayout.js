'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import NotificationCenter from './NotificationCenter';
import GlobalSearch from './GlobalSearch';

export default function DashboardLayout({ children, role, user, currentPage, onPageChange }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      setSidebarOpen(false);
      setShowLogoutModal(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigation = {
    farm_worker: [
      { name: 'Dashboard', href: '/farm-worker', icon: '📊' },
      {
        name: 'Production',
        icon: '🐣',
        children: [
          { name: 'Batches', href: '/farm-worker/batches', icon: '📦' },
          { name: 'Egg Collection', href: '/farm-worker/egg-collection', icon: '🧺' },
          { name: 'Egg Incubation', href: '/farm-worker/egg-incubation', icon: '🌡️' },
          { name: 'Meat Production', href: '/farm-worker/meat-production', icon: '🥩' },
          { name: 'Manure Production', href: '/farm-worker/manure-production', icon: '💩' },
        ]
      },
      {
        name: 'Health',
        icon: '💊',
        children: [
          { name: 'Mortality', href: '/farm-worker/mortality', icon: '💀' },
          { name: 'Vaccinations', href: '/farm-worker/vaccinations', icon: '💉' },
          { name: 'Treatments', href: '/farm-worker/treatments', icon: '🩺' },
        ]
      },
      {
        name: 'Farm Setup',
        icon: '⚙️',
        children: [
          { name: 'Houses', href: '/farm-worker/houses', icon: '🏠' },
          { name: 'Breeds', href: '/farm-worker/breeds', icon: '🐔' },
          { name: 'Incubators', href: '/farm-worker/incubators', icon: '🥚' },
        ]
      },
    ],
    sales_person: [
      { name: 'Dashboard', href: '/sales-person', icon: '🏠' },
      { name: 'Customers', href: '/sales-person/customers', icon: '👥' },
      { name: 'Orders', href: '/sales-person/orders', icon: '📋' },
      { name: 'Sales', href: '/sales-person/sales', icon: '💰' },
    ],
    manager: [
      { name: 'Dashboard', href: '/manager', icon: '🏠' },
      { name: 'Inventory Management', href: '/manager/inventory', icon: '📦' },
      { name: 'Expenses', href: '/manager/expenses', icon: '💰' },
      { name: 'Reports', href: '/manager/reports', icon: '📊' },
      { name: 'Users', href: '/manager/users', icon: '👤' },
    ],
  };

  const currentNav = navigation[role] || [];

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Auto-expand groups that contain active child items
  const getExpandedGroups = () => {
    const autoExpanded = { ...expandedGroups };
    currentNav.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => {
          const isActive = role === 'sales_person'
            ? currentPage === child.name.toLowerCase().replace(' ', '')
            : pathname === child.href;
          return isActive;
        });
        if (hasActiveChild) {
          autoExpanded[item.name] = true;
        }
      }
    });
    return autoExpanded;
  };

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

        {/* Search and Notifications */}
        <div className="flex-1 flex justify-center px-4">
          <GlobalSearch />
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-3">
          <NotificationCenter user={user} />
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
              if (item.children) {
                const isExpanded = getExpandedGroups()[item.name];
                return (
                  <div key={item.name}>
                    <div
                      className={`block px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      onClick={() => toggleGroup(item.name)}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.name}
                      <span className="ml-auto">{isExpanded ? '▼' : '▶'}</span>
                    </div>
                    {isExpanded && (
                      <div className="ml-4 mt-1">
                        {item.children.map((child) => {
                          const childIsActive = role === 'sales_person' ? currentPage === child.name.toLowerCase().replace(' ', '') : pathname === child.href;
                          return (
                            <div
                              key={child.name}
                              className={`block px-3 py-1 rounded-md text-sm cursor-pointer ${
                                childIsActive
                                  ? 'bg-blue-100 text-blue-700'
                                  : child.comingSoon
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                              onClick={(e) => {
                                if (child.comingSoon) {
                                  e.preventDefault();
                                  alert('Coming Soon!');
                                  return;
                                }
                                if (role === 'farm_worker' && onPageChange) {
                                  onPageChange(child.name.toLowerCase().replace(' ', '-'));
                                  setSidebarOpen(false);
                                } else if (role === 'sales_person' && onPageChange) {
                                  onPageChange(child.name.toLowerCase().replace(' ', ''));
                                  setSidebarOpen(false);
                                } else {
                                  router.push(child.href);
                                  setSidebarOpen(false);
                                }
                              }}
                            >
                              <span className="mr-2">{child.icon}</span>
                              {child.name}
                              {child.comingSoon && <span className="ml-2 text-xs">(Soon)</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <Link
                    key={item.name}
                    href={item.href}
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
                      if (role === 'farm_worker' && onPageChange) {
                        e.preventDefault();
                        onPageChange(item.name.toLowerCase().replace(' ', '-'));
                        setSidebarOpen(false);
                      } else if (role === 'sales_person' && onPageChange) {
                        e.preventDefault();
                        onPageChange(item.name.toLowerCase().replace(' ', ''));
                        setSidebarOpen(false);
                      } else {
                        setSidebarOpen(false);
                      }
                    }}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                    {item.comingSoon && <span className="ml-2 text-xs">(Soon)</span>}
                  </Link>
                );
              }
            })}
            <div className="mt-4 border-t pt-4">
              <button
                onClick={() => setShowLogoutModal(true)}
                className="block w-full text-center px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
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
              if (item.children) {
                const isExpanded = getExpandedGroups()[item.name];
                return (
                  <div key={item.name} className="mb-1">
                    <div
                      className={`block px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      onClick={() => toggleGroup(item.name)}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.name}
                      <span className="ml-auto">{isExpanded ? '▼' : '▶'}</span>
                    </div>
                    {isExpanded && (
                      <div className="ml-4 mt-1">
                        {item.children.map((child) => {
                          const childIsActive = role === 'sales_person' ? currentPage === child.name.toLowerCase().replace(' ', '') : pathname === child.href;
                          return (
                            <div
                              key={child.name}
                              className={`block px-3 py-1 rounded-md text-sm cursor-pointer ${
                                childIsActive
                                  ? 'bg-blue-100 text-blue-700'
                                  : child.comingSoon
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                              onClick={(e) => {
                                if (child.comingSoon) {
                                  e.preventDefault();
                                  alert('Coming Soon!');
                                  return;
                                }
                                if (role === 'farm_worker' && onPageChange) {
                                  onPageChange(child.name.toLowerCase().replace(' ', '-'));
                                } else if (role === 'sales_person' && onPageChange) {
                                  onPageChange(child.name.toLowerCase().replace(' ', ''));
                                } else {
                                  router.push(child.href);
                                }
                              }}
                            >
                              <span className="mr-2">{child.icon}</span>
                              {child.name}
                              {child.comingSoon && <span className="ml-2 text-xs">(Soon)</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <Link
                    key={item.name}
                    href={item.href}
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
                        e.preventDefault();
                        onPageChange(item.name.toLowerCase().replace(' ', ''));
                      } else {
                        // For other roles, use Link behavior
                      }
                    }}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                    {item.comingSoon && <span className="ml-2 text-xs">(Soon)</span>}
                  </Link>
                );
              }
            })}
          </nav>
          <div className="p-4 border-t">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="block w-full text-center px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Logout</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to log out of the Faga Farm Management System?
              </p>
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content - push down by header height and pad for sidebar on lg */}
      <div className="mt-16 lg:pl-64 h-[calc(100vh-4rem)] overflow-hidden">
        <main className="p-4 h-full overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
