import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-sm text-gray-500">
          <p>
            MediDB - Patient Registration System with SQL.js Database
          </p>
          <p className="mt-1">
            © {new Date().getFullYear()} - Powered by React, TypeScript, and SQL.js
          </p>
          <p className="mt-2">
            <a 
              href="https://hemdesai.me" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 transition-colors"
            >
              /hem
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;