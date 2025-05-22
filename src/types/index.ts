export interface Patient {
  id?: number;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  address: string;
  createdAt?: string;
}

export interface SQLQueryResult {
  columns: string[];
  rows: any[][];
}

export interface DatabaseState {
  isInitialized: boolean;
  lastUpdate: number;
}

export interface BroadcastMessage {
  type: 'PATIENT_ADDED' | 'SQL_EXECUTED';
  timestamp: number;
}