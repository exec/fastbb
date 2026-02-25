/**
 * Database Migration Script
 * Creates all tables and indexes for the FastBB database
 */

const { initDatabase, closeDatabase, getDatabase } = require('../config/database');
const { SCHEMA } = require('./schema');

async function runMigrations() {
  console.log('Starting database migration...');

  try {
    await initDatabase();
    const db = getDatabase();

    // Split SQL statements (simple approach - handles basic cases)
    const statements = SCHEMA
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Executing ${statements.length} SQL statements...`);

    let successCount = 0;
    for (const statement of statements) {
      try {
        await new Promise((resolve, reject) => {
          db.run(statement, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        successCount++;
        console.log(`  ✓ ${statement.substring(0, 50)}...`);
      } catch (err) {
        console.error(`  ✗ Error executing: ${statement.substring(0, 50)}...`);
        console.error(`    ${err.message}`);
      }
    }

    console.log(`\nMigration complete: ${successCount}/${statements.length} statements executed successfully`);

    // Verify tables were created
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(r => r.name));
      });
    });

    console.log('\nCreated tables:');
    tables.forEach(table => console.log(`  - ${table}`));

    await closeDatabase();
    process.exit(0);

  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
