export const REASON_MIN_LENGTH = 7;
export const REASON_MAX_LENGTH = 100;

export const VIRTUAL_ASSESSMENT_GET_EXAMPLE = {
  id: '78b96c71-a7cb-4598-966d-52c4b92d13cf',
  startTime: '03:00:00',
  endTime: '06:30:00',
  status: 'Proposed',
  assessmentDate: '2023-12-31',
  meetingLink: 'https://meet.example.com/1234',
  appointment: {
    caregiverInfoId: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
    name: 'Urgent Appointment',
    type: 'One time',
    status: 'Pending confirmation',
    details: 'Details about the appointment',
    location: 'Location Address',
    activityNote: 'Activity notes',
    diagnosisNote: 'Diagnosis notes',
    capabilityNote: 'Capability notes',
    startDate: '2023-11-28T15:30:00.000Z',
    endDate: '2023-11-28T15:30:00.000Z',
    timezone: 'Europe/Kiev',
    weekdays: ['Monday', 'Wednesday'],
    seekerTasks: ['Sort mails', 'Clean the house'],
    seekerCapabilities: ['1e3a4c60-94aa-45de-aad0-7b4a49017b1f'],
    seekerDiagnoses: ['1e3a4c60-94aa-45de-aad0-7b4a49017b1f'],
    seekerActivities: [
      {
        id: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
        answer: 'Accomplishes Alone',
      },
    ],
  },
};

export const VIRTUAL_ASSESSMENT_DATE_FORMAT = 'yyyy-MM-dd';
export const VIRTUAL_ASSESSMENT_TIME_FORMAT = 'HH:mm:ss';
export const UTC_TIMEZONE = 'UTC';

export const FOUR_MINUTES = 4;
export const SIX_MINUTES = 6;
