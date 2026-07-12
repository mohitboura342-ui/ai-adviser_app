import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import { GoogleGenAI, Type } from '@google/genai';
import { format, subMonths, isSameMonth, parseISO } from 'date-fns';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import fs from 'fs';

// Helper to get Admin Firestore
export const getAdminDb = () => {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)') {
        return getFirestore(getApps()[0], config.firestoreDatabaseId);
      }
    }
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to read firebase config:", e);
    }
  }
  return getFirestore();
};
if (process.env.NODE_ENV !== "production" || !getApps().length) {
  initializeApp({
    projectId: "gleaming-faculty-nsjh2"
  });
}

const db = new Database('finance.db');

// Drop old tables without user_id to avoid migration issues in dev
db.exec(`
  DROP TABLE IF EXISTS transactions;
  DROP TABLE IF EXISTS goals;
`);

// Initialize database with user_id
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    current_savings REAL DEFAULT 0,
    target_date TEXT NOT NULL
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Middleware
  const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split('Bearer ')[1];
    
    if (token === 'guest') {
      (req as any).user = { uid: 'guest_user' };
      return next();
    }

    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      (req as any).user = decodedToken;
      next();
    } catch (error) {
      console.error("Error verifying token:", error);
      res.status(401).json({ error: 'Unauthorized' });
    }
  };

  const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // First run the standard auth check
    await requireAuth(req, res, async () => {
      const user = (req as any).user;
      if (user.uid === 'guest_user') return res.status(403).json({ error: 'Forbidden' });
      
      const firestore = getAdminDb();
      try {
        // Allow the default developer email
        if (user.email === 'mohitboura342@gmail.com') return next();

        // Check users collection for role === 'admin'
        const userDoc = await firestore.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data()?.role === 'admin') {
          return next();
        }

        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      } catch (error) {
        console.error("Error verifying admin role:", error);
        res.status(500).json({ error: 'Internal Server Error during admin verification' });
      }
    });
  };

  // --- API Routes ---

  // User & Referral Management
  app.post('/api/sync-user', requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (user.uid === 'guest_user') return res.json({ success: true, guest: true });
    
    const { referralCode } = req.body;
    const firestore = getAdminDb();
    const userRef = firestore.collection('users').doc(user.uid);
    
    try {
      const doc = await userRef.get();
      if (!doc.exists) {
        // Generate a random 6 char code
        const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        await userRef.set({
          uid: user.uid,
          email: user.email || '',
          referralCode: myReferralCode,
          referredBy: referralCode || '',
          paymentStatus: 'pending',
          adviserUnlocked: false,
          unlockSource: 'None',
          paymentId: '',
          referralCount: 0,
          successfulReferrals: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        if (referralCode) {
          // Increment the referral count for the referrer
          const referrerSnapshot = await firestore.collection('users').where('referralCode', '==', referralCode).get();
          if (!referrerSnapshot.empty) {
            const referrerDoc = referrerSnapshot.docs[0];
            await referrerDoc.ref.update({
              referralCount: (referrerDoc.data().referralCount || 0) + 1
            });
          }
        }
      }
      res.json({ success: true });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: 'Failed to sync user' });
    }
  });

  app.post('/api/pay/simulate', requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (user.uid === 'guest_user') return res.status(403).json({ error: 'Guest cannot pay' });
    
    const { transactionId } = req.body;
    const firestore = getAdminDb();
    const userRef = firestore.collection('users').doc(user.uid);
    
    try {
      const userDoc = await userRef.get();
      if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
      
      const userData = userDoc.data();
      if (userData?.adviserUnlocked) {
        return res.json({ success: true, message: 'Already unlocked' });
      }

      const pId = transactionId || `txn_${Date.now()}`;
      
      // Update payment status to pending in user doc
      await userRef.update({
        paymentStatus: 'pending',
        updatedAt: new Date().toISOString()
      });

      // Log payment as pending
      await firestore.collection('payments').doc(pId).set({
        id: pId,
        orderId: `sim_${Date.now()}`,
        uid: user.uid,
        email: userData?.email || '',
        amount: 49,
        status: 'pending',
        date: new Date().toISOString()
      });
      
      res.json({ success: true, message: 'Payment submitted for verification. Please wait for admin approval.' });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: 'Payment submission failed' });
    }
  });

  app.get('/api/user/profile', requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (user.uid === 'guest_user') {
      return res.json({
        uid: 'guest',
        referralCode: 'GUEST123',
        referralCount: 0,
        successfulReferrals: 0,
        adviserUnlocked: false
      });
    }

    try {
      const firestore = getAdminDb();
      const userDoc = await firestore.collection('users').doc(user.uid).get();
      if (!userDoc.exists) return res.status(404).json({ error: 'Not found' });
      res.json(userDoc.data());
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  });

  // Admin Endpoints
  app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    const firestore = getAdminDb();
    const stats = {
      totalUsers: 0,
      aiUnlocked: 0,
      lockedUsers: 0,
      totalRevenue: 0,
      successfulPayments: 0,
      referralRewards: 0,
      pendingPayments: 0,
      failedPayments: 0
    };

    try {
      // Load users collection with try/catch
      try {
        const usersSnap = await firestore.collection('users').get();
        stats.totalUsers = usersSnap.size;
        
        usersSnap.forEach(doc => {
          const d = doc.data();
          if (d.adviserUnlocked) stats.aiUnlocked++;
          if (d.unlockSource === 'Referral') stats.referralRewards++;
        });
        stats.lockedUsers = stats.totalUsers - stats.aiUnlocked;
      } catch (err: any) {
        if (process.env.NODE_ENV !== "production") console.warn("Failed to load users for stats:", err.message);
      }

      // Load payments collection with try/catch
      try {
        const paymentsSnap = await firestore.collection('payments').get();
        paymentsSnap.forEach(doc => {
          const p = doc.data();
          if (p.status === 'completed') {
            stats.totalRevenue += p.amount || 0;
            stats.successfulPayments++;
          } else if (p.status === 'pending') {
            stats.pendingPayments++;
          } else if (p.status === 'rejected' || p.status === 'failed') {
            stats.failedPayments++;
          }
        });
      } catch (err: any) {
        if (process.env.NODE_ENV !== "production") console.warn("Failed to load payments for stats:", err.message);
      }

      res.json(stats);
    } catch (e: any) {
      if (process.env.NODE_ENV !== "production") console.error("Critical error in /api/admin/stats:", e.message);
      res.status(500).json({ error: 'Failed to fetch some stats, but server caught the error.', details: e.message });
    }
  });

  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    const firestore = getAdminDb();
    try {
      const snapshot = await firestore.collection('users').orderBy('createdAt', 'desc').get();
      const users = snapshot.docs.map(doc => doc.data());
      res.json(users);
    } catch (e: any) {
      if (process.env.NODE_ENV !== "production") console.error("Error getting users:", e.message);
      res.status(500).json({ error: 'Failed to get users', details: e.message });
    }
  });

  app.post('/api/admin/unlock', requireAdmin, async (req, res) => {
    const { uid } = req.body;
    const firestore = getAdminDb();
    try {
      await firestore.collection('users').doc(uid).update({
        adviserUnlocked: true,
        paymentStatus: 'completed',
        unlockSource: 'Manual',
        updatedAt: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to unlock user' });
    }
  });

  app.get('/api/admin/payments', requireAdmin, async (req, res) => {
    const firestore = getAdminDb();
    try {
      const snapshot = await firestore.collection('payments').orderBy('date', 'desc').get();
      const payments = snapshot.docs.map(doc => doc.data());
      res.json(payments);
    } catch (e: any) {
      if (process.env.NODE_ENV !== "production") console.error("Error getting payments:", e.message);
      res.status(500).json({ error: 'Failed to get payments', details: e.message });
    }
  });

  app.post('/api/admin/payments/approve', requireAdmin, async (req, res) => {
    const { paymentId } = req.body;
    const firestore = getAdminDb();
    try {
      const paymentRef = firestore.collection('payments').doc(paymentId);
      const paymentDoc = await paymentRef.get();
      if (!paymentDoc.exists) return res.status(404).json({ error: 'Payment not found' });
      
      const paymentData = paymentDoc.data()!;
      if (paymentData.status === 'completed') {
        return res.json({ success: true, message: 'Already approved' });
      }

      const uid = paymentData.uid;
      const userRef = firestore.collection('users').doc(uid);
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      // Update payment
      await paymentRef.update({
        status: 'completed',
        approvedAt: new Date().toISOString()
      });

      // Log to audit log
      await firestore.collection('audit_logs').add({
        action: 'Approve Payment',
        paymentId,
        uid,
        adminUid: (req as any).user.uid,
        date: new Date().toISOString()
      });

      // Update User
      if (userData) {
        await userRef.update({
          paymentStatus: 'completed',
          adviserUnlocked: true,
          paymentId: paymentId,
          unlockSource: 'Self Payment',
          updatedAt: new Date().toISOString()
        });

        // Handle referral rewards
        if (userData.referredBy) {
          const referrerSnapshot = await firestore.collection('users').where('referralCode', '==', userData.referredBy).get();
          if (!referrerSnapshot.empty) {
            const referrerDoc = referrerSnapshot.docs[0];
            const referrerData = referrerDoc.data();
            
            const updates: any = {
              successfulReferrals: (referrerData.successfulReferrals || 0) + 1
            };
            
            if (!referrerData.adviserUnlocked) {
              updates.adviserUnlocked = true;
              updates.unlockSource = 'Referral';
              updates.updatedAt = new Date().toISOString();
            }
            
            await referrerDoc.ref.update(updates);
          }
        }
      }

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to approve payment' });
    }
  });

  app.post('/api/admin/payments/reject', requireAdmin, async (req, res) => {
    const { paymentId } = req.body;
    const firestore = getAdminDb();
    try {
      const paymentRef = firestore.collection('payments').doc(paymentId);
      const paymentDoc = await paymentRef.get();
      if (!paymentDoc.exists) return res.status(404).json({ error: 'Payment not found' });
      
      const paymentData = paymentDoc.data()!;

      await paymentRef.update({
        status: 'rejected',
        rejectedAt: new Date().toISOString()
      });

      // Log to audit log
      await firestore.collection('audit_logs').add({
        action: 'Reject Payment',
        paymentId,
        uid: paymentData.uid,
        adminUid: (req as any).user.uid,
        date: new Date().toISOString()
      });

      const userRef = firestore.collection('users').doc(paymentData.uid);
      await userRef.update({
        paymentStatus: 'rejected',
        updatedAt: new Date().toISOString()
      });

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to reject payment' });
    }
  });


  app.get('/api/admin/referrals', requireAdmin, async (req, res) => {
    const firestore = getAdminDb();
    try {
      // Find users who were referred by someone
      const snapshot = await firestore.collection('users').where('referredBy', '!=', '').get();
      const referrals = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: d.uid,
          referrer: d.referredBy,
          user: d.email,
          date: d.createdAt,
          paymentStatus: d.paymentStatus,
          adviserUnlocked: d.adviserUnlocked
        };
      });
      res.json(referrals);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to get referrals' });
    }
  });

  app.get('/api/admin/audit', requireAdmin, async (req, res) => {
    const firestore = getAdminDb();
    try {
      const snapshot = await firestore.collection('audit_logs').orderBy('date', 'desc').get();
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(logs);
    } catch (e: any) {
      if (process.env.NODE_ENV !== "production") console.error("Error getting audit logs:", e.message);
      res.status(500).json({ error: 'Failed to get audit logs', details: e.message });
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Transactions
  app.get('/api/transactions', requireAuth, (req, res) => {
    const userId = (req as any).user.uid;
    const stmt = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC');
    const transactions = stmt.all(userId);
    res.json(transactions);
  });

  app.post('/api/transactions', requireAuth, (req, res) => {
    const userId = (req as any).user.uid;
    const { type, amount, category, date, description } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO transactions (user_id, type, amount, category, date, description) VALUES (?, ?, ?, ?, ?, ?)');
      const info = stmt.run(userId, type, amount, category, date, description);
      res.json({ id: info.lastInsertRowid, ...req.body });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to add transaction' });
    }
  });

  app.delete('/api/transactions/:id', requireAuth, (req, res) => {
    const userId = (req as any).user.uid;
    try {
      const stmt = db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?');
      stmt.run(req.params.id, userId);
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to delete transaction' });
    }
  });

  // Summary / KPIs
  app.get('/api/summary', requireAuth, (req, res) => {
    const userId = (req as any).user.uid;
    try {
      const txs = db.prepare('SELECT * FROM transactions WHERE user_id = ?').all(userId) as any[];
      let totalIncome = 0;
      let totalExpenses = 0;
      const expensesByCategory: Record<string, number> = {};

      const now = new Date();
      let thisMonthIncome = 0;
      let thisMonthExpenses = 0;
      let lastMonthIncome = 0;
      let lastMonthExpenses = 0;

      const lastMonth = subMonths(now, 1);

      txs.forEach((t) => {
        const txDate = parseISO(t.date);
        
        if (t.type === 'income') {
          totalIncome += t.amount;
          if (isSameMonth(txDate, now)) thisMonthIncome += t.amount;
          if (isSameMonth(txDate, lastMonth)) lastMonthIncome += t.amount;
        } else {
          totalExpenses += t.amount;
          expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
          if (isSameMonth(txDate, now)) thisMonthExpenses += t.amount;
          if (isSameMonth(txDate, lastMonth)) lastMonthExpenses += t.amount;
        }
      });

      const totalSavings = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
      
      const thisMonthSavings = thisMonthIncome - thisMonthExpenses;

      res.json({
        totalIncome,
        totalExpenses,
        totalSavings,
        savingsRate,
        expensesByCategory,
        thisMonthIncome,
        thisMonthExpenses,
        thisMonthSavings,
        lastMonthExpenses,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to fetch summary' });
    }
  });

  // Goals
  app.get('/api/goals', requireAuth, (req, res) => {
    const userId = (req as any).user.uid;
    const goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').all(userId);
    res.json(goals);
  });

  app.post('/api/goals', requireAuth, (req, res) => {
    const userId = (req as any).user.uid;
    const { name, amount, target_date, current_savings } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO goals (user_id, name, amount, target_date, current_savings) VALUES (?, ?, ?, ?, ?)');
      const info = stmt.run(userId, name, amount, target_date, current_savings || 0);
      res.json({ id: info.lastInsertRowid, ...req.body });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to add goal' });
    }
  });
  
  app.delete('/api/goals/:id', requireAuth, (req, res) => {
    const userId = (req as any).user.uid;
    try {
      const stmt = db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?');
      stmt.run(req.params.id, userId);
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to delete goal' });
    }
  });

  // Forecasting (Simple Linear Regression / Moving average equivalent)
  app.get('/api/forecast', requireAuth, (req, res) => {
    const userId = (req as any).user.uid;
    try {
      const expenses = db.prepare("SELECT date, amount, category FROM transactions WHERE type = 'expense' AND user_id = ? ORDER BY date ASC").all(userId) as any[];
      
      const monthTotals: Record<string, number> = {};
      const catTotals: Record<string, number> = {};
      
      expenses.forEach(e => {
        const monthKey = e.date.substring(0, 7); // YYYY-MM
        monthTotals[monthKey] = (monthTotals[monthKey] || 0) + e.amount;
        catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
      });

      const months = Object.keys(monthTotals).sort();
      let forecastNextMonth = 0;

      if (months.length > 0) {
        const recentMonths = months.slice(-3);
        const sum = recentMonths.reduce((acc, m) => acc + monthTotals[m], 0);
        forecastNextMonth = sum / recentMonths.length;
      }

      let totalCatExpenses = Object.values(catTotals).reduce((a,b) => a+b, 0);
      const forecastByCategory = Object.keys(catTotals).map(cat => ({
        category: cat,
        forecast: totalCatExpenses > 0 ? (catTotals[cat] / totalCatExpenses) * forecastNextMonth : 0
      }));

      res.json({
        forecastNextMonth,
        forecastByCategory
      });
    } catch (e) {
       res.status(500).json({ error: 'Failed to generate forecast' });
    }
  });

  // AI Advisor
  app.post('/api/advisor/chat', requireAuth, async (req, res) => {
    const userId = (req as any).user.uid;
    try {
      const { message } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is missing' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      // Get user context
      const summary = db.prepare('SELECT type, amount, category FROM transactions WHERE user_id = ?').all(userId) as any[];
      let income = 0;
      let expenses = 0;
      const categories: Record<string, number> = {};
      summary.forEach(tx => {
        if (tx.type === 'income') income += tx.amount;
        else {
          expenses += tx.amount;
          categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
        }
      });

      const contextStr = `User Financial Context: Total Income: ${income}, Total Expenses: ${expenses}, Spending by Category: ${JSON.stringify(categories)}. Provide helpful, concise financial advice. Do not provide certified financial advice.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `${contextStr}\n\nUser question: ${message}`,
      });

      res.json({ text: response.text });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'AI generation failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
