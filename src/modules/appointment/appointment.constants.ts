export const MINIMUM_BALANCE = 0;

export const APPOINTMENT_EXAMPLE = {
  id: 'f497754d-06e1-4400-9948-c77981088b77',
  userId: '4a6264dd-9280-4884-bc5d-fc0b9ddf9640',
  caregiverInfoId: '227ee80d-217a-4b1d-9cb5-44d9660f88ad',
  name: '1111111111111111111111111111111111',
  type: 'One time',
  status: 'Pending confirmation',
  details: 'ref',
  payment: 5,
  location: 'California',
  activityNote: 'activityNoteactivityNote',
  diagnosisNote: 'diagnosisNotediagnosisNote',
  capabilityNote: 'capabilityNotecapabilityNote',
  startDate: '2023-11-28T15:30:00.000Z',
  endDate: '2023-11-28T15:30:00.000Z',
  timezone: 'Europe/Kiev',
  weekday: '["Monday","Sunday"]',
  seekerTasks: [
    {
      appointmentId: 'f497754d-06e1-4400-9948-c77981088b77',
      name: 'asd',
    },
    {
      appointmentId: 'f497754d-06e1-4400-9948-c77981088b77',
      name: 'qwe',
    },
    {
      appointmentId: 'f497754d-06e1-4400-9948-c77981088b77',
      name: 'taask',
    },
    {
      appointmentId: 'f497754d-06e1-4400-9948-c77981088b77',
      name: 'tttopTask',
    },
  ],
  caregiverInfo: {
    id: '227ee80d-217a-4b1d-9cb5-44d9660f88ad',
    user: {
      id: '2dc65c36-5112-4901-96b8-2e7520ab57c8',
      firstName: 'Vova',
      lastName: 'Qwerty',
    },
  },
};

export const APPOINTMENTS_EXAMPLE = [
  {
    id: 'f497754d-06e1-4400-9948-c77981088b77',
    userId: '4a6264dd-9280-4884-bc5d-fc0b9ddf9640',
    caregiverInfoId: '227ee80d-217a-4b1d-9cb5-44d9660f88ad',
    name: 'help',
    type: 'One time',
    status: 'Active',
    details: 'ref',
    payment: 5,
    location: 'California',
    activityNote: 'activityNoteactivityNote',
    diagnosisNote: 'diagnosisNotediagnosisNote',
    capabilityNote: 'capabilityNotecapabilityNote',
    startDate: '2023-11-28T15:30:00.000Z',
    endDate: '2023-11-28T15:30:00.000Z',
    timezone: 'Europe/Kiev',
  },
  {
    id: 'f3f5eada-618c-4111-bfaf-01683a26308c',
    userId: '4a6264dd-9280-4884-bc5d-fc0b9ddf9640',
    caregiverInfoId: '227ee80d-217a-4b1d-9cb5-44d9660f88ad',
    name: 'my app',
    type: 'Recurring',
    status: 'Active',
    details: 'ref',
    payment: 5,
    location: 'California',
    activityNote: 'activityNoteactivityNote',
    diagnosisNote: 'diagnosisNotediagnosisNote',
    capabilityNote: 'capabilityNotecapabilityNote',
    startDate: '2023-11-28T15:30:00.000Z',
    endDate: '2023-11-28T15:30:00.000Z',
    timezone: 'Europe/Kiev',
    weekday: '["Monday"]',
  },
];
