import { useState, useEffect, useCallback } from 'react';
import { initDatabase, syncDatabase } from '../db';
import { DatabaseState, BroadcastMessage } from '../types';

const channel = new BroadcastChannel('patient_db_channel');

export const useDatabase = () => {
  const [dbState, setDbState] = useState<DatabaseState>({
    isInitialized: false,
    lastUpdate: Date.now(),
  });
  
  const initialize = useCallback(async () => {
    try {
      await initDatabase();
      setDbState({
        isInitialized: true,
        lastUpdate: Date.now(),
      });
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }, []);
  
  const broadcastUpdate = useCallback((type: BroadcastMessage['type']) => {
    const message: BroadcastMessage = {
      type,
      timestamp: Date.now(),
    };
    
    channel.postMessage(message);
    
    setDbState((prev: DatabaseState) => ({
      ...prev,
      lastUpdate: message.timestamp,
    }));
  }, []);
  
  useEffect(() => {
    const handleMessage = async (event: MessageEvent<BroadcastMessage>) => {
      const { type, timestamp } = event.data;
      
      console.log(`Received message from another tab: ${type}`);
      
      if (timestamp > dbState.lastUpdate) {
        try {
          await syncDatabase();
          
          setDbState({
            isInitialized: true,
            lastUpdate: timestamp,
          });
          
          console.log('Database synchronized successfully');
        } catch (error) {
          console.error('Failed to sync database:', error);
        }
      }
    };
    
    const handleCustomEvent = async (event: Event) => {
      console.log('Database changed in another tab (via IndexedDB)');
      
      try {
        await syncDatabase();
        
        const customEvent = event as CustomEvent<{timestamp: number}>;
        
        setDbState({
          isInitialized: true,
          lastUpdate: customEvent.detail?.timestamp || Date.now(),
        });
        
        console.log('Database synchronized from IndexedDB changes');
      } catch (error) {
        console.error('Failed to sync database from IndexedDB:', error);
      }
    };
    
    channel.addEventListener('message', handleMessage);
    window.addEventListener('medblock-db-updated', handleCustomEvent);
    
    if (!dbState.isInitialized) {
      initialize();
    }
    
    return () => {
      channel.removeEventListener('message', handleMessage);
      window.removeEventListener('medblock-db-updated', handleCustomEvent);
    };
  }, [dbState.lastUpdate, initialize]);
  
  const refreshDatabase = useCallback(async () => {
    try {
      await syncDatabase();
      setDbState((prev: DatabaseState) => ({
        ...prev,
        lastUpdate: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to refresh database:', error);
    }
  }, []);
  
  return {
    isInitialized: dbState.isInitialized,
    lastUpdate: dbState.lastUpdate,
    broadcastUpdate,
    refreshDatabase,
  };
};