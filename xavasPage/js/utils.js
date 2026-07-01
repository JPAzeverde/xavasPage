/**
 * xavasPage — Utility Functions
 * Codename: TOOLKIT
 */

/**
 * Returns a date string in YYYY-MM-DD format.
 * @param {Date} date
 * @returns {string}
 */
function formatDateYMD(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the Monday of the current week.
 * @returns {Date}
 */
function getMondayOfCurrentWeek() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const diff = (day === 0 ? 6 : day - 1); // distance to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Returns array of 7 Date objects for Monday to Sunday of current week.
 * @returns {Date[]}
 */
function getCurrentWeekDays() {
  const monday = getMondayOfCurrentWeek();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/**
 * Checks if two date strings (YYYY-MM-DD) represent the same day.
 */
function isSameDay(dateStr1, dateStr2) {
  return dateStr1 === dateStr2;
}

/**
 * Converts a Date object to YYYY-MM-DD string.
 */
function dateToYMD(date) {
  return formatDateYMD(date);
}