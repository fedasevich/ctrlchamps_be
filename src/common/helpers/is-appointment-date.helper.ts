import { convertWeekdayToNumber } from 'src/common/helpers/convert-weekday-to-number.helper';

export const isAppointmentDate = (
  weekday: string,
  selectedDate: Date,
): boolean => {
  const weekdayNumbers = JSON.parse(weekday).map((day: string): number =>
    convertWeekdayToNumber(day),
  );

  return weekdayNumbers.includes(selectedDate.getDay());
};
