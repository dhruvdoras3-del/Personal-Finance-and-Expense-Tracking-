import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PieChart, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Calendar, 
  DollarSign,
  TrendingDown,
  Sparkles
} from 'lucide-react';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM

  // Set budget form
  const [category, setCategory] = useState('Food');
  const [limitAmount, setLimitAmount] = useState('');

  useEffect(() => {
    fetchBudgets();
  }, [activeMonth]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/budgets?month=${activeMonth}`);
      setBudgets(res.data);
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetBudget = async (e) => {
    e.preventDefault();
    if (!limitAmount || parseFloat(limitAmount) <= 0) return;

    try {
      await axios.post('/budgets', {
        category,
        limitAmount: parseFloat(limitAmount),
        month: activeMonth
      });
      setLimitAmount('');
      fetchBudgets();
    } catch (err) {
      console.error('Failed to set budget:', err);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!id) return; // For categories that are only virtual spending records without database ID
    if (!window.confirm('Are you sure you want to remove this budget limit?')) return;
    try {
      await axios.delete(`/budgets/${id}`);
      fetchBudgets();
    } catch (err) {
      console.error('Failed to delete budget:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-glass-gradient glass-panel p-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Category Budgets</h1>
          <p className="text-xs text-dark-muted mt-1">Set monthly limits by category to build savings and curb overspending.</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-dark-muted" />
          <input 
            type="month"
            value={activeMonth}
            onChange={(e) => setActiveMonth(e.target.value)}
            className="glass-input cursor-pointer py-1.5 focus:ring-0 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Budget Form Panel */}
        <div className="glass-panel p-5 h-fit text-left">
          <h3 className="text-sm font-bold text-white mb-4">Set Category Target</h3>
          <form onSubmit={handleSetBudget} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-dark-muted font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-dark-muted font-medium">Monthly Limit (₹)</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-xs font-semibold text-dark-muted">₹</span>
                <input
                  type="number"
                  required
                  placeholder="2000"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  className="w-full glass-input pl-8"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full glass-btn-primary py-2.5 text-xs font-semibold mt-4"
            >
              <Plus size={16} />
              Set Budget
            </button>
          </form>

          {/* Tips box */}
          <div className="mt-6 p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-xl space-y-2 text-xs">
            <h4 className="font-semibold text-white flex items-center gap-1.5">
              <Sparkles size={14} className="text-brand-secondary" /> Smart Budgeting Tip
            </h4>
            <p className="text-dark-muted leading-relaxed">
              Financial experts recommend the 50/30/20 rule: 50% for Needs (Bills, Health), 30% for Wants (Shopping, Food), and 20% for Savings (Goals).
            </p>
          </div>
        </div>

        {/* Budgets Progress List */}
        <div className="glass-panel p-5 lg:col-span-2 text-left space-y-4">
          <h3 className="text-sm font-bold text-white mb-2">Active Budget Limits</h3>

          {loading ? (
            <div className="py-12 text-center text-xs text-dark-muted">Loading budgets...</div>
          ) : budgets.length === 0 ? (
            <div className="py-12 text-center text-xs text-dark-muted">
              No budgets configured for this month. Use the left panel to set your first category budget!
            </div>
          ) : (
            <div className="space-y-6">
              {budgets.map((b) => {
                const isOver = b.spent > b.limitAmount && b.limitAmount > 0;
                const pct = b.limitAmount > 0 ? Math.min(100, Math.round((b.spent / b.limitAmount) * 100)) : 100;
                const color = isOver ? 'bg-brand-danger' : pct >= 80 ? 'bg-brand-warning' : 'bg-brand-primary';

                return (
                  <div key={b.category || Math.random()} className="space-y-2 pb-4 border-b border-dark-border/20 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-white">{b.category}</h4>
                        <p className="text-[10px] text-dark-muted mt-0.5">
                          {b.limitAmount > 0 ? (
                            `Utilized: ${pct}% of budget limit`
                          ) : (
                            <span className="text-brand-danger font-semibold">Unbudgeted Category Spending</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs font-semibold text-white">₹{b.spent.toLocaleString()}</span>
                          {b.limitAmount > 0 && (
                            <span className="text-[10px] text-dark-muted block">
                              Limit: ₹{b.limitAmount.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {b.id && (
                          <button
                            onClick={() => handleDeleteBudget(b.id)}
                            className="p-2 rounded-lg hover:bg-white/5 text-dark-muted hover:text-brand-danger cursor-pointer transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full h-2.5 rounded-full bg-dark-cardMuted border border-dark-border/40 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Bottom Status label */}
                    <div className="flex justify-between items-center text-[10px]">
                      {b.limitAmount > 0 ? (
                        isOver ? (
                          <span className="text-brand-danger font-semibold flex items-center gap-1">
                            <AlertTriangle size={12} /> Overspent by ₹{(b.spent - b.limitAmount).toLocaleString()}!
                          </span>
                        ) : (
                          <span className="text-brand-success font-semibold">
                            ₹{b.remaining.toLocaleString()} left to spend
                          </span>
                        )
                      ) : (
                        <span className="text-dark-muted">No budget set for this category. Log a target to track limits.</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Budgets;
