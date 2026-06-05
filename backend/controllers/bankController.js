const dbService = require('../services/dbService');

const MOCK_INSTITUTIONS = [
  { id: 'chase', name: 'Chase Bank', logo: '🏦', country: 'US' },
  { id: 'boa', name: 'Bank of America', logo: '🏦', country: 'US' },
  { id: 'icici', name: 'ICICI Bank', logo: '🏛️', country: 'IN' },
  { id: 'sbi', name: 'State Bank of India', logo: '🏛️', country: 'IN' },
  { id: 'barclays', name: 'Barclays', logo: '🏢', country: 'UK' }
];

const bankController = {
  getInstitutions: async (req, res) => {
    try {
      res.json(MOCK_INSTITUTIONS);
    } catch (err) {
      console.error('Get Institutions Error:', err);
      res.status(500).json({ message: 'Server error fetching institutions.' });
    }
  },

  linkAccount: async (req, res) => {
    try {
      const { institutionId, username } = req.body;
      const userId = req.user.id;

      if (!institutionId || !username) {
        return res.status(400).json({ message: 'Institution ID and account username are required.' });
      }

      const inst = MOCK_INSTITUTIONS.find(i => i.id === institutionId);
      if (!inst) {
        return res.status(404).json({ message: 'Institution not found.' });
      }

      // Generate a batch of mock transactions to import
      const today = new Date();
      const formatOffsetDate = (daysAgo) => {
        const d = new Date();
        d.setDate(today.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
      };

      const mockTxs = [
        { type: 'income', category: 'Income', amount: 45000, date: formatOffsetDate(3), description: 'Salary Disbursal', source: 'Salary' },
        { type: 'expense', category: 'Food', amount: 840, date: formatOffsetDate(2), description: 'Starbucks Coffee & Snacks' },
        { type: 'expense', category: 'Shopping', amount: 3200, date: formatOffsetDate(2), description: 'Amazon.in Shopping Order' },
        { type: 'expense', category: 'Travel', amount: 450, date: formatOffsetDate(1), description: 'Uber Ride Citywide' },
        { type: 'expense', category: 'Entertainment', amount: 199, date: formatOffsetDate(1), description: 'Spotify Subscription' }
      ];

      // Add to database
      const imported = [];
      for (const tx of mockTxs) {
        const created = await dbService.createTransaction({
          userId,
          type: tx.type,
          category: tx.category,
          amount: tx.amount,
          date: tx.date,
          description: tx.description,
          source: tx.source || null,
          isRecurring: false
        });
        imported.push(created);
      }

      res.json({
        message: `Successfully connected to ${inst.name}! Imported 5 ledger transactions and synced account balance.`,
        account: {
          institution: inst.name,
          accountNumber: `XXXX-XXXX-8924`,
          balance: 87400,
          importedCount: imported.length
        }
      });
    } catch (err) {
      console.error('Link Account Error:', err);
      res.status(500).json({ message: 'Server error linking bank account.' });
    }
  }
};

module.exports = bankController;
