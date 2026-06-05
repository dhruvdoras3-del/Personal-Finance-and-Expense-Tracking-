const path = require('path');
const fs = require('fs');

let mongoose = null;
let sqlite3 = null;
let sqliteDb = null;
let isMongo = false;

// Load env variables
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const SQLITE_PATH = process.env.SQLITE_PATH || path.join(__dirname, '..', 'database.db');

async function initDB() {
  if (MONGODB_URI) {
    try {
      mongoose = require('mongoose');
      await mongoose.connect(MONGODB_URI);
      console.log('Successfully connected to MongoDB Atlas.');
      isMongo = true;
      return { isMongo: true, connection: mongoose.connection };
    } catch (err) {
      console.error('Failed to connect to MongoDB. Falling back to local SQLite DB...', err.message);
    }
  }

  // Fallback to SQLite
  try {
    sqlite3 = require('sqlite3').verbose();
    sqliteDb = new sqlite3.Database(SQLITE_PATH);
    console.log(`Connected to local SQLite database at: ${SQLITE_PATH}`);

    // Create tables synchronously-like
    await initializeSqliteTables();
    isMongo = false;
    return { isMongo: false, connection: sqliteDb };
  } catch (err) {
    console.error('Failed to initialize local SQLite database:', err);
    throw err;
  }
}

function initializeSqliteTables() {
  return new Promise((resolve, reject) => {
    sqliteDb.serialize(() => {
      // 1. Users Table
      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          googleId TEXT,
          profilePic TEXT,
          healthScore INTEGER DEFAULT 70,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 2. Transactions Table
      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          type TEXT NOT NULL, -- 'income' or 'expense'
          category TEXT NOT NULL,
          amount REAL NOT NULL,
          date TEXT NOT NULL, -- YYYY-MM-DD
          description TEXT,
          source TEXT, -- for income
          isRecurring INTEGER DEFAULT 0, -- 0 = false, 1 = true
          recurringInterval TEXT, -- 'daily', 'weekly', 'monthly', 'yearly'
          nextOccurrence TEXT,
          FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // 3. Budgets Table
      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS budgets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          category TEXT NOT NULL,
          limitAmount REAL NOT NULL,
          month TEXT NOT NULL, -- YYYY-MM
          alertsSent INTEGER DEFAULT 0,
          UNIQUE(userId, category, month),
          FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // 4. Savings Goals Table
      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS savings_goals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          name TEXT NOT NULL,
          targetAmount REAL NOT NULL,
          currentAmount REAL DEFAULT 0,
          targetDate TEXT NOT NULL, -- YYYY-MM-DD
          status TEXT DEFAULT 'In Progress', -- 'In Progress', 'Achieved'
          FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // 5. Bill Reminders Table
      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS reminders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          title TEXT NOT NULL,
          amount REAL NOT NULL,
          dueDate TEXT NOT NULL, -- YYYY-MM-DD
          category TEXT NOT NULL,
          isPaid INTEGER DEFAULT 0, -- 0 = unpaid, 1 = paid
          FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // 6. Investments Table
      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS investments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          assetType TEXT NOT NULL, -- 'Stock', 'Mutual Fund', 'SIP', 'FD', 'Gold'
          name TEXT NOT NULL,
          quantity REAL NOT NULL,
          buyPrice REAL NOT NULL,
          currentPrice REAL NOT NULL,
          purchaseDate TEXT NOT NULL,
          FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // 7. Loans Table
      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS loans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          name TEXT NOT NULL,
          totalAmount REAL NOT NULL,
          remainingAmount REAL NOT NULL,
          interestRate REAL NOT NULL, -- annual percentage
          emi REAL NOT NULL,
          tenureMonths INTEGER NOT NULL,
          startDate TEXT NOT NULL, -- YYYY-MM-DD
          FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

function getDb() {
  if (isMongo) {
    return mongoose;
  }
  return sqliteDb;
}

module.exports = {
  initDB,
  getDb,
  getIsMongo: () => isMongo
};
