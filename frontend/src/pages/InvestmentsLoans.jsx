import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Calculator, 
  DollarSign, 
  Percent, 
  Calendar,
  AlertTriangle,
  Coins
} from 'lucide-react';

const InvestmentsLoans = () => {
  const [investments, setInvestments] = useState([]);
  const [invSummary, setInvSummary] = useState({ totalCostBasis: 0, totalCurrentValue: 0, overallProfitLoss: 0, overallProfitLossPct: 0 });
  const [loans, setLoans] = useState([]);
  
  // Tab states: 'investments' or 'loans'
  const [activeTab, setActiveTab] = useState('investments');
  const [loading, setLoading] = useState(true);

  // New Investment Form fields
  const [assetType, setAssetType] = useState('Stock');
  const [invName, setInvName] = useState('');
  const [invQuantity, setInvQuantity] = useState('');
  const [invBuyPrice, setInvBuyPrice] = useState('');
  const [invCurrentPrice, setInvCurrentPrice] = useState('');
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);

  // New Loan Form fields
  const [loanName, setLoanName] = useState('');
  const [loanTotal, setLoanTotal] = useState('');
  const [loanRate, setLoanRate] = useState('');
  const [loanTenure, setLoanTenure] = useState('');
  const [loanStart, setLoanStart] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (activeTab === 'investments') {
      fetchInvestments();
    } else {
      fetchLoans();
    }
  }, [activeTab]);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/investments');
      setInvestments(res.data.investments);
      setInvSummary(res.data.summary);
    } catch (err) {
      console.error('Failed to fetch investments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/loans');
      setLoans(res.data);
    } catch (err) {
      console.error('Failed to fetch loans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvestment = async (e) => {
    e.preventDefault();
    if (!invName || !invQuantity || !invBuyPrice || !invDate) return;

    try {
      await axios.post('/investments', {
        assetType,
        name: invName,
        quantity: parseFloat(invQuantity),
        buyPrice: parseFloat(invBuyPrice),
        currentPrice: invCurrentPrice ? parseFloat(invCurrentPrice) : parseFloat(invBuyPrice),
        purchaseDate: invDate
      });

      // Clear
      setInvName('');
      setInvQuantity('');
      setInvBuyPrice('');
      setInvCurrentPrice('');
      
      fetchInvestments();
    } catch (err) {
      console.error('Failed to add investment:', err);
    }
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    if (!loanName || !loanTotal || !loanRate || !loanTenure || !loanStart) return;

    try {
      await axios.post('/loans', {
        name: loanName,
        totalAmount: parseFloat(loanTotal),
        interestRate: parseFloat(loanRate),
        tenureMonths: parseInt(loanTenure),
        startDate: loanStart
      });

      // Clear
      setLoanName('');
      setLoanTotal('');
      setLoanRate('');
      setLoanTenure('');
      
      fetchLoans();
    } catch (err) {
      console.error('Failed to add loan tracker:', err);
    }
  };

  const handlePayEMI = async (loanId) => {
    try {
      const res = await axios.post(`/loans/${loanId}/pay-emi`);
      alert(res.data.message);
      fetchLoans();
    } catch (err) {
      console.error('Failed to pay EMI:', err);
    }
  };

  const handleDeleteInvestment = async (id) => {
    if (!window.confirm('Delete this asset entry?')) return;
    try {
      await axios.delete(`/investments/${id}`);
      fetchInvestments();
    } catch (err) {
      console.error('Failed to delete investment:', err);
    }
  };

  const handleDeleteLoan = async (id) => {
    if (!window.confirm('Delete this loan tracker?')) return;
    try {
      await axios.delete(`/loans/${id}`);
      fetchLoans();
    } catch (err) {
      console.error('Failed to delete loan tracker:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-glass-gradient glass-panel p-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Wealth & Liability Management</h1>
          <p className="text-xs text-dark-muted mt-1">Track net wealth components: active investment yields and loan EMI schedules.</p>
        </div>
        
        {/* Tabs switcher */}
        <div className="flex gap-2 p-1 bg-dark-cardMuted rounded-xl border border-dark-border">
          <button
            onClick={() => setActiveTab('investments')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'investments' ? 'bg-brand-primary text-white' : 'text-dark-muted hover:text-white'
            }`}
          >
            Investments
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'loans' ? 'bg-brand-primary text-white' : 'text-dark-muted hover:text-white'
            }`}
          >
            Loans & EMIs
          </button>
        </div>
      </div>

      {activeTab === 'investments' ? (
        // ==========================================
        // INVESTMENTS TAB
        // ==========================================
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Investment Form */}
          <div className="glass-panel p-5 h-fit text-left">
            <h3 className="text-sm font-bold text-white mb-4">Add Investment Asset</h3>
            <form onSubmit={handleCreateInvestment} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-dark-muted font-medium">Asset Class</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full glass-input"
                >
                  <option value="Stock">Stock Holdings</option>
                  <option value="Mutual Fund">Mutual Fund</option>
                  <option value="SIP">Systematic Investment Plan (SIP)</option>
                  <option value="FD">Fixed Deposit (FD)</option>
                  <option value="Gold">Physical Gold</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-dark-muted font-medium">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reliance, HDFC Index Fund, gold coin..."
                  value={invName}
                  onChange={(e) => setInvName(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-dark-muted font-medium">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="1"
                    value={invQuantity}
                    onChange={(e) => setInvQuantity(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-dark-muted font-medium">Buy Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="1200"
                    value={invBuyPrice}
                    onChange={(e) => setInvBuyPrice(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-dark-muted font-medium">Current Price (₹)</label>
                  <input
                    type="number"
                    placeholder="Same as buy"
                    value={invCurrentPrice}
                    onChange={(e) => setInvCurrentPrice(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-dark-muted font-medium">Purchase Date</label>
                  <input
                    type="date"
                    required
                    value={invDate}
                    onChange={(e) => setInvDate(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full glass-btn-primary py-2.5 text-xs font-semibold mt-4"
              >
                <Plus size={16} />
                Add Asset
              </button>
            </form>
          </div>

          {/* Investments Portfolio View */}
          <div className="lg:col-span-2 space-y-6 text-left">
            {/* Portfolio Summary Card */}
            <div className="glass-panel p-5 bg-gradient-to-r from-brand-primary/10 to-brand-secondary/15 flex flex-wrap justify-between items-center gap-6">
              <div>
                <span className="text-[10px] text-dark-muted font-semibold uppercase tracking-wider">Portfolio Net Value</span>
                <h3 className="text-2xl font-black text-white mt-1">₹{invSummary.totalCurrentValue.toLocaleString()}</h3>
                <span className="text-[10px] text-dark-muted">Cost basis: ₹{invSummary.totalCostBasis.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-dark-muted font-semibold uppercase tracking-wider block">Unrealized Returns</span>
                <span className={`text-base font-extrabold flex items-center gap-1 mt-1 justify-end ${
                  invSummary.overallProfitLoss >= 0 ? 'text-brand-success' : 'text-brand-danger'
                }`}>
                  {invSummary.overallProfitLoss >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  ₹{Math.abs(Math.round(invSummary.overallProfitLoss)).toLocaleString()} 
                  ({Math.round(invSummary.overallProfitLossPct * 100) / 100}%)
                </span>
              </div>
            </div>

            {/* Holdings list */}
            <div className="glass-panel p-5 overflow-x-auto">
              <h3 className="text-sm font-bold text-white mb-4">Invested Holdings</h3>
              
              {loading ? (
                <div className="py-12 text-center text-xs text-dark-muted">Loading holdings...</div>
              ) : investments.length === 0 ? (
                <div className="py-12 text-center text-xs text-dark-muted">No investments recorded yet.</div>
              ) : (
                <table className="w-full text-left text-xs text-dark-text min-w-[550px]">
                  <thead>
                    <tr className="border-b border-dark-border/40 text-dark-muted font-semibold">
                      <th className="py-2.5">Asset</th>
                      <th className="py-2.5">Quantity</th>
                      <th className="py-2.5 text-right">Avg Buy / Current</th>
                      <th className="py-2.5 text-right">Market Value</th>
                      <th className="py-2.5 text-right">Returns</th>
                      <th className="py-2.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map((inv) => (
                      <tr key={inv.id} className="border-b border-dark-border/10 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="py-3">
                          <h5 className="font-bold text-white">{inv.name}</h5>
                          <span className="text-[9px] text-brand-secondary bg-brand-primary/10 px-1.5 py-0.5 rounded font-medium inline-block mt-0.5">
                            {inv.assetType}
                          </span>
                        </td>
                        <td className="py-3 text-dark-text font-medium">{inv.quantity}</td>
                        <td className="py-3 text-right">
                          <span className="block text-white">₹{inv.buyPrice.toLocaleString()}</span>
                          <span className="text-[10px] text-dark-muted">₹{inv.currentPrice.toLocaleString()}</span>
                        </td>
                        <td className="py-3 text-right font-bold text-white">
                          ₹{Math.round(inv.currentValue).toLocaleString()}
                        </td>
                        <td className={`py-3 text-right font-bold ${
                          inv.profitLoss >= 0 ? 'text-brand-success' : 'text-brand-danger'
                        }`}>
                          <span className="block">₹{Math.round(inv.profitLoss).toLocaleString()}</span>
                          <span className="text-[10px]">{Math.round(inv.profitLossPct * 100) / 100}%</span>
                        </td>
                        <td className="py-3">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleDeleteInvestment(inv.id)}
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
          </div>
        </div>
      ) : (
        // ==========================================
        // LOANS TAB
        // ==========================================
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Loan form */}
          <div className="glass-panel p-5 h-fit text-left">
            <h3 className="text-sm font-bold text-white mb-4">Register Active Loan</h3>
            <form onSubmit={handleCreateLoan} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-dark-muted font-medium">Loan Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Car Loan, Education Debt, Home EMI..."
                  value={loanName}
                  onChange={(e) => setLoanName(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-dark-muted font-medium">Principal Loan Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="200000"
                  value={loanTotal}
                  onChange={(e) => setLoanTotal(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-dark-muted font-medium">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="8.5"
                    value={loanRate}
                    onChange={(e) => setLoanRate(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-dark-muted font-medium">Tenure (Months)</label>
                  <input
                    type="number"
                    required
                    placeholder="36"
                    value={loanTenure}
                    onChange={(e) => setLoanTenure(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-dark-muted font-medium">Disbursal Date</label>
                <input
                  type="date"
                  required
                  value={loanStart}
                  onChange={(e) => setLoanStart(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <button
                type="submit"
                className="w-full glass-btn-primary py-2.5 text-xs font-semibold mt-4"
              >
                <Plus size={16} />
                Calculate & Track Loan
              </button>
            </form>
          </div>

          {/* Active Debt list */}
          <div className="lg:col-span-2 space-y-4 text-left">
            <h3 className="text-sm font-bold text-white mb-2">Active Loan Trackers</h3>

            {loading ? (
              <div className="py-12 text-center text-xs text-dark-muted glass-panel">Loading debt lists...</div>
            ) : loans.length === 0 ? (
              <div className="py-12 text-center text-xs text-dark-muted glass-panel">No active loans registered in database.</div>
            ) : (
              <div className="space-y-4">
                {loans.map((loan) => (
                  <div key={loan.id} className="glass-panel p-5 space-y-4 glass-panel-hover">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-white">{loan.name}</h4>
                        <span className="text-[10px] text-dark-muted mt-0.5 block">
                          Disbursed on {loan.startDate} • Rate: {loan.interestRate}%
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteLoan(loan.id)}
                        className="p-1 rounded-lg hover:bg-white/5 text-dark-muted hover:text-brand-danger cursor-pointer transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Progress indicators */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-dark-muted font-medium">Repayment Progress</span>
                        <span className="text-white font-semibold">
                          ₹{Math.round(loan.totalPaid).toLocaleString()} / ₹{loan.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-dark-cardMuted border border-dark-border/40 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-brand-primary transition-all duration-500"
                          style={{ width: `${loan.progressPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-dark-muted">
                        <span>{Math.round(loan.progressPct)}% Repaid</span>
                        <span className="font-semibold text-brand-secondary">Remaining: ₹{Math.round(loan.remainingAmount).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* EMI Actions Panel */}
                    <div className="pt-4 border-t border-dark-border/20 flex flex-wrap justify-between items-center gap-4">
                      <div>
                        <span className="text-[9px] text-dark-muted font-semibold uppercase tracking-wider block">Estimated Monthly Installment (EMI)</span>
                        <span className="text-base font-extrabold text-white">₹{loan.emi.toLocaleString()} <span className="text-xs font-normal text-dark-muted">/ mo</span></span>
                      </div>

                      {loan.remainingAmount > 0 ? (
                        <button
                          onClick={() => handlePayEMI(loan.id)}
                          className="glass-btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                        >
                          <Coins size={14} />
                          <span>Simulate EMI Payment</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-brand-success uppercase bg-brand-success/15 border border-brand-success/35 px-3 py-1.5 rounded-xl">
                          Fully Repaid
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentsLoans;
