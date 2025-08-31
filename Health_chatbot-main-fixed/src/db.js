import sqlite3 from 'sqlite3';
import { promisify } from 'util';

let db;

export async function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database('./healthcare.db', (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      
      console.log('📊 Connected to SQLite database');
      
      // Create tables
      db.serialize(() => {
        // Symptom queries table
        db.run(`
          CREATE TABLE IF NOT EXISTS symptom_queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_lang TEXT NOT NULL,
            original_text TEXT NOT NULL,
            english_text TEXT,
            classification TEXT,
            advice TEXT,
            confidence REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Awareness alerts table
        db.run(`
          CREATE TABLE IF NOT EXISTS awareness_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event TEXT NOT NULL,
            messages TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        console.log('✅ Database tables initialized');
        resolve();
      });
    });
  });
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Promisified database methods
export const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};