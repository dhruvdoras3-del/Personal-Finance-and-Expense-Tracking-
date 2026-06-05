import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Target, 
  Plus, 
  Trash2, 
  Gift, 
  Calendar,
  Sparkles,
  Award
} from 'lucide-react';

const SavingsGoals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // New goal form fields
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  // Contribution field values map
  const [contributions, setContributions] = useState({});

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/goals');
      setGoals(res.data);
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount || !targetDate) return;

    try {
      await axios.post('/goals', {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        targetDate
      });

      // Clear
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setTargetDate('');
      
      fetchGoals();
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };

  const handleContribute = async (e, id) => {
    e.preventDefault();
    const amt = contributions[id];
    if (!amt || parseFloat(amt) <= 0) return;

    try {
      await axios.post(`/goals/${id}/contribute`, { amount: parseFloat(amt) });
      
      // Clear contribution input
      setContributions(prev => ({ ...prev, [id]: '' }));
      fetchGoals();
    } catch (err) {
      console.error('Failed to contribute to goal:', err);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this savings goal?')) return;
    try {
      await axios.delete(`/goals/${id}`);
      fetchGoals();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-glass-gradient glass-panel p-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Savings Goals</h1>
          <p className="text-xs text-dark-muted mt-1">Define and fund targets like emergency reserves, travel budgets, or big purchases.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Goal Form */}
        <div className="glass-panel p-5 h-fit text-left">
          <h3 className="text-sm font-bold text-white mb-4">Set Savings Target</h3>
          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-dark-muted font-medium">Goal Name</label>
              <input
                type="text"
                required
                placeholder="Buy New Laptop, Emergency Fund..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full glass-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-dark-muted font-medium">Target Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="50000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-dark-muted font-medium">Initial Save (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="w-full glass-input"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-dark-muted font-medium">Target Date</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full glass-input"
              />
            </div>

            <button
              type="submit"
              className="w-full glass-btn-primary py-2.5 text-xs font-semibold mt-4"
            >
              <Plus size={16} />
              Add Savings Goal
            </button>
          </form>
        </div>

        {/* Goals Grid List */}
        <div className="lg:col-span-2 space-y-4 text-left">
          <h3 className="text-sm font-bold text-white mb-2">My Savings Targets</h3>

          {loading ? (
            <div className="py-12 text-center text-xs text-dark-muted glass-panel">Loading savings goals...</div>
          ) : goals.length === 0 ? (
            <div className="py-12 text-center text-xs text-dark-muted glass-panel">
              No savings goals configured yet. Set a savings target on the left panel!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {goals.map((g) => {
                const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 100;
                
                // Calculate time indicators
                const today = new Date();
                const target = new Date(g.targetDate);
                const diffTime = target - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const diffMonths = Math.ceil(diffDays / 30);
                
                return (
                  <div key={g._id || g.id} className="glass-panel p-5 flex flex-col justify-between glass-panel-hover">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="w-9 h-9 rounded-xl bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-secondary">
                          {g.status === 'Achieved' ? <Award size={16} /> : <Target size={16} />}
                        </div>
                        <button
                          onClick={() => handleDeleteGoal(g._id || g.id)}
                          className="p-1 rounded-lg hover:bg-white/5 text-dark-muted hover:text-brand-danger cursor-pointer transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-white truncate">{g.name}</h4>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
                          g.status === 'Achieved' 
                            ? 'bg-brand-success/15 border border-brand-success/35 text-brand-success' 
                            : 'bg-brand-primary/10 border border-brand-primary/25 text-brand-secondary'
                        }`}>
                          {g.status}
                        </span>
                      </div>

                      {/* Amounts */}
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-dark-muted">Saved</span>
                        <div className="text-right">
                          <span className="text-base font-extrabold text-white">₹{g.currentAmount.toLocaleString()}</span>
                          <span className="text-[10px] text-dark-muted"> / ₹{g.targetAmount.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full h-2 rounded-full bg-dark-cardMuted border border-dark-border/40 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              g.status === 'Achieved' ? 'bg-brand-success' : 'bg-brand-primary'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-dark-muted font-medium">
                          <span>{pct}% Completed</span>
                          {g.status !== 'Achieved' && (
                            <span>{diffDays > 0 ? `${diffMonths} months remaining` : 'Target date passed'}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contribute Input Block */}
                    {g.status !== 'Achieved' && (
                      <form 
                        onSubmit={(e) => handleContribute(e, g._id || g.id)} 
                        className="mt-4 pt-4 border-t border-dark-border/30 flex gap-2"
                      >
                        <input
                          type="number"
                          placeholder="Amount (₹)"
                          required
                          value={contributions[g._id || g.id] || ''}
                          onChange={(e) => setContributions({ ...contributions, [g._id || g.id]: e.target.value })}
                          className="flex-1 glass-input py-1 px-3 bg-dark-bg text-xs"
                        />
                        <button 
                          type="submit" 
                          className="glass-btn-primary py-1 px-3 text-xs"
                        >
                          Save
                        </button>
                      </form>
                    )}
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

export default SavingsGoals;
