import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PieChart, 
  Target, 
  Bell, 
  Sparkles, 
  TrendingUp, 
  ShieldAlert, 
  LogOut,
  X,
  Landmark
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Budgets', path: '/budgets', icon: PieChart },
    { name: 'Savings Goals', path: '/goals', icon: Target },
    { name: 'Bill Reminders', path: '/reminders', icon: Bell },
    { name: 'AI Insights', path: '/ai', icon: Sparkles },
    { name: 'Investments & Loans', path: '/wealth', icon: TrendingUp },
    { name: 'Linked Accounts', path: '/bank-link', icon: Landmark },
  ];

  if (user && user.role === 'admin') {
    navItems.push({ name: 'Admin Dashboard', path: '/admin', icon: ShieldAlert });
  }

  const activeStyle = "bg-gradient-to-r from-brand-primary/20 to-brand-secondary/10 border-l-4 border-brand-primary text-white";
  const inactiveStyle = "text-dark-muted hover:text-white hover:bg-white/5 border-l-4 border-transparent";

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`fixed top-0 bottom-0 left-0 w-64 glass-panel border-r border-dark-border rounded-none lg:rounded-none z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header/Branding */}
        <div className="p-6 border-b border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-primary/20">
              FV
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-none">FinVibe</h1>
              <span className="text-[10px] text-brand-secondary font-semibold uppercase tracking-wider">AI Coached</span>
            </div>
          </div>
          <button 
            onClick={toggleSidebar}
            className="lg:hidden text-dark-muted hover:text-white cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 mx-4 my-4 bg-dark-cardMuted/60 border border-dark-border/40 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-secondary overflow-hidden font-semibold">
            {user?.profilePic ? (
              <img src={user.profilePic} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              user?.name?.substring(0, 2).toUpperCase() || 'US'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-dark-muted truncate">{user?.email}</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) toggleSidebar();
              }}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive ? activeStyle : inactiveStyle
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-dark-border mt-auto">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-brand-danger bg-brand-danger/10 hover:bg-brand-danger/20 transition-all cursor-pointer"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
