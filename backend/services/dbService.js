const db = require('../config/db');
let Schemas = null;

// Dynamically load schemas if mongo is active
function getSchemas() {
  if (!Schemas && db.getIsMongo()) {
    Schemas = require('../models/Schemas');
  }
  return Schemas;
}

// Promise wrappers for sqlite
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.getDb().run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.getDb().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.getDb().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// SQLite helper to dynamically build UPDATE query
async function updateSqlite(table, id, updates) {
  const keys = Object.keys(updates);
  if (keys.length === 0) return get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  const params = keys.map(k => {
    // Convert true/false to 1/0 for sqlite
    if (typeof updates[k] === 'boolean') return updates[k] ? 1 : 0;
    return updates[k];
  });
  params.push(id);
  const sql = `UPDATE ${table} SET ${keys.map(k => `[${k}] = ?`).join(', ')} WHERE id = ?`;
  await run(sql, params);
  const row = await get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  return normalizeRow(row);
}

// Convert SQLite numeric boolean flags to JS booleans, and guarantee string IDs
function normalizeRow(row) {
  if (!row) return null;
  const result = { ...row };
  if (result.id) result._id = result.id.toString();
  if (result.userId) result.userId = result.userId.toString();
  if (result.isRecurring !== undefined) result.isRecurring = !!result.isRecurring;
  if (result.isPaid !== undefined) result.isPaid = !!result.isPaid;
  return result;
}

function normalizeRows(rows) {
  if (!rows) return [];
  return rows.map(normalizeRow);
}

const dbService = {
  // ==========================================
  // USER METHODS
  // ==========================================
  async findUserByEmail(email) {
    if (db.getIsMongo()) {
      return getSchemas().User.findOne({ email: email.toLowerCase() });
    } else {
      const row = await get('SELECT * FROM users WHERE LOWER(email) = ?', [email.toLowerCase()]);
      return normalizeRow(row);
    }
  },

  async findUserById(id) {
    if (db.getIsMongo()) {
      return getSchemas().User.findById(id);
    } else {
      const row = await get('SELECT * FROM users WHERE id = ?', [id]);
      return normalizeRow(row);
    }
  },

  async createUser({ name, email, password, role, googleId, profilePic }) {
    if (db.getIsMongo()) {
      return getSchemas().User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: role || 'user',
        googleId,
        profilePic
      });
    } else {
      const res = await run(
        'INSERT INTO users (name, email, password, role, googleId, profilePic) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email.toLowerCase(), password, role || 'user', googleId || null, profilePic || null]
      );
      return { id: res.id, _id: res.id.toString(), name, email: email.toLowerCase(), role: role || 'user', googleId, profilePic, healthScore: 70 };
    }
  },

  async updateUser(id, updates) {
    if (db.getIsMongo()) {
      return getSchemas().User.findByIdAndUpdate(id, updates, { new: true });
    } else {
      return updateSqlite('users', id, updates);
    }
  },

  async deleteUser(id) {
    if (db.getIsMongo()) {
      return getSchemas().User.findByIdAndDelete(id);
    } else {
      await run('DELETE FROM users WHERE id = ?', [id]);
      return { id };
    }
  },

  async getAllUsers() {
    if (db.getIsMongo()) {
      return getSchemas().User.find({}).sort({ createdAt: -1 });
    } else {
      const rows = await all('SELECT * FROM users ORDER BY createdAt DESC');
      return normalizeRows(rows);
    }
  },

  async getPlatformMetrics() {
    if (db.getIsMongo()) {
      const schemas = getSchemas();
      const totalUsers = await schemas.User.countDocuments();
      const activeUsers = await schemas.User.countDocuments({ role: 'user' }); // Simplification
      const totalTransactions = await schemas.Transaction.countDocuments();
      const totalVolumeResult = await schemas.Transaction.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalVolume = totalVolumeResult.length ? totalVolumeResult[0].total : 0;
      return { totalUsers, activeUsers, totalTransactions, totalVolume };
    } else {
      const uCount = await get('SELECT COUNT(*) as count FROM users');
      const tCount = await get('SELECT COUNT(*) as count FROM transactions');
      const vSum = await get('SELECT SUM(amount) as sum FROM transactions');
      return {
        totalUsers: uCount.count,
        activeUsers: uCount.count, // Simplification
        totalTransactions: tCount.count,
        totalVolume: vSum.sum || 0
      };
    }
  },

  // ==========================================
  // TRANSACTION METHODS
  // ==========================================
  async createTransaction({ userId, type, category, amount, date, description, source, isRecurring, recurringInterval, nextOccurrence }) {
    if (db.getIsMongo()) {
      return getSchemas().Transaction.create({
        userId,
        type,
        category,
        amount,
        date,
        description,
        source,
        isRecurring: !!isRecurring,
        recurringInterval,
        nextOccurrence
      });
    } else {
      const res = await run(
        'INSERT INTO transactions (userId, type, category, amount, date, description, source, isRecurring, recurringInterval, nextOccurrence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, type, category, amount, date, description, source || null, isRecurring ? 1 : 0, recurringInterval || null, nextOccurrence || null]
      );
      return {
        id: res.id,
        _id: res.id.toString(),
        userId,
        type,
        category,
        amount,
        date,
        description,
        source,
        isRecurring: !!isRecurring,
        recurringInterval,
        nextOccurrence
      };
    }
  },

  async getTransactions(userId, filters = {}) {
    if (db.getIsMongo()) {
      const query = { userId };
      if (filters.category) query.category = filters.category;
      if (filters.type) query.type = filters.type;
      if (filters.startDate || filters.endDate) {
        query.date = {};
        if (filters.startDate) query.date.$gte = filters.startDate;
        if (filters.endDate) query.date.$lte = filters.endDate;
      }
      let q = getSchemas().Transaction.find(query);
      if (filters.search) {
        q = q.find({
          $or: [
            { description: { $regex: filters.search, $options: 'i' } },
            { category: { $regex: filters.search, $options: 'i' } }
          ]
        });
      }
      return q.sort({ date: -1, _id: -1 });
    } else {
      let query = 'SELECT * FROM transactions WHERE userId = ?';
      const params = [userId];

      if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }
      if (filters.type) {
        query += ' AND type = ?';
        params.push(filters.type);
      }
      if (filters.startDate) {
        query += ' AND date >= ?';
        params.push(filters.startDate);
      }
      if (filters.endDate) {
        query += ' AND date <= ?';
        params.push(filters.endDate);
      }
      if (filters.search) {
        query += ' AND (description LIKE ? OR category LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      query += ' ORDER BY date DESC, id DESC';
      const rows = await all(query, params);
      return normalizeRows(rows);
    }
  },

  async updateTransaction(id, userId, updates) {
    if (db.getIsMongo()) {
      return getSchemas().Transaction.findOneAndUpdate({ _id: id, userId }, updates, { new: true });
    } else {
      // Ensure the transaction belongs to the user
      const t = await get('SELECT * FROM transactions WHERE id = ? AND userId = ?', [id, userId]);
      if (!t) return null;
      return updateSqlite('transactions', id, updates);
    }
  },

  async deleteTransaction(id, userId) {
    if (db.getIsMongo()) {
      return getSchemas().Transaction.findOneAndDelete({ _id: id, userId });
    } else {
      const t = await get('SELECT * FROM transactions WHERE id = ? AND userId = ?', [id, userId]);
      if (!t) return null;
      await run('DELETE FROM transactions WHERE id = ?', [id]);
      return normalizeRow(t);
    }
  },

  async getRecurringTransactions() {
    if (db.getIsMongo()) {
      return getSchemas().Transaction.find({ isRecurring: true });
    } else {
      const rows = await all('SELECT * FROM transactions WHERE isRecurring = 1');
      return normalizeRows(rows);
    }
  },

  // ==========================================
  // BUDGET METHODS
  // ==========================================
  async getBudgets(userId, month) {
    if (db.getIsMongo()) {
      return getSchemas().Budget.find({ userId, month });
    } else {
      const rows = await all('SELECT * FROM budgets WHERE userId = ? AND month = ?', [userId, month]);
      return normalizeRows(rows);
    }
  },

  async setBudget(userId, category, limitAmount, month) {
    if (db.getIsMongo()) {
      return getSchemas().Budget.findOneAndUpdate(
        { userId, category, month },
        { limitAmount, alertsSent: 0 },
        { upsert: true, new: true }
      );
    } else {
      const existing = await get('SELECT * FROM budgets WHERE userId = ? AND category = ? AND month = ?', [userId, category, month]);
      if (existing) {
        await run('UPDATE budgets SET limitAmount = ?, alertsSent = 0 WHERE id = ?', [limitAmount, existing.id]);
        const row = await get('SELECT * FROM budgets WHERE id = ?', [existing.id]);
        return normalizeRow(row);
      } else {
        const res = await run(
          'INSERT INTO budgets (userId, category, limitAmount, month, alertsSent) VALUES (?, ?, ?, ?, 0)',
          [userId, category, limitAmount, month]
        );
        return { id: res.id, _id: res.id.toString(), userId, category, limitAmount, month, alertsSent: 0 };
      }
    }
  },

  async updateBudget(id, userId, updates) {
    if (db.getIsMongo()) {
      return getSchemas().Budget.findOneAndUpdate({ _id: id, userId }, updates, { new: true });
    } else {
      const b = await get('SELECT * FROM budgets WHERE id = ? AND userId = ?', [id, userId]);
      if (!b) return null;
      return updateSqlite('budgets', id, updates);
    }
  },

  async deleteBudget(id, userId) {
    if (db.getIsMongo()) {
      return getSchemas().Budget.findOneAndDelete({ _id: id, userId });
    } else {
      const b = await get('SELECT * FROM budgets WHERE id = ? AND userId = ?', [id, userId]);
      if (!b) return null;
      await run('DELETE FROM budgets WHERE id = ?', [id]);
      return normalizeRow(b);
    }
  },

  // ==========================================
  // SAVINGS GOAL METHODS
  // ==========================================
  async getGoals(userId) {
    if (db.getIsMongo()) {
      return getSchemas().SavingsGoal.find({ userId });
    } else {
      const rows = await all('SELECT * FROM savings_goals WHERE userId = ?', [userId]);
      return normalizeRows(rows);
    }
  },

  async createGoal(userId, { name, targetAmount, currentAmount, targetDate }) {
    if (db.getIsMongo()) {
      return getSchemas().SavingsGoal.create({
        userId,
        name,
        targetAmount,
        currentAmount: currentAmount || 0,
        targetDate,
        status: 'In Progress'
      });
    } else {
      const res = await run(
        'INSERT INTO savings_goals (userId, name, targetAmount, currentAmount, targetDate, status) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, name, targetAmount, currentAmount || 0, targetDate, 'In Progress']
      );
      return {
        id: res.id,
        _id: res.id.toString(),
        userId,
        name,
        targetAmount,
        currentAmount: currentAmount || 0,
        targetDate,
        status: 'In Progress'
      };
    }
  },

  async updateGoal(id, userId, updates) {
    if (db.getIsMongo()) {
      return getSchemas().SavingsGoal.findOneAndUpdate({ _id: id, userId }, updates, { new: true });
    } else {
      const g = await get('SELECT * FROM savings_goals WHERE id = ? AND userId = ?', [id, userId]);
      if (!g) return null;
      return updateSqlite('savings_goals', id, updates);
    }
  },

  async deleteGoal(id, userId) {
    if (db.getIsMongo()) {
      return getSchemas().SavingsGoal.findOneAndDelete({ _id: id, userId });
    } else {
      const g = await get('SELECT * FROM savings_goals WHERE id = ? AND userId = ?', [id, userId]);
      if (!g) return null;
      await run('DELETE FROM savings_goals WHERE id = ?', [id]);
      return normalizeRow(g);
    }
  },

  // ==========================================
  // REMINDER METHODS
  // ==========================================
  async getReminders(userId) {
    if (db.getIsMongo()) {
      return getSchemas().Reminder.find({ userId }).sort({ dueDate: 1 });
    } else {
      const rows = await all('SELECT * FROM reminders WHERE userId = ? ORDER BY dueDate ASC', [userId]);
      return normalizeRows(rows);
    }
  },

  async createReminder(userId, { title, amount, dueDate, category }) {
    if (db.getIsMongo()) {
      return getSchemas().Reminder.create({
        userId,
        title,
        amount,
        dueDate,
        category,
        isPaid: false
      });
    } else {
      const res = await run(
        'INSERT INTO reminders (userId, title, amount, dueDate, category, isPaid) VALUES (?, ?, ?, ?, ?, 0)',
        [userId, title, amount, dueDate, category]
      );
      return {
        id: res.id,
        _id: res.id.toString(),
        userId,
        title,
        amount,
        dueDate,
        category,
        isPaid: false
      };
    }
  },

  async updateReminder(id, userId, updates) {
    if (db.getIsMongo()) {
      return getSchemas().Reminder.findOneAndUpdate({ _id: id, userId }, updates, { new: true });
    } else {
      const r = await get('SELECT * FROM reminders WHERE id = ? AND userId = ?', [id, userId]);
      if (!r) return null;
      return updateSqlite('reminders', id, updates);
    }
  },

  async deleteReminder(id, userId) {
    if (db.getIsMongo()) {
      return getSchemas().Reminder.findOneAndDelete({ _id: id, userId });
    } else {
      const r = await get('SELECT * FROM reminders WHERE id = ? AND userId = ?', [id, userId]);
      if (!r) return null;
      await run('DELETE FROM reminders WHERE id = ?', [id]);
      return normalizeRow(r);
    }
  },

  // ==========================================
  // INVESTMENT METHODS
  // ==========================================
  async getInvestments(userId) {
    if (db.getIsMongo()) {
      return getSchemas().Investment.find({ userId });
    } else {
      const rows = await all('SELECT * FROM investments WHERE userId = ?', [userId]);
      return normalizeRows(rows);
    }
  },

  async createInvestment(userId, { assetType, name, quantity, buyPrice, currentPrice, purchaseDate }) {
    if (db.getIsMongo()) {
      return getSchemas().Investment.create({
        userId,
        assetType,
        name,
        quantity,
        buyPrice,
        currentPrice,
        purchaseDate
      });
    } else {
      const res = await run(
        'INSERT INTO investments (userId, assetType, name, quantity, buyPrice, currentPrice, purchaseDate) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, assetType, name, quantity, buyPrice, currentPrice, purchaseDate]
      );
      return {
        id: res.id,
        _id: res.id.toString(),
        userId,
        assetType,
        name,
        quantity,
        buyPrice,
        currentPrice,
        purchaseDate
      };
    }
  },

  async updateInvestment(id, userId, updates) {
    if (db.getIsMongo()) {
      return getSchemas().Investment.findOneAndUpdate({ _id: id, userId }, updates, { new: true });
    } else {
      const iv = await get('SELECT * FROM investments WHERE id = ? AND userId = ?', [id, userId]);
      if (!iv) return null;
      return updateSqlite('investments', id, updates);
    }
  },

  async deleteInvestment(id, userId) {
    if (db.getIsMongo()) {
      return getSchemas().Investment.findOneAndDelete({ _id: id, userId });
    } else {
      const iv = await get('SELECT * FROM investments WHERE id = ? AND userId = ?', [id, userId]);
      if (!iv) return null;
      await run('DELETE FROM investments WHERE id = ?', [id]);
      return normalizeRow(iv);
    }
  },

  // ==========================================
  // LOAN METHODS
  // ==========================================
  async getLoans(userId) {
    if (db.getIsMongo()) {
      return getSchemas().Loan.find({ userId });
    } else {
      const rows = await all('SELECT * FROM loans WHERE userId = ?', [userId]);
      return normalizeRows(rows);
    }
  },

  async createLoan(userId, { name, totalAmount, remainingAmount, interestRate, emi, tenureMonths, startDate }) {
    if (db.getIsMongo()) {
      return getSchemas().Loan.create({
        userId,
        name,
        totalAmount,
        remainingAmount,
        interestRate,
        emi,
        tenureMonths,
        startDate
      });
    } else {
      const res = await run(
        'INSERT INTO loans (userId, name, totalAmount, remainingAmount, interestRate, emi, tenureMonths, startDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, name, totalAmount, remainingAmount, interestRate, emi, tenureMonths, startDate]
      );
      return {
        id: res.id,
        _id: res.id.toString(),
        userId,
        name,
        totalAmount,
        remainingAmount,
        interestRate,
        emi,
        tenureMonths,
        startDate
      };
    }
  },

  async updateLoan(id, userId, updates) {
    if (db.getIsMongo()) {
      return getSchemas().Loan.findOneAndUpdate({ _id: id, userId }, updates, { new: true });
    } else {
      const ln = await get('SELECT * FROM loans WHERE id = ? AND userId = ?', [id, userId]);
      if (!ln) return null;
      return updateSqlite('loans', id, updates);
    }
  },

  async deleteLoan(id, userId) {
    if (db.getIsMongo()) {
      return getSchemas().Loan.findOneAndDelete({ _id: id, userId });
    } else {
      const ln = await get('SELECT * FROM loans WHERE id = ? AND userId = ?', [id, userId]);
      if (!ln) return null;
      await run('DELETE FROM loans WHERE id = ?', [id]);
      return normalizeRow(ln);
    }
  }
};

module.exports = dbService;
