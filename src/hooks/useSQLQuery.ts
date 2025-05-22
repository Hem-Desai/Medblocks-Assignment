import { useState, useCallback } from 'react';
import { executeQuery } from '../db';
import { initPGliteDatabase } from '../db/pglite-db';
import { SQLQueryResult } from '../types';

export const useSQLQuery = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SQLQueryResult | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  

  useCallback(async () => {
    if (!isInitialized) {
      try {
        await initPGliteDatabase();
        setIsInitialized(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Failed to initialize PGlite: ${errorMessage}`);
        console.error('PGlite Initialization Error:', errorMessage);
      }
    }
  }, [isInitialized])();
  
  const executeSQL = useCallback(async (query: string): Promise<boolean> => {
    if (!query.trim()) {
      setError('Query cannot be empty');
      return false;
    }
    
    if (!isInitialized) {
      try {
        await initPGliteDatabase();
        setIsInitialized(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Failed to initialize PGlite: ${errorMessage}`);
        console.error('PGlite Initialization Error:', errorMessage);
        return false;
      }
    }
    
    setIsExecuting(true);
    setError(null);
    
    try {
      const queryResult = await executeQuery(query);
      
      const formattedResult: SQLQueryResult = {
        columns: queryResult.length > 0 ? queryResult[0].columns : [],
        rows: queryResult.length > 0 ? queryResult[0].rows : [],
      };
      
      setQueryHistory((prev: string[]) => {
        const newHistory = [query, ...prev];
        return newHistory.slice(0, 10);
      });
      
      setResult(formattedResult);
      setIsExecuting(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('SQL Query Error:', errorMessage);
      setIsExecuting(false);
      return false;
    }
  }, [isInitialized]);
  
  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);
  
  const getPreviousQuery = useCallback((index: number): string => {
    return queryHistory[index] || '';
  }, [queryHistory]);
  
  return {
    isExecuting,
    error,
    result,
    queryHistory,
    executeSQL,
    clearResult,
    getPreviousQuery,
  };
};