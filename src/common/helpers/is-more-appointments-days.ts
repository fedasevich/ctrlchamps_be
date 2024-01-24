import { ONE_DAY } from 'src/common/constants/constants';
import { convertWeekdayToNumber } from 'src/common/helpers/convert-weekday-to-number.helper';

export const isMoreAppointmentDays = (
  endDate: Date,
  weekday: string,
  currentDate: Date,
): boolean => {
  const weekdayNumbers = JSON.parse(weekday).map((day: string): number =>
    convertWeekdayToNumber(day),
  );

  currentDate.setDate(currentDate.getDate() + ONE_DAY);

  while (currentDate.getTime() <= endDate.getTime()) {
    if (weekdayNumbers.includes(currentDate.getDay())) {
      return true;
    }
    currentDate.setDate(currentDate.getDate() + ONE_DAY);
  }

  return false;
};
