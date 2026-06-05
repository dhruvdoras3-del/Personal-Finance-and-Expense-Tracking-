import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Percent, 
  Plus, 
  Wallet, 
  Calendar,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalIncome: 0,
    totalExpense: 0,
    savings: 0,
    categoryTotals: {},
    monthlyTrends: [],
    recentTransactions: []
  });
  const [activeMonth, setActiveMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [budgets, setBudgets] = useState([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Quick transaction form fields
  const [txType, setTxType] = useState('expense');
  const [txCategory, setTxCategory] = useState('Food');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txDesc, setTxDesc] = useState('');
  const [txSource, setTxSource] = useState('Salary');

  useEffect(() => {
    fetchDashboardData();
    fetchBudgets();
  }, [activeMonth]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/transactions/summary?month=${activeMonth}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgets = async () => {
    try {
      const res = await axios.get(`/budgets?month=${activeMonth}`);
      setBudgets(res.data);
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!txAmount || parseFloat(txAmount) <= 0) return;

    try {
      await axios.post('/transactions', {
        type: txType,
        category: txType === 'income' ? 'Income' : txCategory,
        amount: parseFloat(txAmount),
        date: txDate,
        description: txDesc,
        source: txType === 'income' ? txSource : null
      });

      // Reset
      setTxAmount('');
      setTxDesc('');
      setShowQuickAdd(false);

      // Refresh
      fetchDashboardData();
      fetchBudgets();
    } catch (err) {
      console.error('Failed to add quick transaction:', err);
    }
  };

  // Chart configuration
  const COLORS = ['#4F46E5', '#06B6D4', '#D946EF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  
  const pieData = Object.keys(data.categoryTotals).map((cat) => ({
    name: cat,
    value: data.categoryTotals[cat]
  }));

  const totalBalance = data.totalIncome - data.totalExpense;
  const savingsRate = data.totalIncome > 0 ? Math.round((data.savings / data.totalIncome) * 100) : 0;

  // Custom tooltips
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-bg/95 border border-dark-border p-3 rounded-xl backdrop-blur-md">
          <p className="text-xs font-semibold text-dark-muted mb-1">{payload[0].payload.month}</p>
          {payload.map((p, idx) => (
            <p key={idx} className="text-sm font-bold" style={{ color: p.color }}>
              {p.name}: ₹{p.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-glass-gradient glass-panel p-6 glass-panel-hover">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Hello, {user?.name}!</h1>
          <p className="text-sm text-dark-muted mt-1">Here is your financial profile for this month.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="month"
            value={activeMonth}
            onChange={(e) => setActiveMonth(e.target.value)}
            className="glass-input cursor-pointer py-2 focus:ring-0"
          />
          <button 
            onClick={() => setShowQuickAdd(true)}
            className="glass-btn-primary py-2 px-4 text-xs font-semibold"
          >
            <Plus size={16} />
            <span>Quick Log</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="glass-panel p-5 glass-panel-hover flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-dark-muted uppercase tracking-wider">Total Net Income</span>
            <h3 className={`text-2xl font-extrabold tracking-tight ${totalBalance >= 0 ? 'text-white' : 'text-brand-danger'}`}>
              ₹{totalBalance.toLocaleString()}
            </h3>
            <p className="text-[10px] text-dark-muted">Active month cache</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-secondary shadow-lg">
            <Wallet size={20} />
          </div>
        </div>

        {/* Monthly Income */}
        <div className="glass-panel p-5 glass-panel-hover flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-dark-muted uppercase tracking-wider">Total Income</span>
            <h3 className="text-2xl font-extrabold text-brand-success tracking-tight">
              +₹{data.totalIncome.toLocaleString()}
            </h3>
            <p className="text-[10px] text-brand-success/80 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> Active monthly flow
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-success/10 border border-brand-success/20 flex items-center justify-center text-brand-success shadow-lg">
            <ArrowUpRight size={20} />
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="glass-panel p-5 glass-panel-hover flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-dark-muted uppercase tracking-wider">Total Expenses</span>
            <h3 className="text-2xl font-extrabold text-brand-danger tracking-tight">
              -₹{data.totalExpense.toLocaleString()}
            </h3>
            <p className="text-[10px] text-brand-danger/80 flex items-center gap-0.5">
              <ArrowDownRight size={10} /> Debited from balance
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-danger/10 border border-brand-danger/20 flex items-center justify-center text-brand-danger shadow-lg">
            <ArrowDownRight size={20} />
          </div>
        </div>

        {/* Savings Rate */}
        <div className="glass-panel p-5 glass-panel-hover flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-dark-muted uppercase tracking-wider">Savings Rate</span>
            <h3 className="text-2xl font-extrabold text-brand-secondary tracking-tight">
              {savingsRate}%
            </h3>
            <p className="text-[10px] text-dark-muted">Goal target is &gt; 15%</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 border border-brand-secondary/20 flex items-center justify-center text-brand-secondary shadow-lg">
            <Percent size={20} />
          </div>
        </div>
      </div>

      {/* Quick Add Overlay Drawer */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4">Log Quick Transaction</h3>
            <form onSubmit={handleQuickAdd} className="space-y-4 text-left">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    txType === 'expense' ? 'bg-brand-danger/20 border-brand-danger/55 text-brand-danger' : 'border-dark-border text-dark-muted'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    txType === 'income' ? 'bg-brand-success/20 border-brand-success/55 text-brand-success' : 'border-dark-border text-dark-muted'
                  }`}
                >
                  Income
                </button>
              </div>

              {txType === 'expense' ? (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-dark-muted font-medium">Category</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full glass-input"
                  >
                    <option value="Food">Food</option>
                    <option value="Travel">Travel</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Education">Education</option>
                    <option value="Health">Health</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Bills">Bills</option>
                  </select>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-dark-muted font-medium">Income Source</label>
                  <select
                    value={txSource}
                    onChange={(e) => setTxSource(e.target.value)}
                    className="w-full glass-input"
                  >
                    <option value="Salary">Salary</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Investments">Investments</option>
                    <option value="Gifts">Gifts</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs text-dark-muted font-medium">Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-dark-muted font-medium">Date</label>
                <input
                  type="date"
                  required
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-dark-muted font-medium">Description</label>
                <input
                  type="text"
                  placeholder="Optional details..."
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="flex-1 glass-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 glass-btn-primary text-xs"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Analytical Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (Income vs Expense) */}
        <div className="glass-panel p-5 lg:col-span-2 flex flex-col h-96">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Cash Flow Trends</h3>
              <p className="text-[10px] text-dark-muted">Historical income vs spending</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold text-dark-muted">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-brand-primary inline-block" /> Income</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-brand-secondary inline-block" /> Expenses</span>
            </div>
          </div>
          <div className="flex-1 min-h-0 w-full">
            {data.monthlyTrends.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-dark-muted">
                <TrendingUp size={24} className="mb-2 text-dark-border" />
                No historical cash flow data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyTrends} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <YAxis tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" name="Income" dataKey="income" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" name="Expenses" dataKey="expenses" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expenses Category Pie Chart */}
        <div className="glass-panel p-5 flex flex-col h-96">
          <div>
            <h3 className="text-sm font-semibold text-white">Expense Share</h3>
            <p className="text-[10px] text-dark-muted">Spending distribution by category</p>
          </div>
          <div className="flex-1 min-h-0 w-full relative flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-xs text-dark-muted flex flex-col items-center">
                <Percent size={24} className="mb-2 text-dark-border" />
                No expense entries logged for this month.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val) => [`₹${val.toLocaleString()}`, 'Spent']}
                    contentStyle={{ backgroundColor: 'rgba(9, 13, 26, 0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: '10px', color: '#94A3B8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Budgets & Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budgets Alert Card list */}
        <div className="glass-panel p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Monthly Budgets</h3>
              <p className="text-[10px] text-dark-muted">Current allocation tracking</p>
            </div>
            <Link to="/budgets" className="text-[10px] font-semibold text-brand-secondary hover:underline flex items-center gap-0.5 cursor-pointer">
              Manage <ArrowRight size={10} />
            </Link>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto">
            {budgets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10 text-xs text-dark-muted">
                No active category budgets set.
              </div>
            ) : (
              budgets.map((b) => {
                const pct = b.limitAmount > 0 ? Math.min(100, Math.round((b.spent / b.limitAmount) * 100)) : 100;
                
                return (
                  <div key={b.category} className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-white">{b.category}</span>
                      <span className="text-dark-muted">
                        ₹{b.spent.toLocaleString()} / <span className="font-medium text-white">₹{b.limitAmount.toLocaleString()}</span>
                      </span>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="w-full h-2 rounded-full bg-dark-cardMuted border border-dark-border/40 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 100 ? 'bg-brand-danger' : pct >= 80 ? 'bg-brand-warning' : 'bg-brand-primary'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {/* Warnings */}
                    {pct >= 100 && (
                      <span className="text-[9px] font-semibold text-brand-danger flex items-center gap-1">
                        <AlertTriangle size={10} /> Budget Limit Exceeded!
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="glass-panel p-5 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
              <p className="text-[10px] text-dark-muted">Latest financial entries logged</p>
            </div>
            <Link to="/transactions" className="text-[10px] font-semibold text-brand-secondary hover:underline flex items-center gap-0.5 cursor-pointer">
              View History <ArrowRight size={10} />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {data.recentTransactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10 text-xs text-dark-muted">
                No transactions recorded yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-dark-text min-w-[500px]">
                <thead>
                  <tr className="border-b border-dark-border/40 text-dark-muted font-semibold">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5">Category / Source</th>
                    <th className="py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.map((tx) => (
                    <tr key={tx._id || tx.id} className="border-b border-dark-border/10 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="py-3 text-dark-muted">{tx.date}</td>
                      <td className="py-3 font-semibold text-white">
                        {tx.description || (tx.type === 'income' ? 'Income Deposit' : 'Expense Payment')}
                        {tx.isRecurring && (
                          <span className="ml-2 text-[9px] bg-brand-primary/10 border border-brand-primary/30 text-brand-secondary px-1.5 py-0.5 rounded font-medium">
                            Recurring
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          tx.type === 'income' 
                            ? 'bg-brand-success/10 border-brand-success/30 text-brand-success' 
                            : 'bg-brand-primary/10 border-brand-primary/30 text-brand-secondary'
                        }`}>
                          {tx.type === 'income' ? tx.source || 'Salary' : tx.category}
                        </span>
                      </td>
                      <td className={`py-3 text-right font-bold text-sm ${
                        tx.type === 'income' ? 'text-brand-success' : 'text-white'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
