import initSqlJs from 'sql.js';

let sqlPromise: Promise<any> | null = null;

export function initSqlJsWithConfig() {
  if (sqlPromise) return sqlPromise;
  
  sqlPromise = initSqlJs({
    locateFile: (file) => {
      if (import.meta.env.DEV) {
        return `/node_modules/sql.js/dist/${file}`;
      }
      return `/assets/wasm/${file}`;
    }
  }).catch(err => {
    console.error('Failed to initialize SQL.js:', err);
    sqlPromise = null;
    throw err;
  });
  
  return sqlPromise;
}
