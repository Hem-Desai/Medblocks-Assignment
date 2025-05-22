import React, { useEffect, useState } from 'react';
import { useDatabase } from './hooks/useDatabase';
import PatientForm from './components/PatientForm';
import SQLQueryEditor from './components/SQLQueryEditor';
import Header from './components/Header';
import Footer from './components/Footer';
import { Toaster, toast } from 'react-hot-toast';
import { Loader2, Database } from 'lucide-react';
import { addSamplePatients } from './utils/sampleData';
import { migrateExistingDates } from './utils/dateMigration';

function App() {
  const { isInitialized, broadcastUpdate, refreshDatabase } = useDatabase();
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingSamples, setIsAddingSamples] = useState(false);
  
  useEffect(() => {
    // We'll show a loading state briefly to ensure the database is initialized
    if (isInitialized) {
      // Run the date migration to update existing ISO dates
      migrateExistingDates().then(() => {
        // After migration is complete, set loading to false
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 600);
        
        return () => clearTimeout(timer);
      }).catch(error => {
        console.error('Error during date migration:', error);
        setIsLoading(false);
      });
    }
  }, [isInitialized]);
  
  const handlePatientAdded = () => {
    refreshDatabase();
    broadcastUpdate('PATIENT_ADDED');
  };
  
  const handleQueryExecuted = () => {
    refreshDatabase();
    broadcastUpdate('SQL_EXECUTED');
  };

  const handleAddSampleData = async () => {
    if (isAddingSamples) return;
    
    setIsAddingSamples(true);
    try {
      await addSamplePatients();
      toast.success('Sample patients added successfully!');
      refreshDatabase();
      broadcastUpdate('PATIENT_ADDED');
    } catch (error) {
      toast.error('Failed to add sample patients');
      console.error('Failed to add sample patients:', error);
    } finally {
      setIsAddingSamples(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-lg text-gray-600">Initializing database...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-end">
            <button
              onClick={handleAddSampleData}
              disabled={isAddingSamples}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${isAddingSamples ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <Database className="h-4 w-4 mr-2" />
              {isAddingSamples ? 'Adding...' : 'Add Sample Patients'}
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="lg:col-span-1">
              <PatientForm onPatientAdded={handlePatientAdded} />
            </div>
            
            <div className="lg:col-span-1">
              <SQLQueryEditor onQueryExecuted={handleQueryExecuted} />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;