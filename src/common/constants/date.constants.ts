import { utcToZonedTime } from 'date-fns-tz';
import { UTC_TIMEZONE } from 'src/modules/virtual-assessment/constants/virtual-assessment.constant';

export const TODAY_DATE = utcToZonedTime(new Date(), UTC_TIMEZONE);
export const DATE_FORMAT = 'yyyy-MM-dd';
export const ZERO = 0;
