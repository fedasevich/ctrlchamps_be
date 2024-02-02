import { convertWeekdayToNumber } from 'src/common/helpers/convert-weekday-to-number.helper';

export const isAppointmentDate = (
  weekday: string,
  selectedDate: Date,
  pausedAt: Date | null,
): boolean => {
  const weekdayNumbers = JSON.parse(weekday).map((day: string): number =>
    convertWeekdayToNumber(day),
  );

  if (pausedAt) {
    return (
      pausedAt >= selectedDate && weekdayNumbers.includes(selectedDate.getDay())
    );
  }

  return weekdayNumbers.includes(selectedDate.getDay());
};
