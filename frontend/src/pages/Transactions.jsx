import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Calendar,
  Check
} from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Add/Edit transaction states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formType, setFormType] = useState('expense');
  const [formCategory, setFormCategory] = useState('Food');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDesc, setFormDesc] = useState('');
  const [formSource, setFormSource] = useState('Salary');
  
  // Recurrence states
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [formInterval, setFormInterval] = useState('monthly');

  useEffect(() => {
    fetchTransactions();
  }, [type, category, startDate, endDate]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let query = `?search=${search}`;
      if (type) query += `&type=${type}`;
      if (category) query += `&category=${category}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;

      const res = await axios.get(`/transactions${query}`);
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormType('expense');
    setFormCategory('Food');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDesc('');
    setFormSource('Salary');
    setFormIsRecurring(false);
    setShowModal(true);
  };

  const handleOpenEdit = (tx) => {
    setIsEditing(true);
    setEditingId(tx._id || tx.id);
    setFormType(tx.type);
    setFormCategory(tx.category);
    setFormAmount(tx.amount.toString());
    setFormDate(tx.date);
    setFormDesc(tx.description || '');
    setFormSource(tx.source || 'Salary');
    setFormIsRecurring(tx.isRecurring || false);
    setFormInterval(tx.recurringInterval || 'monthly');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formAmount || parseFloat(formAmount) <= 0) return;

    const payload = {
      type: formType,
      category: formType === 'income' ? 'Income' : formCategory,
      amount: parseFloat(formAmount),
      date: formDate,
      description: formDesc,
      source: formType === 'income' ? formSource : null,
      isRecurring: formIsRecurring,
      recurringInterval: formIsRecurring ? formInterval : null
    };

    try {
      if (isEditing) {
        await axios.put(`/transactions/${editingId}`, payload);
      } else {
        await axios.post('/transactions', payload);
      }
      setShowModal(false);
      fetchTransactions();
    } catch (err) {
      console.error('Failed to save transaction:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await axios.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get('/transactions/export', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Transactions Ledger</h1>
          <p className="text-xs text-dark-muted mt-1">Review and manage your complete income and expense records.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="glass-btn-secondary py-2.5 px-4 text-xs"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={handleOpenAdd}
            className="glass-btn-primary py-2.5 px-4 text-xs font-semibold"
          >
            <Plus size={16} />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-panel p-5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1 flex items-center">
            <Search size={16} className="absolute left-4 text-dark-muted" />
            <input
              type="text"
              placeholder="Search descriptions, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input pl-11 py-2"
            />
          </div>
          <button type="submit" className="glass-btn-primary px-5 py-2 text-xs">Search</button>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Type Filter */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="glass-input py-2 text-xs"
            >
              <option value="">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expense Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="glass-input py-2 text-xs"
            >
              <option value="">All Categories</option>
              <option value="Food">Food</option>
              <option value="Travel">Travel</option>
              <option value="Shopping">Shopping</option>
              <option value="Education">Education</option>
              <option value="Health">Health</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Bills">Bills</option>
              <option value="Income">Income Deposits</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="glass-input py-2 text-xs"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="glass-input py-2 text-xs"
            />
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch('');
                setType('');
                setCategory('');
                setStartDate('');
                setEndDate('');
              }}
              className="w-full glass-btn-secondary py-2 text-xs flex justify-center items-center gap-1.5"
            >
              <X size={12} /> Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Table Panel */}
      <div className="glass-panel p-5 overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-xs text-dark-muted">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-dark-muted">No transactions found matching your criteria.</div>
        ) : (
          <table className="w-full text-left text-xs text-dark-text min-w-[650px]">
            <thead>
              <tr className="border-b border-dark-border/40 text-dark-muted font-semibold">
                <th className="py-2.5">Date</th>
                <th className="py-2.5">Description</th>
                <th className="py-2.5">Type</th>
                <th className="py-2.5">Category / Source</th>
                <th className="py-2.5 text-right">Amount</th>
                <th className="py-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id || tx.id} className="border-b border-dark-border/10 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="py-3 text-dark-muted">{tx.date}</td>
                  <td className="py-3">
                    <div className="font-semibold text-white">
                      {tx.description || (tx.type === 'income' ? 'Income Deposit' : 'Expense Payment')}
                    </div>
                    {tx.isRecurring && (
                      <span className="text-[9px] font-medium text-brand-secondary bg-brand-primary/10 border border-brand-primary/25 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                        Recurring: {tx.recurringInterval}
                      </span>
                    )}
                  </td>
                  <td className="py-3 capitalize">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      tx.type === 'income' 
                        ? 'bg-brand-success/10 border-brand-success/30 text-brand-success' 
                        : 'bg-brand-danger/10 border-brand-danger/30 text-brand-danger'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3 text-white">
                    {tx.type === 'income' ? tx.source || 'Salary' : tx.category}
                  </td>
                  <td className={`py-3 text-right font-extrabold text-sm ${
                    tx.type === 'income' ? 'text-brand-success' : 'text-white'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                  </td>
                  <td className="py-3">
                    <div className="flex justify-center items-center gap-2">
                      <button 
                        onClick={() => handleOpenEdit(tx)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-dark-muted hover:text-white cursor-pointer transition-all"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(tx._id || tx.id)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-dark-muted hover:text-brand-danger cursor-pointer transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Unified Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 shadow-2xl relative text-left">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-dark-muted hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-base font-bold text-white mb-4">
              {isEditing ? 'Modify Transaction Entry' : 'Log New Transaction'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isEditing}
                  onClick={() => setFormType('expense')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    formType === 'expense' ? 'bg-brand-danger/25 border-brand-danger/60 text-brand-danger' : 'border-dark-border text-dark-muted'
                  } disabled:opacity-50`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  disabled={isEditing}
                  onClick={() => setFormType('income')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    formType === 'income' ? 'bg-brand-success/25 border-brand-success/60 text-brand-success' : 'border-dark-border text-dark-muted'
                  } disabled:opacity-50`}
                >
                  Income
                </button>
              </div>

              {formType === 'expense' ? (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-dark-muted font-medium">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
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
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
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
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-dark-muted font-medium">Date</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-dark-muted font-medium">Description</label>
                <input
                  type="text"
                  placeholder="Payment remarks..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              {/* Recurring Switch */}
              <div className="p-3 bg-dark-cardMuted border border-dark-border rounded-xl space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsRecurring}
                    onChange={(e) => setFormIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded border-dark-border bg-dark-bg accent-brand-primary"
                  />
                  <span>Automate as Recurring Transaction</span>
                </label>
                
                {formIsRecurring && (
                  <div className="flex flex-col gap-1 text-[11px]">
                    <span className="text-dark-muted font-medium">Choose Recurrence Cycle</span>
                    <select
                      value={formInterval}
                      onChange={(e) => setFormInterval(e.target.value)}
                      className="glass-input py-1.5 px-3 bg-dark-bg"
                    >
                      <option value="daily">Every Day (Daily)</option>
                      <option value="weekly">Every Week (Weekly)</option>
                      <option value="monthly">Every Month (Monthly)</option>
                      <option value="yearly">Every Year (Yearly)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
    </div>
  );
};

export default Transactions;
