/**
 * Database Configuration and Connection Pool
 * Uses SQLite for fast, serverless, file-based storage
 */

const sqlite3 = require('sqlite3').verbose();

// Database file path
const DB_PATH = process.env.DB_PATH || './data/fastbb.db';

// Create the data directory if it doesn't exist
const fs = require('fs');
const path = require('path');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create a single database instance
let db = null;

/**
 * Initialize the database connection
 * This should be called once on application startup
 */
function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log(`Connected to SQLite database at ${DB_PATH}`);

      // Enable WAL mode for better concurrent read/write performance
      db.run('PRAGMA journal_mode = WAL');

      // Enable foreign key constraints
      db.run('PRAGMA foreign_keys = ON');

      // Set busy timeout
      db.run('PRAGMA busy_timeout = 5000');

      resolve(db);
    });
  });
}

/**
 * Get the database instance
 * Call initDatabase() first before using this
 */
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection
 */
function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
          db = null;
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

/**
 * Get a prepared statement
 * @param {string} sql - SQL query with placeholders
 */
function prepareStatement(sql) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db.prepare(sql);
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase,
  prepareStatement,
  DB_PATH
};
