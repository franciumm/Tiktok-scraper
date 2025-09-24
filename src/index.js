
// src/index.js
import cron from 'node-cron';
import { runAnalytics } from './Operate/controller.js';

async function job() {
  try {
    const data = await runAnalytics();
    console.log('✅ Analytics updated:', data);
  } catch (err) {
    console.error('❌ Analytics job error:', err);
  }
}

// run once now and then every hour
job();
cron.schedule('0 * * * *', job);
