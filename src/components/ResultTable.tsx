import React from 'react';
import { SQLQueryResult } from '../types';

function formatDateIfISO(value: any, columnName: string): string {
  if (typeof value === 'string' && 
      columnName.toLowerCase() === 'createdat' && 
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    try {
      const date = new Date(value);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (e) {
      return value;
    }
  }
  return String(value);
}

interface ResultTableProps {
  result: SQLQueryResult;
}

const ResultTable: React.FC<ResultTableProps> = ({ result }) => {
  const { columns, rows } = result;
  
  if (columns.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        Query executed successfully. No columns returned.
      </div>
    );
  }
  
  if (rows.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        Query executed successfully. No rows returned.
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs"
                  title={String(cell)}
                >
                  {cell === null ? (
                    <span className="text-gray-400 italic">NULL</span>
                  ) : (
                    formatDateIfISO(cell, columns[cellIndex])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultTable;