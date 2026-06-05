const dbService = require('../services/dbService');

// Check and process recurring transactions
async function processRecurringTransactions() {
  try {
    const recurringList = await dbService.getRecurringTransactions();
    const todayStr = new Date().toISOString().split('T')[0];
    
    let processedCount = 0;

    for (const t of recurringList) {
      if (t.nextOccurrence && t.nextOccurrence <= todayStr) {
        console.log(`[Scheduler] Processing recurring transaction: ${t.description || t.category} for User: ${t.userId}`);

        // 1. Create the cloned transaction representing the payment event
        await dbService.createTransaction({
          userId: t.userId,
          type: t.type,
          category: t.category,
          amount: t.amount,
          date: t.nextOccurrence, // Keep the date as the due date
          description: t.description ? `Recurring: ${t.description}` : `Recurring ${t.type}`,
          source: t.source,
          isRecurring: false // Cloned transaction itself is not a template
        });

        // 2. Compute the next occurrence date
        const nextDate = new Date(t.nextOccurrence);
        if (t.recurringInterval === 'daily') nextDate.setDate(nextDate.getDate() + 1);
        else if (t.recurringInterval === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (t.recurringInterval === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else if (t.recurringInterval === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
        
        const nextOccurrenceStr = nextDate.toISOString().split('T')[0];

        // 3. Update the template with the next occurrence
        await dbService.updateTransaction(t._id || t.id, t.userId, {
          nextOccurrence: nextOccurrenceStr
        });

        processedCount++;
      }
    }

    if (processedCount > 0) {
      console.log(`[Scheduler] Completed. Processed ${processedCount} recurring transactions.`);
    }
  } catch (err) {
    console.error('[Scheduler Error] Processing recurring transactions:', err);
  }
}

// In-memory notifications queue for browser notifications
const alertNotifications = [];

async function checkUpcomingBills() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Check next 3 days
    const alertLimit = new Date();
    alertLimit.setDate(alertLimit.getDate() + 3);
    const alertLimitStr = alertLimit.toISOString().split('T')[0];

    // Since SQLite/Mongo structure is encapsulated, we will fetch users and check their bills.
    // For simplicity, we fetch all users and check their reminders.
    const users = await dbService.getAllUsers();
    
    for (const u of users) {
      const reminders = await dbService.getReminders(u._id || u.id);
      
      reminders.forEach(r => {
        if (!r.isPaid && r.dueDate >= todayStr && r.dueDate <= alertLimitStr) {
          const alertMsg = `Bill "${r.title}" of ₹${r.amount} is due on ${r.dueDate}!`;
          const exists = alertNotifications.some(n => n.userId === u._id || n.userId === u.id && n.reminderId === (r._id || r.id).toString() && n.dueDate === r.dueDate);
          
          if (!exists) {
            alertNotifications.push({
              id: Math.random().toString(36).substring(2),
              userId: (u._id || u.id).toString(),
              reminderId: (r._id || r.id).toString(),
              title: 'Upcoming Bill Due Reminder',
              message: alertMsg,
              dueDate: r.dueDate,
              createdAt: new Date().toISOString()
            });
            console.log(`[Scheduler Bill Alert] Sent alert to user ${u.name} for bill: ${r.title}`);
          }
        }
      });
    }
  } catch (err) {
    console.error('[Scheduler Error] Checking bill reminders:', err);
  }
}

// Initialize the scheduler interval
function startScheduler() {
  console.log('[Scheduler] Background worker initialized.');
  
  // Run on startup
  setTimeout(() => {
    processRecurringTransactions();
    checkUpcomingBills();
  }, 5000);

  // Run every 30 minutes
  setInterval(() => {
    processRecurringTransactions();
    checkUpcomingBills();
  }, 30 * 60 * 1000);
}

module.exports = {
  startScheduler,
  getNotifications: (userId) => alertNotifications.filter(n => n.userId === userId.toString()),
  clearNotification: (id) => {
    const index = alertNotifications.findIndex(n => n.id === id);
    if (index !== -1) {
      alertNotifications.splice(index, 1);
      return true;
    }
    return false;
  }
};
