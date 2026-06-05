const mongoose = require('mongoose');

// 1. User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  googleId: { type: String },
  profilePic: { type: String },
  healthScore: { type: Number, default: 70 },
  createdAt: { type: Date, default: Date.now }
});

// 2. Transaction Schema
const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, enum: ['income', 'expense'] },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  description: { type: String },
  source: { type: String }, // For income (e.g. Salary, Freelance)
  isRecurring: { type: Boolean, default: false },
  recurringInterval: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
  nextOccurrence: { type: String } // YYYY-MM-DD
});

// 3. Budget Schema
const BudgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  limitAmount: { type: Number, required: true },
  month: { type: String, required: true }, // YYYY-MM
  alertsSent: { type: Number, default: 0 }
});
BudgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

// 4. Savings Goal Schema
const SavingsGoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  targetDate: { type: String, required: true }, // YYYY-MM-DD
  status: { type: String, default: 'In Progress', enum: ['In Progress', 'Achieved'] }
});

// 5. Bill Reminder Schema
const ReminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: String, required: true }, // YYYY-MM-DD
  category: { type: String, required: true },
  isPaid: { type: Boolean, default: false }
});

// 6. Investment Schema
const InvestmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assetType: { type: String, required: true, enum: ['Stock', 'Mutual Fund', 'SIP', 'FD', 'Gold'] },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  buyPrice: { type: Number, required: true },
  currentPrice: { type: Number, required: true },
  purchaseDate: { type: String, required: true } // YYYY-MM-DD
});

// 7. Loan Schema
const LoanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  remainingAmount: { type: Number, required: true },
  interestRate: { type: Number, required: true }, // Annual rate in %
  emi: { type: Number, required: true },
  tenureMonths: { type: Number, required: true },
  startDate: { type: String, required: true } // YYYY-MM-DD
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Transaction: mongoose.model('Transaction', TransactionSchema),
  Budget: mongoose.model('Budget', BudgetSchema),
  SavingsGoal: mongoose.model('SavingsGoal', SavingsGoalSchema),
  Reminder: mongoose.model('Reminder', ReminderSchema),
  Investment: mongoose.model('Investment', InvestmentSchema),
  Loan: mongoose.model('Loan', LoanSchema)
};
