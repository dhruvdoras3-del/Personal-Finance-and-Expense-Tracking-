import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Link2, 
  Plus, 
  CheckCircle, 
  Lock, 
  HelpCircle, 
  X,
  RefreshCw,
  Landmark,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BankIntegration = () => {
  const { triggerAlertsFetch } = useAuth();
  const [institutions, setInstitutions] = useState([]);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedInst, setSelectedInst] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => {
    fetchInstitutions();
    // Load previously linked accounts from local storage to persist the sandbox state
    const saved = localStorage.getItem('linked_bank_accounts');
    if (saved) {
      setLinkedAccounts(JSON.parse(saved));
    }
  }, []);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/bank/institutions');
      setInstitutions(res.data);
    } catch (err) {
      console.error('Failed to fetch institutions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLink = (inst) => {
    // Prevent linking same bank twice in sandbox
    const exists = linkedAccounts.some(acc => acc.institutionId === inst.id);
    if (exists) {
      alert(`You have already connected a sandbox account for ${inst.name}.`);
      return;
    }
    setSelectedInst(inst);
    setUsername('');
    setPassword('');
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    setSyncing(true);
    setSyncStatus('Establishing secure handshake...');
    
    // Simulate connection lag
    setTimeout(async () => {
      setSyncStatus('Retrieving checking and savings ledger...');
      
      setTimeout(async () => {
        try {
          const res = await axios.post('/bank/link', {
            institutionId: selectedInst.id,
            username
          });

          const newAcc = {
            id: Math.random().toString(36).substring(2),
            institutionId: selectedInst.id,
            name: selectedInst.name,
            logo: selectedInst.logo,
            username,
            accountNumber: res.data.account.accountNumber,
            balance: res.data.account.balance,
            linkedAt: new Date().toLocaleDateString()
          };

          const updated = [...linkedAccounts, newAcc];
          setLinkedAccounts(updated);
          localStorage.setItem('linked_bank_accounts', JSON.stringify(updated));
          
          alert(res.data.message);
          setSelectedInst(null);
          triggerAlertsFetch(); // Refresh alerts in header
        } catch (err) {
          console.error(err);
          alert('Failed to connect bank sandbox.');
        } finally {
          setSyncing(false);
          setSyncStatus('');
        }
      }, 1500);
    }, 1200);
  };

  const handleUnlink = (id) => {
    if (!window.confirm('Are you sure you want to disconnect this account? Doing so will halt active bank syncing.')) return;
    const updated = linkedAccounts.filter(acc => acc.id !== id);
    setLinkedAccounts(updated);
    localStorage.setItem('linked_bank_accounts', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-glass-gradient glass-panel p-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Landmark size={20} className="text-brand-secondary" /> Linked Bank Sync
          </h1>
          <p className="text-xs text-dark-muted mt-1">Connect your credit cards and checking accounts to fetch transactions automatically.</p>
        </div>
      </div>

      {/* Linked Accounts Dashboard */}
      {linkedAccounts.length > 0 && (
        <div className="glass-panel p-5 text-left space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle size={16} className="text-brand-success" /> Synced Bank Feeds
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {linkedAccounts.map((acc) => (
              <div 
                key={acc.id} 
                className="p-4 bg-dark-cardMuted border border-dark-border rounded-2xl flex flex-wrap justify-between items-center gap-4 hover:border-brand-primary/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-dark-bg border border-dark-border flex items-center justify-center text-xl">
                    {acc.logo}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{acc.name}</h4>
                    <span className="text-[10px] text-dark-muted block">
                      Account: {acc.accountNumber} • Synced: {acc.linkedAt}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <span className="text-sm font-extrabold text-white block">₹{acc.balance.toLocaleString()}</span>
                    <span className="text-[9px] text-brand-success font-semibold flex items-center gap-0.5">
                      <RefreshCw size={8} className="animate-spin" /> Auto Syncing
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleUnlink(acc.id)}
                    className="glass-btn-secondary py-1.5 px-3 text-[10px] border-brand-danger/30 text-brand-danger hover:bg-brand-danger/10"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Connections Grid */}
      <div className="glass-panel p-5 text-left space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white">Add Connected Feed</h3>
          <p className="text-[10px] text-dark-muted mt-0.5">Select a demo portal below to connect account statements.</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-dark-muted">Loading sandbox institutions...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {institutions.map((inst) => {
              const isLinked = linkedAccounts.some(acc => acc.institutionId === inst.id);
              
              return (
                <button
                  key={inst.id}
                  disabled={isLinked}
                  onClick={() => handleOpenLink(inst)}
                  className={`p-5 rounded-2xl border text-center flex flex-col items-center justify-center gap-3 transition-all cursor-pointer relative ${
                    isLinked 
                      ? 'bg-dark-cardMuted/30 border-dark-border/40 text-dark-muted cursor-not-allowed' 
                      : 'bg-dark-cardMuted border-dark-border text-white hover:border-brand-primary hover:bg-dark-border/20'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-dark-bg border border-dark-border/80 flex items-center justify-center text-2xl">
                    {inst.logo}
                  </div>
                  <div>
                    <span className="font-bold text-xs block">{inst.name}</span>
                    <span className="text-[8px] text-dark-muted uppercase font-bold tracking-widest">{inst.country}</span>
                  </div>
                  {isLinked && (
                    <span className="absolute top-2 right-2 text-[8px] font-bold text-brand-success bg-brand-success/15 border border-brand-success/35 px-1.5 py-0.5 rounded">
                      Linked
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Connection Popup Dialog Drawer */}
      {selectedInst && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel p-6 shadow-2xl relative text-left">
            <button 
              disabled={syncing}
              onClick={() => setSelectedInst(null)}
              className="absolute top-4 right-4 text-dark-muted hover:text-white cursor-pointer disabled:opacity-50"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{selectedInst.logo}</span>
              <div>
                <h3 className="text-sm font-bold text-white">Connect {selectedInst.name}</h3>
                <p className="text-[10px] text-brand-secondary font-semibold">Sandbox Banking Integration</p>
              </div>
            </div>

            {syncing ? (
              <div className="py-10 text-center space-y-4 flex flex-col items-center justify-center">
                <RefreshCw size={32} className="text-brand-secondary animate-spin" />
                <div>
                  <p className="text-xs font-semibold text-white">Connecting account...</p>
                  <p className="text-[10px] text-dark-muted mt-1 animate-pulse">{syncStatus}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConnect} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-dark-muted font-medium">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter sandbox username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-dark-muted font-medium">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter sandbox password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>

                <div className="p-3 bg-brand-primary/5 border border-brand-primary/10 rounded-xl space-y-1.5 text-[10px] text-dark-muted leading-relaxed">
                  <span className="font-bold text-white flex items-center gap-1">
                    <Lock size={12} className="text-brand-secondary" /> Sandbox Credentials Guide
                  </span>
                  <p>This is a simulated secure link portal. You can enter any mock username and password to test account statements loading.</p>
                </div>

                <button
                  type="submit"
                  className="w-full glass-btn-primary py-2.5 text-xs font-semibold mt-4"
                >
                  <ShieldCheck size={14} /> Connect Securely
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BankIntegration;
