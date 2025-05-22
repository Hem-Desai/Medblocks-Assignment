import React, { useState, useRef } from 'react';
import { Database, Play, List } from 'lucide-react';
import ResultTable from './ResultTable';
import { useSQLQuery } from '../hooks/useSQLQuery';

interface SQLQueryEditorProps {
  onQueryExecuted: () => void;
}

const SQLQueryEditor: React.FC<SQLQueryEditorProps> = ({ onQueryExecuted }) => {
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isExecuting, error, result, executeSQL, clearResult } = useSQLQuery();
  
  const handleExecuteQuery = async () => {
    const success = await executeSQL(query);
    
    if (success) {
      onQueryExecuted();
    }
  };
  
  const handleShowAllPatients = () => {
    const showAllQuery = 'SELECT * FROM patients ORDER BY "createdAt" DESC';
    setQuery(showAllQuery);
    
    // Focus and resize the textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col h-full">
      <div className="flex items-center mb-4">
        <Database className="h-6 w-6 text-blue-500 mr-2" />
        <h2 className="text-xl font-semibold text-gray-800">SQL Query Interface</h2>
      </div>
      
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={handleShowAllPatients}
        >
          <List className="h-4 w-4 mr-1" />
          Show All Patients
        </button>
        
        <button
          type="button"
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          onClick={clearResult}
        >
          Clear Results
        </button>
      </div>
      
      <div className="flex flex-col flex-grow">
        <div className="mb-4">
          <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
            SQL Query
          </label>
          <textarea
            id="query"
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            placeholder="SELECT * FROM patients"
          />
        </div>
        
        <div className="mb-4">
          <button
            type="button"
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isExecuting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            onClick={handleExecuteQuery}
            disabled={isExecuting || !query.trim()}
          >
            <Play className="h-4 w-4 mr-1" />
            {isExecuting ? 'Executing...' : 'Execute Query'}
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <div className="flex-grow overflow-auto">
          {result && <ResultTable result={result} />}
        </div>
      </div>
    </div>
  );
};

export default SQLQueryEditor;