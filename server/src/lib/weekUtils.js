// Monday 00:00 local time of the current calendar week — used for the payout weekly limit,
// which resets every Monday regardless of when in the previous week the last request was made.
function getWeekStartMonday(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  d.setDate(d.getDate() - diff);
  return d;
}

module.exports = { getWeekStartMonday };
