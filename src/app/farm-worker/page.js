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

  const DashboardContent = () => {
    const [dashboardData, setDashboardData] = useState({
      activeBatches: 0,
      todaysEggCollection: 0,
      mortalityRate: 0,
      availableHouses: 0,
      recentActivities: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
      try {
        const [batchesRes, eggCollectionRes, mortalityRes, housesRes] = await Promise.all([
          fetch('/api/batches'),
          fetch('/api/egg-collection'),
          fetch('/api/mortality'),
          fetch('/api/houses')
        ]);

        const batches = batchesRes.ok ? await batchesRes.json() : [];
        const eggCollections = eggCollectionRes.ok ? await eggCollectionRes.json() : { records: [] };
        const mortalityRecords = mortalityRes.ok ? await mortalityRes.json() : [];
        const houses = housesRes.ok ? await housesRes.json() : [];

        const activeBatches = batches.filter(batch => batch.status === 'active').length;

        const today = new Date().toISOString().split('T')[0];
        const todaysEggCollection = eggCollections.records
          .filter(record => record.collection_date === today)
          .reduce((sum, record) => sum + record.quantity, 0);

        const totalDeaths = mortalityRecords.reduce((sum, record) => sum + record.dead_count, 0);
        const totalInitialQuantity = batches.reduce((sum, batch) => sum + batch.initial_quantity, 0);
        const mortalityRate = totalInitialQuantity > 0 ? ((totalDeaths / totalInitialQuantity) * 100).toFixed(1) : 0;

        const availableHouses = houses.filter(house => house.is_active).length;

        // Get recent activities (last 5 records from different sources)
        const activities = [
          ...eggCollections.records.slice(0, 3).map(record => ({
            type: 'egg_collection',
            message: `Egg collection: ${record.quantity} eggs from batch ${record.batch_number}`,
            date: record.collection_date
          })),
          ...mortalityRecords.slice(0, 2).map(record => ({
            type: 'mortality',
            message: `Mortality recorded: ${record.dead_count} deaths in batch ${record.batch_number}`,
            date: record.date_recorded
          }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

        setDashboardData({
          activeBatches,
          todaysEggCollection,
          mortalityRate,
          availableHouses,
          recentActivities: activities
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Farm Worker Dashboard</h1>

        {loading ? (
          <div className="text-center py-8">Loading dashboard data...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setCurrentPage('batches')}
              >
                <h3 className="text-lg font-medium text-gray-900">Active Batches</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{dashboardData.activeBatches}</p>
              </div>

              <div
                className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setCurrentPage('egg-collection')}
              >
                <h3 className="text-lg font-medium text-gray-900">Today's Egg Collection</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">{dashboardData.todaysEggCollection}</p>
              </div>

              <div
                className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setCurrentPage('mortality')}
              >
                <h3 className="text-lg font-medium text-gray-900">Mortality Rate</h3>
                <p className="text-3xl font-bold text-red-600 mt-2">{dashboardData.mortalityRate}%</p>
              </div>

              <div
                className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setCurrentPage('houses')}
              >
                <h3 className="text-lg font-medium text-gray-900">Available Houses</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">{dashboardData.availableHouses}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>
              <div className="space-y-3">
                {dashboardData.recentActivities.length > 0 ? (
                  dashboardData.recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.type === 'egg_collection' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No recent activities</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

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
