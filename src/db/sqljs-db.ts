import { Database } from 'sql.js';
import { initSqlJsWithConfig } from './sqljs-init';
import { Patient } from '../types';
import { openDB, IDBPDatabase } from 'idb';


const DB_NAME = 'medblock_sqljs_storage';
const DB_VERSION = 1;
const STORE_NAME = 'sqljs_data';
const DB_KEY = 'database_binary';

let db: Database | null = null;

const getIndexedDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};


const saveToIndexedDB = async (): Promise<void> => {
  if (!db) return;
  
  try {
    const data = db.export();
    
    const idb = await getIndexedDB();
    await idb.put(STORE_NAME, data, DB_KEY);
    
    const event = new CustomEvent('medblock-db-updated', { 
      detail: { timestamp: Date.now() } 
    });
    window.dispatchEvent(event);
    
    console.log('Database saved to IndexedDB');
  } catch (error) {
    console.error('Failed to save database to IndexedDB:', error);
  }
};

const loadFromIndexedDB = async (): Promise<Database | null> => {
  try {
    const idb = await getIndexedDB();
    const data = await idb.get(STORE_NAME, DB_KEY) as Uint8Array | undefined;
    
    if (!data) {
      console.log('No database found in IndexedDB');
      return null;
    }
    
    const SQL = await initSqlJsWithConfig();
    const loadedDb = new SQL.Database(data);
    
    console.log('Database loaded from IndexedDB');
    return loadedDb;
  } catch (error) {
    console.error('Failed to load database from IndexedDB:', error);
    return null;
  }
};

export const initSqlJsDatabase = async (): Promise<Database> => {
  try {
    if (db) return db;
    
    const loadedDb = await loadFromIndexedDB();
    
    if (loadedDb) {
      db = loadedDb;
      return db;
    }
    
    const SQL = await initSqlJsWithConfig();
    db = new SQL.Database();
    
    if (db) {
      db.run(`
        CREATE TABLE IF NOT EXISTS patients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          age INTEGER NOT NULL,
          gender TEXT NOT NULL,
          dateOfBirth TEXT NOT NULL,
          address TEXT NOT NULL,
          createdAt TEXT NOT NULL
        );
      `);
      
      await saveToIndexedDB();
      
      console.log('SQL.js database initialized successfully');
      return db;
    } else {
      throw new Error('Failed to create SQL.js database instance');
    }
  } catch (error) {
    console.error('Failed to initialize SQL.js database:', error);
    throw error;
  }
};


export const addPatientToSqlJs = async (patient: Patient): Promise<void> => {
  try {
    const database = await initSqlJsDatabase();
    
    const { name, age, gender, dateOfBirth, address } = patient;
    const createdAt = patient.createdAt || new Date().toISOString();
    
    database.run(`
      INSERT INTO patients (name, age, gender, dateOfBirth, address, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, age, gender, dateOfBirth, address, createdAt]);
    
    await saveToIndexedDB();
    
    console.log('Patient added to SQL.js database successfully');
  } catch (error) {
    console.error('Failed to add patient to SQL.js database:', error);
    throw error;
  }
};


export const executeSqlQuery = async (query: string): Promise<any> => {
  try {
    const database = await initSqlJsDatabase();
    
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.startsWith('drop') || 
        normalizedQuery.startsWith('truncate')) {
      throw new Error('Destructive operations are not allowed');
    }
    
    const isModifyingQuery = 
      normalizedQuery.startsWith('insert') || 
      normalizedQuery.startsWith('update') || 
      normalizedQuery.startsWith('delete');
    

    const result = database.exec(query);
    
    if (isModifyingQuery) {
      await saveToIndexedDB();
    }
    
    return result;
  } catch (error) {
    console.error('Failed to execute SQL query:', error);
    throw error;
  }
};


export const getAllPatientsFromSqlJs = async (): Promise<Patient[]> => {
  try {
    const database = await initSqlJsDatabase();
    
    const result = database.exec('SELECT * FROM patients');
    
    if (result.length === 0 || result[0].values.length === 0) {
      return [];
    }
    
    return result[0].values.map((row: any[]) => {
      return {
        id: row[0],
        name: row[1],
        age: row[2],
        gender: row[3] as 'male' | 'female' | 'other',
        dateOfBirth: row[4],
        address: row[5],
        createdAt: row[6]
      };
    });
  } catch (error) {
    console.error('Failed to get patients from SQL.js database:', error);
    throw error;
  }
};


export const exportDatabase = (): Uint8Array => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  return db.export();
};


export const importDatabase = async (data: Uint8Array): Promise<void> => {
  try {
    const SQL = await initSqlJsWithConfig();
    const newDb = new SQL.Database(data);
    
    if (newDb) {
      db = newDb;
      console.log('Database imported successfully');
    } else {
      throw new Error('Failed to create database from imported data');
    }
  } catch (error) {
    console.error('Failed to import database:', error);
    throw error;
  }
};
