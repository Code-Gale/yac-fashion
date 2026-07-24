/**
 * Parse a "to" date filter value into an inclusive upper bound.
 *
 * Date-only strings (e.g. "2026-07-24", as sent by <input type="date">)
 * parse to midnight UTC, which would silently exclude every record
 * created later that same day. Extend the bound to the end of that day
 * so range filters treat "to" as inclusive. Full timestamps/ISO strings
 * with an explicit time component are left as-is.
 */
const endOfDayInclusive = (value) => {
  const date = new Date(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    date.setUTCHours(23, 59, 59, 999);
  }
  return date;
};

module.exports = { endOfDayInclusive };
