function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getToday() {
  return formatDate(new Date());
}

function getTodayDate() {
  return new Date();
}

function getDateBefore(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

function getRecentDates(count) {
  const dates = [];
  for (let i = 0; i < count; i++) {
    dates.push(getDateBefore(i));
  }
  return dates;
}

function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

function isTimeAfter(currentDate, targetTimeStr) {
  const { hours, minutes } = parseTime(targetTimeStr);
  const currentHours = currentDate.getHours();
  const currentMinutes = currentDate.getMinutes();

  if (currentHours > hours) return true;
  if (currentHours === hours && currentMinutes >= minutes) return true;
  return false;
}

module.exports = {
  formatDate,
  getToday,
  getTodayDate,
  getDateBefore,
  getRecentDates,
  parseTime,
  isTimeAfter
};
