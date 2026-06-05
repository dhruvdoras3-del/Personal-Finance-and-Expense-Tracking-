import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Sparkles, 
  BrainCircuit, 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  Heart,
  TrendingDown,
  ArrowRight,
  TrendingUp as TrendUpIcon
} from 'lucide-react';

const AIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/ai/insights');
      setInsights(res.data);
    } catch (err) {
      console.error('Failed to fetch AI insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-brand-success';
    if (score >= 50) return 'text-brand-warning';
    return 'text-brand-danger';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-brand-success/10 border-brand-success/30';
    if (score >= 50) return 'bg-brand-warning/10 border-brand-warning/30';
    return 'bg-brand-danger/10 border-brand-danger/30';
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-glass-gradient glass-panel p-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <BrainCircuit className="text-brand-secondary animate-pulse" /> AI Wealth Coach
          </h1>
          <p className="text-xs text-dark-muted mt-1">Get automated, algorithmic analysis of your savings discipline, habits, and projections.</p>
        </div>
        <button 
          onClick={fetchInsights}
          className="glass-btn-secondary py-2 px-4 text-xs font-semibold"
        >
          Recalculate Metrics
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-dark-muted glass-panel">Analyzing ledger entries...</div>
      ) : !insights ? (
        <div className="py-24 text-center text-xs text-dark-muted glass-panel">Failed to load insights. Make sure transactions exist.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Health Score Panel */}
          <div className="glass-panel p-6 flex flex-col items-center justify-between text-center min-h-[350px]">
            <div className="w-full text-left">
              <h3 className="text-sm font-bold text-white">Financial Health Score</h3>
              <p className="text-[10px] text-dark-muted mt-0.5">Calculated based on your savings, budget limits, and EMIs.</p>
            </div>

            {/* Visual Gauge Dial */}
            <div className="relative my-6 flex items-center justify-center">
              {/* Circular Gauge Border */}
              <div className="w-36 h-36 rounded-full border-4 border-dark-border/40 flex flex-col items-center justify-center relative">
                <span className={`text-4xl font-extrabold tracking-tight ${getScoreColor(insights.healthScore)}`}>
                  {insights.healthScore}
                </span>
                <span className="text-[10px] text-dark-muted font-semibold uppercase tracking-wider mt-1">Score</span>
                
                {/* Glow ring */}
                <div className={`absolute inset-0 rounded-full border-4 opacity-30 ${
                  insights.healthScore >= 80 ? 'border-brand-success shadow-lg' : insights.healthScore >= 50 ? 'border-brand-warning shadow-lg' : 'border-brand-danger shadow-lg'
                }`} />
              </div>
            </div>

            <div className={`w-full p-3 rounded-xl border text-xs text-left leading-relaxed ${getScoreBg(insights.healthScore)}`}>
              <div className="font-semibold mb-1 flex items-center gap-1.5">
                <Activity size={14} /> Score Summary
              </div>
              <p className="text-[11px] text-dark-text">
                {insights.healthScore >= 80 
                  ? 'Your financial practices are excellent! You save consistently, manage debts perfectly, and stick to budgets.' 
                  : insights.healthScore >= 50 
                    ? 'Fair standing, but you can build greater security by cutting non-essential expenses and lowering budget leakage.' 
                    : 'Critical score. Current expenses and debt loads exceed income. Restructure your spending targets immediately.'
                }
              </p>
            </div>
          </div>

          {/* Factors and Recommendations Column */}
          <div className="glass-panel p-6 lg:col-span-2 text-left space-y-4">
            <h3 className="text-sm font-bold text-white">Audit Checklist & Score Factors</h3>
            
            <div className="space-y-3">
              {insights.healthFactors.map((factor, index) => {
                const isPositive = factor.includes('(+');
                const isNeutral = factor.includes('Set category');
                
                return (
                  <div 
                    key={index} 
                    className={`p-3 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                      isPositive 
                        ? 'bg-brand-success/5 border-brand-success/20 text-dark-text' 
                        : isNeutral 
                          ? 'bg-brand-primary/5 border-brand-primary/20 text-dark-text' 
                          : 'bg-brand-danger/5 border-brand-danger/20 text-dark-text'
                    }`}
                  >
                    <span className="mt-0.5">
                      {isPositive ? (
                        <span className="text-brand-success font-bold">✓</span>
                      ) : isNeutral ? (
                        <span className="text-brand-secondary font-bold">ℹ</span>
                      ) : (
                        <span className="text-brand-danger font-bold">⚠</span>
                      )}
                    </span>
                    <p>{factor}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Savings Coach suggestions */}
          <div className="glass-panel p-6 text-left space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles size={16} className="text-brand-secondary" /> Coach Recommendations
            </h3>
            
            <div className="space-y-3">
              {insights.suggestions.map((sug, idx) => (
                <div 
                  key={idx} 
                  className="p-4 bg-dark-cardMuted/70 border border-dark-border/40 rounded-xl space-y-2"
                >
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${
                    sug.type === 'action' ? 'bg-brand-accent/15 border border-brand-accent/35 text-brand-accent' : 'bg-brand-primary/10 border border-brand-primary/25 text-brand-secondary'
                  }`}>
                    {sug.type} Recommend
                  </span>
                  <p className="text-xs text-white leading-relaxed font-medium">{sug.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Expense Analysis (Comparisons) */}
          <div className="glass-panel p-6 text-left space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <TrendingUp size={16} className="text-brand-secondary" /> MoM Spending Swings
            </h3>
            
            <div className="space-y-3">
              {insights.spendingAnalysis.length === 0 ? (
                <div className="py-12 text-center text-xs text-dark-muted">
                  No significant budget category shifts detected compared to last month.
                </div>
              ) : (
                insights.spendingAnalysis.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                      item.severity === 'warning' 
                        ? 'bg-brand-danger/5 border-brand-danger/25 text-dark-text' 
                        : 'bg-brand-success/5 border-brand-success/25 text-dark-text'
                    }`}
                  >
                    <span className="mt-0.5">
                      {item.severity === 'warning' ? (
                        <AlertTriangle size={14} className="text-brand-danger" />
                      ) : (
                        <Heart size={14} className="text-brand-success" />
                      )}
                    </span>
                    <p>{item.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Expense Forecast (Prediction) */}
          <div className="glass-panel p-6 text-left space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <BrainCircuit size={16} className="text-brand-secondary" /> Predicted Expense
            </h3>

            <div className="bg-dark-cardMuted/70 border border-dark-border/40 p-4 rounded-xl space-y-4">
              <div>
                <span className="text-[10px] text-dark-muted font-semibold uppercase tracking-wider">Forecast for {insights.prediction.targetMonth}</span>
                <h4 className="text-2xl font-black text-white mt-1">₹{insights.prediction.predictedExpense.toLocaleString()}</h4>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-dark-muted">Engine Confidence</span>
                  <span className="text-brand-secondary">{insights.prediction.confidence}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-dark-bg border border-dark-border overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      insights.prediction.confidence.includes('High') ? 'bg-brand-success' : 'bg-brand-warning'
                    }`}
                    style={{ width: insights.prediction.confidence.includes('High') ? '100%' : '50%' }}
                  />
                </div>
              </div>

              <p className="text-[11px] text-dark-muted leading-relaxed">
                *Forecast calculated using regression-weighted averages of completed transactions. Real bill reminders and automated EMIs are loaded as base variables.
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default AIInsights;
