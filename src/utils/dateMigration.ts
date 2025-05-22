import { getPGliteConnection } from '../db/pglite-init';

export function formatISODate(isoString: string): string {
  try {
    const date = new Date(isoString);
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
    return isoString;
  }
}

export async function migrateExistingDates(): Promise<void> {
  try {
    console.log('Starting date format migration...');
    const pglite = await getPGliteConnection();
    
    const result = await pglite.query(`
      SELECT id, "createdAt" 
      FROM patients 
      WHERE "createdAt" LIKE '%T%:%Z' OR "createdAt" LIKE '%T%:%.'
    `);
    
    if (!result.rows || result.rows.length === 0) {
      console.log('No dates to migrate');
      return;
    }
    
    console.log(`Found ${result.rows.length} records to migrate`);
    
    for (const row of result.rows) {
      const id = (row as unknown[])[0];
      const isoDate = (row as unknown[])[1] as string;
      
      if (isoDate && typeof isoDate === 'string' && isoDate.includes('T')) {
        const formattedDate = formatISODate(isoDate);
        
        await pglite.query(
          `UPDATE patients SET "createdAt" = $1 WHERE id = $2`,
          [formattedDate, id]
        );
        
        console.log(`Migrated date for patient ID ${id}: ${isoDate} -> ${formattedDate}`);
      }
    }
    
    console.log('Date migration completed successfully');
  } catch (error) {
    console.error('Failed to migrate dates:', error);
  }
}
