export const convertWeekdayToNumber = (weekday: string): number => {
  const mapping = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  return mapping[weekday];
};
