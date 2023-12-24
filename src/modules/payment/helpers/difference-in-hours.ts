import { differenceInSeconds } from 'date-fns';

export function getHourDifference(startDate: Date, endDate: Date): number {
  const diffInSeconds = differenceInSeconds(endDate, startDate);
  const timeInHours = (diffInSeconds / 3600) % 24;

  return timeInHours;
}
