import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Bell, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  Calendar,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Reminders = () => {
  const { triggerAlertsFetch } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Reminder form fields
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('Bills');

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/reminders');
      setReminders(res.data);
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!title || !amount || !dueDate) return;

    try {
      await axios.post('/reminders', {
        title,
        amount: parseFloat(amount),
        dueDate,
        category
      });

      // Clear
      setTitle('');
      setAmount('');
      setDueDate('');
      setCategory('Bills');

      fetchReminders();
      triggerAlertsFetch(); // Refresh alerts count in Navbar
    } catch (err) {
      console.error('Failed to create reminder:', err);
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      await axios.put(`/reminders/${id}`, { isPaid: true });
      fetchReminders();
      triggerAlertsFetch(); // Refresh alerts count in Navbar
    } catch (err) {
      console.error('Failed to mark reminder as paid:', err);
    }
  };

  const handleDeleteReminder = async (id) => {
    if (!window.confirm('Are you sure you want to remove this bill reminder?')) return;
    try {
      await axios.delete(`/reminders/${id}`);
      fetchReminders();
      triggerAlertsFetch();
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-glass-gradient glass-panel p-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Bell size={20} className="text-brand-secondary" /> Bill Reminders
          </h1>
          <p className="text-xs text-dark-muted mt-1">Schedule notification reminders for subscriptions, utilities, and invoices.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Reminder form */}
        <div className="glass-panel p-5 h-fit text-left">
          <h3 className="text-sm font-bold text-white mb-4">Add Bill Reminder</h3>
          <form onSubmit={handleCreateReminder} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-dark-muted font-medium">Bill Name</label>
              <input
                type="text"
                required
                placeholder="Netflix, House Rent, Electric Bill..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full glass-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-dark-muted font-medium">Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="999"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-dark-muted font-medium">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full glass-input"
                >
                  <option value="Bills">Bills</option>
                  <option value="Food">Food</option>
                  <option value="Travel">Travel</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Education">Education</option>
                  <option value="Health">Health</option>
                  <option value="Entertainment">Entertainment</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-dark-muted font-medium">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full glass-input"
              />
            </div>

            <button
              type="submit"
              className="w-full glass-btn-primary py-2.5 text-xs font-semibold mt-4"
            >
              <Plus size={16} />
              Add Reminder
            </button>
          </form>
        </div>

        {/* Reminders List Column */}
        <div className="lg:col-span-2 space-y-4 text-left">
          <h3 className="text-sm font-bold text-white mb-2">Pending Bills</h3>

          {loading ? (
            <div className="py-12 text-center text-xs text-dark-muted glass-panel">Loading reminders...</div>
          ) : reminders.length === 0 ? (
            <div className="py-12 text-center text-xs text-dark-muted glass-panel">
              All bills are paid! You have no pending notifications.
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((r) => {
                const isOverdue = r.dueDate < todayStr && !r.isPaid;
                
                return (
                  <div 
                    key={r._id || r.id} 
                    className={`glass-panel p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-panel-hover ${
                      r.isPaid 
                        ? 'opacity-60 bg-dark-cardMuted' 
                        : isOverdue 
                          ? 'border-brand-danger/35 bg-brand-danger/5' 
                          : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        r.isPaid 
                          ? 'bg-dark-border/20 border-dark-border text-dark-muted' 
                          : isOverdue 
                            ? 'bg-brand-danger/10 border-brand-danger/30 text-brand-danger animate-pulse' 
                            : 'bg-brand-primary/10 border-brand-primary/25 text-brand-secondary'
                      }`}>
                        {r.isPaid ? <Check size={18} /> : <AlertCircle size={18} />}
                      </div>

                      <div className="space-y-0.5 text-left">
                        <h4 className="font-bold text-sm text-white truncate">{r.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-dark-muted">
                          <span className="font-semibold">{r.category}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Calendar size={10} /> Due: {r.dueDate}
                          </span>
                          {isOverdue && (
                            <span className="text-brand-danger font-bold uppercase tracking-wider pl-1">Overdue</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <span className="text-sm font-extrabold text-white block">₹{r.amount.toLocaleString()}</span>
                        <span className="text-[9px] text-dark-muted">Payment amount</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {!r.isPaid && (
                          <button
                            onClick={() => handleMarkAsPaid(r._id || r.id)}
                            className="glass-btn-primary py-1.5 px-3 text-[10px] font-semibold"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReminder(r._id || r.id)}
                          className="p-2 rounded-lg hover:bg-white/5 text-dark-muted hover:text-brand-danger cursor-pointer transition-all border border-transparent hover:border-dark-border"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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

export default Reminders;
