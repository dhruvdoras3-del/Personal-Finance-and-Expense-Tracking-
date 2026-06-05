import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Menu, ShieldCheck, HeartPulse } from 'lucide-react';

const Navbar = ({ toggleSidebar, title }) => {
  const { user, alerts, dismissAlert } = useAuth();
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Helper to color code the health score
  const getHealthColor = (score) => {
    if (score >= 80) return 'text-brand-success bg-brand-success/10 border-brand-success/30';
    if (score >= 50) return 'text-brand-warning bg-brand-warning/10 border-brand-warning/30';
    return 'text-brand-danger bg-brand-danger/10 border-brand-danger/30';
  };

  return (
    <header className="glass-panel border-x-0 border-t-0 rounded-none bg-dark-bg/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      {/* Left section: Hamburger & Title */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden text-dark-muted hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
        >
          <Menu size={22} />
        </button>
        <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
      </div>

      {/* Right section: Health Score & Notifications */}
      <div className="flex items-center gap-4">
        {/* Health Score Pill */}
        {user && (
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${getHealthColor(user.healthScore)}`}>
            <HeartPulse size={14} className="animate-pulse" />
            <span>Health Score: {user.healthScore || 70}/100</span>
          </div>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            className="relative p-2 rounded-xl bg-dark-cardMuted border border-dark-border text-dark-muted hover:text-white transition-all cursor-pointer hover:bg-dark-border/40"
          >
            <Bell size={18} />
            {alerts.length > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4.5 h-4.5 bg-brand-danger text-white rounded-full flex items-center justify-center text-[9px] font-bold ring-2 ring-dark-bg animate-bounce">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {showNotificationDropdown && (
            <div className="absolute right-0 mt-3 w-80 glass-panel border border-dark-border/80 shadow-2xl p-2 z-50 overflow-hidden">
              <div className="p-3 border-b border-dark-border flex justify-between items-center">
                <span className="font-semibold text-sm text-white">Alerts & Notifications</span>
                {alerts.length > 0 && (
                  <span className="text-[10px] text-brand-secondary bg-brand-secondary/10 px-2 py-0.5 rounded font-medium">
                    {alerts.length} Pending
                  </span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-dark-muted">
                    No active notifications or bill alerts.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className="p-3 border-b border-dark-border/30 last:border-0 hover:bg-white/5 transition-colors rounded-lg flex flex-col gap-1 text-left"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-medium text-xs text-brand-warning truncate">{alert.title}</span>
                        <button 
                          onClick={() => dismissAlert(alert.id)}
                          className="text-[10px] text-dark-muted hover:text-brand-danger font-medium cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                      <p className="text-[11px] text-dark-text leading-relaxed">{alert.message}</p>
                      <span className="text-[9px] text-dark-muted mt-0.5">Due: {alert.dueDate}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
