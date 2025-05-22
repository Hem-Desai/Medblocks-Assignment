import { addPatient } from '../db';
import { Patient } from '../types';

export const samplePatients: Patient[] = [
  {
    name: 'John Smith',
    age: 45,
    gender: 'male',
    dateOfBirth: '1980-05-15',
    address: '123 Main St, New York, NY',
  },
  {
    name: 'Sarah Johnson',
    age: 32,
    gender: 'female',
    dateOfBirth: '1993-08-21',
    address: '456 Park Ave, Boston, MA',
  },
  {
    name: 'Michael Chen',
    age: 28,
    gender: 'male',
    dateOfBirth: '1997-11-03',
    address: '789 Oak Dr, San Francisco, CA',
  }
];

export const addSamplePatients = async (): Promise<void> => {
  try {

    for (const patient of samplePatients) {
      await addPatient(patient);
    }
    console.log('Sample patients added successfully');
  } catch (error) {
    console.error('Failed to add sample patients:', error);
    throw error;
  }
};
