'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import HousesManagement from './HousesManagement';
import BreedsManagement from './BreedsManagement';
import IncubatorsManagement from './IncubatorsManagement';
import BatchesManagement from './BatchesManagement';
import EggCollectionManagement from './EggCollectionManagement';
import MortalityManagement from './MortalityManagement';

export default function FarmWorkerDashboard() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

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

  const renderContent = () => {
    switch (currentPage) {
      case 'houses':
        return <HousesManagement />;
      case 'breeds':
        return <BreedsManagement />;
      case 'incubators':
        return <IncubatorsManagement />;
      case 'batches':
        return <BatchesManagement />;
      case 'egg-collection':
        return <EggCollectionManagement />;
      case 'mortality':
        return <MortalityManagement />;
      default:
        return <DashboardContent />;
    }
  };

  const DashboardContent = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Farm Worker Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Active Batches</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">--</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Today's Egg Collection</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">--</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Mortality Rate</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">--%</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Available Houses</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">--</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>
        <div className="space-y-3">
          <p className="text-gray-600">No recent activities</p>
        </div>
      </div>
    </div>
  );

  // Placeholder components for other sections

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout
      role="farm_worker"
      user={user}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
    >
      {renderContent()}
    </DashboardLayout>
  );
}
