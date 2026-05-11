export const isWorkingDay = (date:any) => {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday

  if (day === 0) return false;

  // ✅ All other days are working
  return true;
};


export const getWorkingDaysInMonth = (year:any, month:any) => {
  const totalDays = new Date(year, month, 0).getDate();
  let workingDays = 0;

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month - 1, d);
    if (isWorkingDay(date)) {
      workingDays++;
    }
  }

  return workingDays;
};

export function getWorkingDaysBetween(start:any, end:any) {
  let count = 0;
  const current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    const day = current.getDay();

    // Skip Sunday (0) & Saturday (6)
    if (day !== 0) {
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}