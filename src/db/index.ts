import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Patient, SQLQueryResult } from '../types';
import { initPGliteDatabase, addPatientToPGlite, executePGliteQuery, getAllPatientsFromPGlite } from './pglite-db';

interface PatientDBSchema extends DBSchema {
  patients: {
    key: number;
    value: Patient;
    indexes: {
      'by-name': string;
      'by-created': number;
    };
  };
  queries: {
    key: string;
    value: {
      sql: string;
      timestamp: number;
    };
  };
}

const DB_NAME = 'medblock_patient_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PatientDBSchema>> | null = null;

const getDB = async (): Promise<IDBPDatabase<PatientDBSchema>> => {
  if (!dbPromise) {
    dbPromise = openDB<PatientDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('patients')) {
          const patientsStore = db.createObjectStore('patients', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          patientsStore.createIndex('by-name', 'name');
          patientsStore.createIndex('by-created', 'createdAt');
        }
        
        if (!db.objectStoreNames.contains('queries')) {
          db.createObjectStore('queries', { keyPath: 'sql' });
        }
      },
    });
  }
  return dbPromise;
};

  export const initDatabase = async (): Promise<IDBPDatabase<PatientDBSchema>> => {
  try {
    const db = await getDB();
    
    await initPGliteDatabase();
    
    console.log('Databases initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize databases:', error);
    throw error;
  }
};

export const syncDatabase = async (): Promise<void> => {
  try {
    // Trigger a custom event to notify all tabs that the database has been updated
    const updateEvent = new CustomEvent('medblock-db-updated', {
      detail: { timestamp: Date.now() }
    });
    window.dispatchEvent(updateEvent);
    
    console.log('Database synchronized');
  } catch (error) {
    console.error('Failed to sync database:', error);
    throw error;
  }
};

// new patient
export const addPatient = async (patient: Patient): Promise<void> => {
  try {
    const db = await getDB();
    const { name, age, gender, dateOfBirth, address } = patient;
    
    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    const newPatient: Patient = {
      name,
      age,
      gender,
      dateOfBirth,
      address,
      createdAt: formattedDate
    };
    
    await db.add('patients', newPatient);
    
    await addPatientToPGlite(newPatient);
    
    // Trigger synchronization across tabs
    await syncDatabase();
    
    console.log('Patient added successfully to both databases');
  } catch (error) {
    console.error('Failed to add patient:', error);
    throw error;
  }
};

const parseQuery = (query: string): { action: string; table: string; conditions?: string } => {
  const normalizedQuery = query.trim().toLowerCase();
  
  if (normalizedQuery.startsWith('select')) {
    const fromIndex = normalizedQuery.indexOf('from');
    if (fromIndex === -1) throw new Error('Invalid SELECT query: missing FROM clause');
    
    const table = normalizedQuery.substring(fromIndex + 4).trim().split(' ')[0];
    const whereIndex = normalizedQuery.indexOf('where');
    const conditions = whereIndex !== -1 ? normalizedQuery.substring(whereIndex + 5).trim() : undefined;
    
    return { action: 'select', table, conditions };
  }
  
  throw new Error('Only SELECT queries are supported');
};

export const executeQuery = async (query: string): Promise<any> => {
  try {
    const db = await getDB();
    
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.startsWith('drop') || 
        normalizedQuery.startsWith('truncate') || 
        normalizedQuery.startsWith('delete')) {
      throw new Error('Destructive operations are not allowed');
    }
    
    await db.put('queries', {
      sql: query,
      timestamp: Date.now()
    });
    
    const result = await executePGliteQuery(query);
    
    return [result];
  } catch (error) {
    console.error('Failed to execute query:', error);
    throw error;
  }
};

export const getAllPatients = async (): Promise<Patient[]> => {
  try {
    const db = await getDB();
    const idbPatients = await db.getAll('patients');
    const pglitePatients = await getAllPatientsFromPGlite();
    
    const patientMap = new Map<number, Patient>();
    
    idbPatients.forEach(patient => {
      if (patient.id) {
        patientMap.set(patient.id, patient);
      }
    });
    
    pglitePatients.forEach(patient => {
      if (patient.id) {
        patientMap.set(patient.id, patient);
      }
    });
    
    return Array.from(patientMap.values());
  } catch (error) {
    console.error('Failed to get patients:', error);
    throw error;
  }
};

export const getPatientCount = async (): Promise<number> => {
  try {
    const db = await getDB();
    return await db.count('patients');
  } catch (error) {
    console.error('Failed to get patient count:', error);
    throw error;
  }
};