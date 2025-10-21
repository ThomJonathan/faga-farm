'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import HousesManagement from './HousesManagement';
import BreedsManagement from './BreedsManagement';
import IncubatorsManagement from './IncubatorsManagement';
import BatchesManagement from './BatchesManagement';
import EggCollectionManagement from './EggCollectionManagement';
import EggIncubationManagement from './EggIncubationManagement';
import MortalityManagement from './MortalityManagement';
import VaccinationManagement from './VaccinationManagement';
import TreatmentManagement from './TreatmentManagement';

import ManureProductionManagement from './ManureProductionManagement';
import MeatProductionManagement from './MeatProductionManagement';

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
      case 'egg-incubation':
        return <EggIncubationManagement />;
      case 'mortality':
        return <MortalityManagement />;
      case 'vaccinations':
        return <VaccinationManagement />;
      case 'treatments':
        return <TreatmentManagement />;

      case 'manure-production':
        return <ManureProductionManagement />;
      case 'meat-production':
        return <MeatProductionManagement />;
      default:
        return <DashboardContent />;
    }
  };

  const DashboardContent = () => {
    const [dashboardData, setDashboardData] = useState({
      activeBatches: [],
      todaysEggCollection: [],
      totalMortality: 0,
      totalBirds: 0,
      availableHouses: [],
      recentActivities: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetchDashboardData();
      // Set up real-time updates every 30 seconds
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
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

        const activeBatches = batches.filter(batch => batch.status === 'active');
        const activeBatchesCount = activeBatches.length;

        // Group active batches by breed
        const breedsCount = {};
        activeBatches.forEach(batch => {
          const breed = batch.breed_name || 'Unknown';
          breedsCount[breed] = (breedsCount[breed] || 0) + 1;
        });

        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const todaysCollections = eggCollections.records.filter(record => {
          const recordDate = new Date(record.collection_date);
          const recordDateString = recordDate.toISOString().split('T')[0];
          console.log('Today:', todayString, 'Record date:', recordDateString, 'Match:', recordDateString === todayString);
          return recordDateString === todayString;
        });
        const todaysEggCollection = todaysCollections.reduce((sum, record) => sum + record.quantity, 0);

        // Group today's collections by batch
        const todaysBatches = {};
        todaysCollections.forEach(record => {
          const batch = record.batch_number;
          todaysBatches[batch] = (todaysBatches[batch] || 0) + record.quantity;
        });

        const totalMortality = mortalityRecords.reduce((sum, record) => sum + record.dead_count, 0);

        const availableHouses = houses.filter(house => house.is_active);
        const availableHousesCount = availableHouses.length;

        // Get batches per house
        const houseBatches = {};
        activeBatches.forEach(batch => {
          const house = batch.house_name || 'Unknown';
          if (!houseBatches[house]) houseBatches[house] = [];
          houseBatches[house].push(batch.batch_number);
        });

        // Calculate total birds (sum of all active batch quantities)
        const totalBirds = activeBatches.reduce((sum, batch) => sum + (batch.initial_quantity || 0), 0);

        // Get recent activities (last 5 records from different sources)
        const activities = [
          ...eggCollections.records.slice(0, 3).map(record => ({
            type: 'egg_collection',
            message: `Egg collection: ${record.quantity} eggs from batch ${record.batch_number}`,
            date: record.collection_date,
            timestamp: new Date(record.collection_date).getTime()
          })),
          ...mortalityRecords.slice(0, 2).map(record => ({
            type: 'mortality',
            message: `Mortality recorded: ${record.dead_count} deaths in batch ${record.batch_number}`,
            date: record.date_recorded,
            timestamp: new Date(record.date_recorded).getTime()
          }))
        ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

        setDashboardData({
          activeBatches: {
            count: activeBatchesCount,
            breeds: breedsCount
          },
          todaysEggCollection: {
            total: todaysEggCollection,
            batches: todaysBatches
          },
          totalMortality,
          totalBirds,
          availableHouses: {
            count: availableHousesCount,
            houses: availableHouses.slice(0, 3).map(house => ({
              name: house.name,
              batches: houseBatches[house.name] || []
            }))
          },
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setCurrentPage('batches')}
              >
                <h3 className="text-lg font-medium text-gray-900">Active Batches</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">{dashboardData.activeBatches.count}</p>
                <div className="mt-2 space-y-1">
                  {Object.entries(dashboardData.activeBatches.breeds).slice(0, 2).map(([breed, count]) => (
                    <div key={breed} className="flex justify-between text-xs text-gray-600">
                      <span className="truncate mr-1">{breed}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setCurrentPage('mortality')}
              >
                <h3 className="text-lg font-medium text-gray-900">Birds</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">{dashboardData.totalBirds}</p>
                <p className="text-xs text-gray-600 mt-1">total birds</p>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-sm font-medium text-red-600">{dashboardData.totalMortality} mortality</p>
                </div>
              </div>

              <div
                className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setCurrentPage('houses')}
              >
                <h3 className="text-lg font-medium text-gray-900">Available Houses</h3>
                <p className="text-2xl font-bold text-purple-600 mt-1">{dashboardData.availableHouses.count}</p>
                <div className="mt-2 space-y-1">
                  {dashboardData.availableHouses.houses.slice(0, 2).map((house) => (
                    <div key={house.name} className="text-xs text-gray-600">
                      <div className="font-medium">{house.name}</div>
                      <div className="text-xs">
                        {house.batches.length > 0 ? `${house.batches.slice(0, 2).join(', ')}${house.batches.length > 2 ? '...' : ''}` : 'No batches'}
                      </div>
                    </div>
                  ))}
                </div>
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
