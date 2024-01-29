export function findNextDay(startDate: Date, daysList: string[]): string {
  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const currentDay = daysOfWeek[new Date(startDate).getDay()];

  const currentIndex = daysOfWeek.indexOf(currentDay);

  let nextDayIndex = currentIndex;
  while (true) {
    nextDayIndex = (nextDayIndex + 1) % 7;
    if (daysList.includes(daysOfWeek[nextDayIndex])) {
      return daysOfWeek[nextDayIndex];
    }
  }
}
