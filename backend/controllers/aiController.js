const dbService = require('../services/dbService');

const aiController = {
  getInsights: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Setup current and prior month strings
      const now = new Date();
      const currentMonthStr = now.toISOString().substring(0, 7); // YYYY-MM
      
      const prevMonthDate = new Date();
      prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
      const prevMonthStr = prevMonthDate.toISOString().substring(0, 7);

      // Fetch all transactions
      const transactions = await dbService.getTransactions(userId);
      const budgets = await dbService.getBudgets(userId, currentMonthStr);
      const loans = await dbService.getLoans(userId);
      const goals = await dbService.getGoals(userId);

      // 1. Group transactions by month and category
      const monthlyData = {}; // YYYY-MM -> { income: 0, expense: 0, categories: {} }
      
      transactions.forEach(t => {
        const m = t.date.substring(0, 7);
        if (!monthlyData[m]) {
          monthlyData[m] = { income: 0, expense: 0, categories: {} };
        }

        if (t.type === 'income') {
          monthlyData[m].income += t.amount;
        } else {
          monthlyData[m].expense += t.amount;
          monthlyData[m].categories[t.category] = (monthlyData[m].categories[t.category] || 0) + t.amount;
        }
      });

      const currentMonthData = monthlyData[currentMonthStr] || { income: 0, expense: 0, categories: {} };
      const prevMonthDataObj = monthlyData[prevMonthStr] || { income: 0, expense: 0, categories: {} };

      // 2. Financial Health Score Algorithm
      let healthScore = 70; // Default baseline
      const healthFactors = [];

      const currentIncome = currentMonthData.income;
      const currentExpense = currentMonthData.expense;

      // Savings Rate Factor (Max 35 points)
      let savingsRate = 0;
      if (currentIncome > 0) {
        savingsRate = (currentIncome - currentExpense) / currentIncome;
      }
      
      let savingsScore = 0;
      if (savingsRate >= 0.3) {
        savingsScore = 35;
        healthFactors.push('Excellent savings rate above 30% (+35 pts).');
      } else if (savingsRate >= 0.15) {
        savingsScore = 25;
        healthFactors.push('Healthy savings rate between 15% and 30% (+25 pts).');
      } else if (savingsRate > 0) {
        savingsScore = 15;
        healthFactors.push('Low savings rate. Try to save at least 15% of your income (+15 pts).');
      } else {
        savingsScore = 0;
        healthFactors.push('Zero or negative savings rate. You are spending more than you earn (0 pts).');
      }

      // Budget Discipline Factor (Max 30 points)
      let budgetScore = 0;
      if (budgets.length > 0) {
        // Group expenses for current month
        let brokenBudgetsCount = 0;
        
        budgets.forEach(b => {
          const spent = currentMonthData.categories[b.category] || 0;
          if (spent > b.limitAmount) {
            brokenBudgetsCount++;
          }
        });

        const passRate = (budgets.length - brokenBudgetsCount) / budgets.length;
        if (passRate === 1) {
          budgetScore = 30;
          healthFactors.push('Flawless budget adherence! No categories overspent (+30 pts).');
        } else if (passRate >= 0.75) {
          budgetScore = 20;
          healthFactors.push(`Good budget discipline. You stuck to ${Math.round(passRate*100)}% of your limits (+20 pts).`);
        } else {
          budgetScore = 5;
          healthFactors.push('Multiple budgets exceeded. Need to monitor category spending closely (+5 pts).');
        }
      } else {
        budgetScore = 15; // neutral when no budgets are set
        healthFactors.push('Set category budgets to improve discipline and track health score (+15 pts).');
      }

      // Debt Load Factor (Max 25 points)
      let debtScore = 25;
      let totalEMIs = 0;
      loans.forEach(l => {
        if (l.remainingAmount > 0) {
          totalEMIs += l.emi;
        }
      });

      if (totalEMIs > 0) {
        const debtRatio = currentIncome > 0 ? (totalEMIs / currentIncome) : 1;
        if (debtRatio < 0.2) {
          debtScore = 20;
          healthFactors.push(`Manageable debt-to-income EMI load of ${Math.round(debtRatio*100)}% (+20 pts).`);
        } else if (debtRatio < 0.4) {
          debtScore = 10;
          healthFactors.push(`Caution: Debt EMI load represents ${Math.round(debtRatio*100)}% of monthly income (+10 pts).`);
        } else {
          debtScore = 0;
          healthFactors.push(`Warning: High debt EMI load above 40% of income. Restructure loans immediately (0 pts).`);
        }
      } else {
        healthFactors.push('Debt-free! No outstanding active loan payments (+25 pts).');
      }

      // Goals progress factor (Max 10 points)
      let goalScore = 0;
      if (goals.length > 0) {
        const inProgress = goals.filter(g => g.status === 'In Progress');
        const achieved = goals.filter(g => g.status === 'Achieved');
        
        if (achieved.length > 0) {
          goalScore = 10;
          healthFactors.push('Achieved financial savings targets (+10 pts).');
        } else if (inProgress.length > 0) {
          goalScore = 5;
          healthFactors.push('Actively saving towards future financial goals (+5 pts).');
        }
      }

      healthScore = savingsScore + budgetScore + debtScore + goalScore;
      
      // Update user database score (async/unawaited or direct)
      await dbService.updateUser(userId, { healthScore });

      // 3. Category Spending Analysis (comparisons)
      const spendingAnalysis = [];
      const currentCats = Object.keys(currentMonthData.categories);
      
      currentCats.forEach(cat => {
        const currentAmt = currentMonthData.categories[cat];
        const prevAmt = prevMonthDataObj.categories[cat] || 0;

        if (prevAmt > 0) {
          const diff = currentAmt - prevAmt;
          const diffPct = (diff / prevAmt) * 100;
          
          if (diffPct > 15) {
            spendingAnalysis.push({
              category: cat,
              message: `You spent ₹${Math.round(diff)} more on ${cat} this month compared to last month (+${Math.round(diffPct)}%).`,
              severity: 'warning'
            });
          } else if (diffPct < -15) {
            spendingAnalysis.push({
              category: cat,
              message: `Great! You reduced your ${cat} spending by ₹${Math.round(Math.abs(diff))} (-${Math.round(Math.abs(diffPct))}%).`,
              severity: 'good'
            });
          }
        }
      });

      // 4. Savings Suggestions
      const suggestions = [];
      
      // Filter goals in progress
      const targetGoals = goals.filter(g => g.status === 'In Progress');
      
      if (targetGoals.length > 0 && currentMonthData.expense > 0) {
        const primaryGoal = targetGoals[0];
        
        // Suggest reduction in non-essential category
        const nonEssentials = ['Entertainment', 'Shopping', 'Travel'];
        let sourceCategory = null;
        let potentialSavings = 0;

        for (const cat of nonEssentials) {
          const spent = currentMonthData.categories[cat] || 0;
          if (spent > 2000) {
            sourceCategory = cat;
            potentialSavings = Math.round(spent * 0.25); // recommend cutting 25%
            break;
          }
        }

        if (sourceCategory && potentialSavings > 0) {
          const remainingAmountNeeded = primaryGoal.targetAmount - primaryGoal.currentAmount;
          const currentContributionEstimate = currentIncome > 0 ? (currentIncome - currentExpense) : 0;
          
          let monthBenefit = '';
          if (currentContributionEstimate > 0) {
            const currentMonthsNeeded = remainingAmountNeeded / currentContributionEstimate;
            const expeditedMonthsNeeded = remainingAmountNeeded / (currentContributionEstimate + potentialSavings);
            const savedMonths = Math.round((currentMonthsNeeded - expeditedMonthsNeeded) * 10) / 10;
            if (savedMonths > 0.3) {
              monthBenefit = ` to achieve your "${primaryGoal.name}" goal ${savedMonths} months earlier!`;
            }
          }

          suggestions.push({
            type: 'action',
            text: `Reduce your ${sourceCategory} spending by ₹${potentialSavings} (save 25%)${monthBenefit}`
          });
        }
      }

      if (savingsRate < 0.15) {
        suggestions.push({
          type: 'general',
          text: 'Aim to automate a 15% savings deposit immediately on salary day to pay yourself first.'
        });
      }
      if (loans.length > 1) {
        suggestions.push({
          type: 'debt',
          text: 'Consider using the snowball method to pay down your smallest loan balance first, freeing up cash flow.'
        });
      }
      if (suggestions.length === 0) {
        suggestions.push({
          type: 'good',
          text: 'Your finances look excellent! Start researching higher-yield investment options to increase passive assets.'
        });
      }

      // 5. Expense Prediction Engine (next month regression)
      // Collect totals of previous months
      const monthlyExpenses = [];
      Object.keys(monthlyData).forEach(m => {
        if (m !== currentMonthStr) { // Use fully completed months
          monthlyExpenses.push({ month: m, total: monthlyData[m].expense });
        }
      });
      // Sort older to newer
      monthlyExpenses.sort((a, b) => a.month.localeCompare(b.month));

      let predictedNextMonthExpense = currentMonthData.expense || 15000; // fallback default
      let predictionConfidence = 'Low (Need more historical data)';

      if (monthlyExpenses.length >= 1) {
        const lastMonthExpense = monthlyExpenses[monthlyExpenses.length - 1].total;
        
        if (monthlyExpenses.length === 1) {
          // simple average
          predictedNextMonthExpense = Math.round((lastMonthExpense + currentMonthData.expense) / 2);
          predictionConfidence = 'Medium';
        } else {
          // Weight recent month heavily
          const sumExpenses = monthlyExpenses.reduce((sum, item) => sum + item.total, 0) + currentMonthData.expense;
          const avg = sumExpenses / (monthlyExpenses.length + 1);
          
          // Apply a moving average weight (60% last completed month, 30% older, 10% inflation check)
          predictedNextMonthExpense = Math.round(lastMonthExpense * 0.5 + currentMonthData.expense * 0.4 + avg * 0.1);
          predictionConfidence = 'High (Regression-weighted analysis)';
        }
      }

      res.json({
        healthScore,
        healthFactors,
        spendingAnalysis,
        suggestions,
        prediction: {
          predictedExpense: predictedNextMonthExpense,
          confidence: predictionConfidence,
          targetMonth: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().substring(0, 7)
        }
      });
    } catch (err) {
      console.error('Get AI Insights Error:', err);
      res.status(500).json({ message: 'Server error generating AI insights.' });
    }
  }
};

module.exports = aiController;
