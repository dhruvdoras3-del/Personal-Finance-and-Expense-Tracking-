const dbService = require('../services/dbService');

const loanController = {
  getLoans: async (req, res) => {
    try {
      const userId = req.user.id;
      const loans = await dbService.getLoans(userId);

      const items = loans.map(loan => {
        // Amortization analysis
        const totalPaid = Math.max(0, loan.totalAmount - loan.remainingAmount);
        const progressPct = loan.totalAmount > 0 ? (totalPaid / loan.totalAmount) * 100 : 0;
        
        return {
          id: loan._id || loan.id,
          name: loan.name,
          totalAmount: loan.totalAmount,
          remainingAmount: loan.remainingAmount,
          interestRate: loan.interestRate,
          emi: loan.emi,
          tenureMonths: loan.tenureMonths,
          startDate: loan.startDate,
          totalPaid,
          progressPct
        };
      });

      res.json(items);
    } catch (err) {
      console.error('Get Loans Error:', err);
      res.status(500).json({ message: 'Server error fetching loans.' });
    }
  },

  create: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, totalAmount, interestRate, tenureMonths, startDate } = req.body;

      if (!name || !totalAmount || !interestRate || !tenureMonths || !startDate) {
        return res.status(400).json({ message: 'Name, totalAmount, interestRate, tenureMonths, and startDate are required.' });
      }

      const p = parseFloat(totalAmount);
      const r = parseFloat(interestRate) / 12 / 100; // Monthly interest rate
      const n = parseInt(tenureMonths);

      // Formula for EMI: P * r * (1 + r)^n / ((1 + r)^n - 1)
      let emi = 0;
      if (r > 0) {
        emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      } else {
        emi = p / n;
      }

      const loan = await dbService.createLoan(userId, {
        name,
        totalAmount: p,
        remainingAmount: p, // outstanding is equal to principal initially
        interestRate: parseFloat(interestRate),
        emi: Math.round(emi * 100) / 100, // round to 2 decimals
        tenureMonths: n,
        startDate
      });

      res.status(201).json(loan);
    } catch (err) {
      console.error('Create Loan Error:', err);
      res.status(500).json({ message: 'Server error creating loan.' });
    }
  },

  payEmi: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const loans = await dbService.getLoans(userId);
      const loan = loans.find(l => (l._id || l.id).toString() === id.toString());
      if (!loan) {
        return res.status(404).json({ message: 'Loan tracker not found.' });
      }

      if (loan.remainingAmount <= 0) {
        return res.status(400).json({ message: 'Loan is already fully repaid!' });
      }

      const amountPaid = Math.min(loan.remainingAmount, loan.emi);
      const newRemainingAmount = Math.max(0, loan.remainingAmount - amountPaid);
      
      const updates = { remainingAmount: newRemainingAmount };
      const updated = await dbService.updateLoan(id, userId, updates);

      // Auto-insert expense transaction
      await dbService.createTransaction({
        userId,
        type: 'expense',
        category: 'Bills',
        amount: amountPaid,
        date: new Date().toISOString().split('T')[0],
        description: `Loan EMI Payment: ${loan.name}`
      });

      res.json({
        message: `EMI payment of ₹${amountPaid} successfully processed.`,
        loan: updated
      });
    } catch (err) {
      console.error('Pay EMI Error:', err);
      res.status(500).json({ message: 'Server error paying EMI.' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const deleted = await dbService.deleteLoan(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: 'Loan not found or unauthorized.' });
      }

      res.json({ message: 'Loan deleted successfully.', loan: deleted });
    } catch (err) {
      console.error('Delete Loan Error:', err);
      res.status(500).json({ message: 'Server error deleting loan.' });
    }
  }
};

module.exports = loanController;
