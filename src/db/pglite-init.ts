import { PGlite } from '@electric-sql/pglite';
import { openDB } from 'idb';


const DB_NAME = 'medblock_sqljs_storage';
const DB_VERSION = 1;
const STORE_NAME = 'sqljs_data';
const DB_KEY = 'database_binary';


async function saveToIndexedDB(sqlDb: any): Promise<void> {
  try {
    const data = sqlDb.export();
    
    const idb = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
    
    await idb.put(STORE_NAME, data, DB_KEY);
    
    const event = new CustomEvent('medblock-db-updated', { 
      detail: { timestamp: Date.now() } 
    });
    window.dispatchEvent(event);
    
    console.log('Database saved to IndexedDB');
  } catch (error) {
    console.error('Failed to save database to IndexedDB:', error);
  }
}

let pglitePromise: Promise<PGlite> | null = null;
let pgliteInstance: PGlite | null = null;

export function initPGlite(): Promise<PGlite> {
  if (pglitePromise) return pglitePromise;
  
  pglitePromise = (async () => {
    try {
      if (pgliteInstance) return pgliteInstance;
      
      const initSqlJs = (await import('sql.js')).default;
      
      const SQL = await initSqlJs({
        locateFile: (file) => {
          if (import.meta.env.DEV) {
            return `/node_modules/sql.js/dist/${file}`;
          }
          return `/assets/wasm/${file}`;
        }
      });
      
      let sqlDb;
      try {
        const idb = await openDB(DB_NAME, DB_VERSION, {
          upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME);
            }
          },
        });
        
        const data = await idb.get(STORE_NAME, DB_KEY) as Uint8Array | undefined;
        
        if (data) {
          console.log('Loading database from IndexedDB');
          sqlDb = new SQL.Database(data);
        } else {
          console.log('Creating new database');
          sqlDb = new SQL.Database();
        }
      } catch (error) {
        console.error('Error loading database from IndexedDB:', error);
        sqlDb = new SQL.Database();
      }
      
      pgliteInstance = {
        ready: true,
        query: async (sql: string, params: any[] = []) => {
          try {
            let processedSql = sql;
            if (params && params.length > 0) {
              params.forEach((param, index) => {
                const placeholder = `$${index + 1}`;
                processedSql = processedSql.replace(placeholder, 
                  typeof param === 'string' ? `'${param}'` : String(param));
              });
            }
            
            const result = sqlDb.exec(processedSql);
            
            const normalizedSql = sql.trim().toLowerCase();
            if (
              normalizedSql.startsWith('insert') || 
              normalizedSql.startsWith('update') || 
              normalizedSql.startsWith('delete')
            ) {
              await saveToIndexedDB(sqlDb);
            }
            
            return {
              fields: result[0]?.columns.map(name => ({ name })) || [],
              rows: result[0]?.values || []
            };
          } catch (error) {
            console.error('SQL query error:', error);
            throw error;
          }
        },
        exec: async (sql: string) => {
          try {
            sqlDb.run(sql);
            
            await saveToIndexedDB(sqlDb);
            
            return { rowCount: 0 };
          } catch (error) {
            console.error('SQL exec error:', error);
            throw error;
          }
        }
      } as unknown as PGlite;
      
      await new Promise<void>((resolve) => {
        const checkReady = () => {
          if (pgliteInstance?.ready) {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
      
      console.log('PGlite initialized successfully');
      return pgliteInstance;
    } catch (err) {
      console.error('Failed to initialize PGlite:', err);
      pglitePromise = null;
      pgliteInstance = null;
      throw err;
    }
  })();
  
  return pglitePromise;
}


export async function getPGliteConnection(): Promise<PGlite> {
  return initPGlite();
}
