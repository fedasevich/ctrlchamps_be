export const MINIMUM_BALANCE = 0;
export const PAGINATION_LIMIT = 10;

export const APPOINTMENT_EXAMPLE = {
  id: '249a967c-d924-4626-bf8f-df422594841d',
  userId: 'cb630ef1-cc17-4e79-9cc8-134c64b35857',
  caregiverInfoId: 'b4a7e632-9852-4a38-9ed7-7269249c4c7e',
  name: 'Sample Appointment 2',
  type: 'Recurring',
  status: 'Accepted',
  details: 'Another sample details for the appointment',
  payment: 32,
  location: 'Another Sample Location',
  activityNote: 'Another sample activity notes',
  diagnosisNote: 'Another sample diagnosis notes',
  capabilityNote: 'Another sample capability notes',
  startDate: '2023-12-14T18:00:00.000Z',
  endDate: '2023-12-14T20:00:00.000Z',
  timezone: 'America/New_York',
  weekday: '["Tuesday","Thursday"]',
  caregiverInfo: {
    id: 'b4a7e632-9852-4a38-9ed7-7269249c4c7e',
    timeZone: 'America/Chicago',
    user: {
      id: 'cb630ef1-cc17-4e79-9cc8-134c64b35857',
      firstName: 'Yurii',
      lastName: 'Fedas',
    },
  },
  user: {
    id: 'cb630ef1-cc17-4e79-9cc8-134c64b35857',
    firstName: 'Yurii',
    lastName: 'Fedas',
  },
  seekerActivities: [
    {
      appointmentId: '249a967c-d924-4626-bf8f-df422594841d',
      activityId: '4c4a8e49-7199-42db-b902-39996c3b0888',
      answer: 'Needs Some Help',
      activity: {
        id: '4c4a8e49-7199-42db-b902-39996c3b0888',
        name: 'Dressing',
      },
    },
  ],
  seekerCapabilities: [
    {
      appointmentId: '249a967c-d924-4626-bf8f-df422594841d',
      capabilityId: 'a98a37b4-0a8b-4763-bf7a-21c1347186d5',
      capability: {
        id: 'a98a37b4-0a8b-4763-bf7a-21c1347186d5',
        name: 'Turning doorknobs',
      },
    },
  ],
  seekerDiagnoses: [
    {
      appointmentId: '249a967c-d924-4626-bf8f-df422594841d',
      diagnosisId: '468f2c39-4f0c-4a1a-89d4-acf3e8eeabcb',
      diagnosis: {
        id: '468f2c39-4f0c-4a1a-89d4-acf3e8eeabcb',
        name: 'Lung Disease, COPD',
      },
    },
  ],
  seekerTasks: [
    {
      appointmentId: '249a967c-d924-4626-bf8f-df422594841d',
      name: 'Do laundry',
    },
    {
      appointmentId: '249a967c-d924-4626-bf8f-df422594841d',
      name: 'Prepare meals',
    },
  ],
};

export const APPOINTMENTS_EXAMPLE = [
  {
    id: '349a7bbf-d854-41c8-82d0-017e1d9dbf25',
    userId: 'cb630ef1-cc17-4e79-9cc8-134c64b35857',
    caregiverInfoId: 'b4a7e632-9852-4a38-9ed7-7269249c4c7e',
    name: 'Sample Appointment 2',
    type: 'Recurring',
    status: 'Accepted',
    details: 'Another sample details for the appointment',
    payment: 32,
    location: 'Another Sample Location',
    activityNote: 'Another sample activity notes',
    diagnosisNote: 'Another sample diagnosis notes',
    capabilityNote: 'Another sample capability notes',
    startDate: '2023-12-13T14:00:00.000Z',
    endDate: '2023-12-13T16:00:00.000Z',
    timezone: 'America/New_York',
    weekday: '["Tuesday","Thursday"]',
    caregiverInfo: {
      id: 'b4a7e632-9852-4a38-9ed7-7269249c4c7e',
      timeZone: 'America/Chicago',
    },
    user: {
      id: 'cb630ef1-cc17-4e79-9cc8-134c64b35857',
      firstName: 'Yurii',
      lastName: 'Fedas',
    },
  },
  {
    id: '3b80bc8c-2557-4f00-b31c-004803b85633',
    userId: 'cb630ef1-cc17-4e79-9cc8-134c64b35857',
    caregiverInfoId: 'b4a7e632-9852-4a38-9ed7-7269249c4c7e',
    name: 'Sample Appointment 2',
    type: 'Recurring',
    status: 'Accepted',
    details: 'Another sample details for the appointment',
    payment: 32,
    location: 'Another Sample Location',
    activityNote: 'Another sample activity notes',
    diagnosisNote: 'Another sample diagnosis notes',
    capabilityNote: 'Another sample capability notes',
    startDate: '2023-12-13T10:00:00.000Z',
    endDate: '2023-12-13T12:00:00.000Z',
    timezone: 'America/New_York',
    weekday: '["Tuesday","Thursday"]',
    caregiverInfo: {
      id: 'b4a7e632-9852-4a38-9ed7-7269249c4c7e',
      timeZone: 'America/Chicago',
    },
    user: {
      id: 'cb630ef1-cc17-4e79-9cc8-134c64b35857',
      firstName: 'Yurii',
      lastName: 'Fedas',
    },
  },
  {
    id: '8462d156-94fb-4dcc-bae2-2651a5029cf3',
    userId: 'cb630ef1-cc17-4e79-9cc8-134c64b35857',
    caregiverInfoId: 'b4a7e632-9852-4a38-9ed7-7269249c4c7e',
    name: 'Sample Appointment 2',
    type: 'Recurring',
    status: 'Accepted',
    details: 'Another sample details for the appointment',
    payment: 32,
    location: 'Another Sample Location',
    activityNote: 'Another sample activity notes',
    diagnosisNote: 'Another sample diagnosis notes',
    capabilityNote: 'Another sample capability notes',
    startDate: '2023-12-13T18:00:00.000Z',
    endDate: '2023-12-13T20:00:00.000Z',
    timezone: 'America/New_York',
    weekday: '["Tuesday","Thursday"]',
    caregiverInfo: {
      id: 'b4a7e632-9852-4a38-9ed7-7269249c4c7e',
      timeZone: 'America/Chicago',
    },
    user: {
      id: 'cb630ef1-cc17-4e79-9cc8-134c64b35857',
      firstName: 'Yurii',
      lastName: 'Fedas',
    },
  },
];
