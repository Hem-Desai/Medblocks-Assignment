import React from 'react';
import { Stethoscope } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Stethoscope className="h-8 w-8 text-blue-500" />
            <h1 className="ml-2 text-xl font-bold text-gray-900">MediDB</h1>
          </div>
          <div className="text-sm text-gray-500">
            Browser-based SQL.js Patient Database
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;