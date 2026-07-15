const cron = require('node-cron');
const { runBvMatching } = require('./jobs/bvMatching');

// Weekly BV matching — Sunday 00:30 IST. Unmatched BV is never reset, so anything left over
// after this run (or capped out) simply carries forward into next week's run automatically.
function startScheduler() {
  cron.schedule('30 0 * * 0', async () => {
    console.log('[scheduler] Running weekly BV matching…');
    try {
      const result = await runBvMatching({ force: false });
      console.log('[scheduler] Weekly BV matching complete:', result.skipped ? result.message : `${result.users_processed} users, ₹${result.total_bonus_paid} paid`);
    } catch (err) {
      console.error('[scheduler] Weekly BV matching failed:', err);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('[scheduler] Weekly BV matching cron registered (Sunday 00:30 IST)');
}

module.exports = { startScheduler };
