import { PGlite } from '@electric-sql/pglite';
import { getPGliteConnection } from './pglite-init';
import { Patient, SQLQueryResult } from '../types';

export const initPGliteDatabase = async (): Promise<PGlite> => {
  try {
    const pglite = await getPGliteConnection();
    
    await pglite.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        "dateOfBirth" TEXT NOT NULL,
        address TEXT NOT NULL,
        "createdAt" TEXT NOT NULL
      );
    `);
    
    const result = await pglite.query('SELECT COUNT(*) FROM patients');
    const count = parseInt(result.rows?.[0]?.[0] as string || '0', 10);
    
    if (count === 0) {
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
      
      await pglite.query(`
        INSERT INTO patients (name, age, gender, "dateOfBirth", address, "createdAt")
        VALUES 
          ('John Smith', 45, 'male', '1980-05-15', '123 Main St, New York, NY', '${formattedDate}'),
          ('Sarah Johnson', 32, 'female', '1993-08-21', '456 Park Ave, Boston, MA', '${formattedDate}'),
          ('Michael Chen', 28, 'male', '1997-11-03', '789 Oak Dr, San Francisco, CA', '${formattedDate}')
      `);
      console.log('Added sample patients to PGlite database');
    }
    
    console.log('PGlite database schema initialized successfully');
    return pglite;
  } catch (error) {
    console.error('Failed to initialize PGlite database schema:', error);
    throw error;
  }
};

export const addPatientToPGlite = async (patient: Patient): Promise<void> => {
  try {
    const pglite = await initPGliteDatabase();
    
    const { name, age, gender, dateOfBirth, address } = patient;
    const createdAt = patient.createdAt || new Date().toISOString();
    
    await pglite.query(
      `INSERT INTO patients (name, age, gender, "dateOfBirth", address, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, age, gender, dateOfBirth, address, createdAt]
    );
    
    const event = new CustomEvent('medblock-db-updated', { 
      detail: { timestamp: Date.now() } 
    });
    window.dispatchEvent(event);
    
    console.log('Patient added to PGlite database successfully');
  } catch (error) {
    console.error('Failed to add patient to PGlite database:', error);
    throw error;
  }
};

export const executePGliteQuery = async (query: string, params: any[] = []): Promise<SQLQueryResult> => {
  try {
    const pglite = await initPGliteDatabase();
    
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.startsWith('drop') || 
        normalizedQuery.startsWith('truncate')) {
      throw new Error('Destructive operations are not allowed');
    }
    
    const isModifyingQuery = 
      normalizedQuery.startsWith('insert') || 
      normalizedQuery.startsWith('update') || 
      normalizedQuery.startsWith('delete');
    
    const result = await pglite.query(query, params);
    
    if (isModifyingQuery) {
      const event = new CustomEvent('medblock-db-updated', { 
        detail: { timestamp: Date.now() } 
      });
      window.dispatchEvent(event);
    }
    
    const formattedResult: SQLQueryResult = {
      columns: result.fields?.map(field => field.name) || [],
      rows: (result.rows as any[][]) || []
    };
    
    return formattedResult;
  } catch (error) {
    console.error('Failed to execute PGlite query:', error);
    throw error;
  }
};

/**
 * Get all patients from the PGlite database
 */
export const getAllPatientsFromPGlite = async (): Promise<Patient[]> => {
  try {
    const pglite = await initPGliteDatabase();
    
    const result = await pglite.query('SELECT * FROM patients');
    
    if (!result.rows || result.rows.length === 0) {
      return [];
    }
    
    return result.rows.map((row: any) => {
      return {
        id: row.id,
        name: row.name,
        age: row.age,
        gender: row.gender as 'male' | 'female' | 'other',
        dateOfBirth: row.dateOfBirth,
        address: row.address,
        createdAt: row.createdAt
      };
    });
  } catch (error) {
    console.error('Failed to get patients from PGlite database:', error);
    throw error;
  }
};
