const dbService = require('../services/dbService');

const investmentController = {
  getInvestments: async (req, res) => {
    try {
      const userId = req.user.id;
      const investments = await dbService.getInvestments(userId);
      
      // Calculate stats
      let totalCostBasis = 0;
      let totalCurrentValue = 0;

      const items = investments.map(inv => {
        const costBasis = inv.buyPrice * inv.quantity;
        const currentValue = inv.currentPrice * inv.quantity;
        const profitLoss = currentValue - costBasis;
        const profitLossPct = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
        
        totalCostBasis += costBasis;
        totalCurrentValue += currentValue;

        return {
          id: inv._id || inv.id,
          assetType: inv.assetType,
          name: inv.name,
          quantity: inv.quantity,
          buyPrice: inv.buyPrice,
          currentPrice: inv.currentPrice,
          purchaseDate: inv.purchaseDate,
          costBasis,
          currentValue,
          profitLoss,
          profitLossPct
        };
      });

      const overallProfitLoss = totalCurrentValue - totalCostBasis;
      const overallProfitLossPct = totalCostBasis > 0 ? (overallProfitLoss / totalCostBasis) * 100 : 0;

      res.json({
        investments: items,
        summary: {
          totalCostBasis,
          totalCurrentValue,
          overallProfitLoss,
          overallProfitLossPct
        }
      });
    } catch (err) {
      console.error('Get Investments Error:', err);
      res.status(500).json({ message: 'Server error fetching investments.' });
    }
  },

  create: async (req, res) => {
    try {
      const userId = req.user.id;
      const { assetType, name, quantity, buyPrice, currentPrice, purchaseDate } = req.body;

      if (!assetType || !name || !quantity || !buyPrice || !purchaseDate) {
        return res.status(400).json({ message: 'Asset type, name, quantity, buyPrice, and purchaseDate are required.' });
      }

      const investment = await dbService.createInvestment(userId, {
        assetType,
        name,
        quantity: parseFloat(quantity),
        buyPrice: parseFloat(buyPrice),
        currentPrice: currentPrice ? parseFloat(currentPrice) : parseFloat(buyPrice),
        purchaseDate
      });

      res.status(201).json(investment);
    } catch (err) {
      console.error('Create Investment Error:', err);
      res.status(500).json({ message: 'Server error creating investment.' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      if (updates.quantity) updates.quantity = parseFloat(updates.quantity);
      if (updates.buyPrice) updates.buyPrice = parseFloat(updates.buyPrice);
      if (updates.currentPrice) updates.currentPrice = parseFloat(updates.currentPrice);

      const updated = await dbService.updateInvestment(id, userId, updates);
      if (!updated) {
        return res.status(404).json({ message: 'Investment not found or unauthorized.' });
      }

      res.json(updated);
    } catch (err) {
      console.error('Update Investment Error:', err);
      res.status(500).json({ message: 'Server error updating investment.' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const deleted = await dbService.deleteInvestment(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: 'Investment not found or unauthorized.' });
      }

      res.json({ message: 'Investment deleted successfully.', investment: deleted });
    } catch (err) {
      console.error('Delete Investment Error:', err);
      res.status(500).json({ message: 'Server error deleting investment.' });
    }
  }
};

module.exports = investmentController;
