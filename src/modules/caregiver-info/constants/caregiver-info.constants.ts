export const FILTRED_CAREGIVERS_EXAMPLE = [
  {
    id: '2f09b807-72ee-49ea-83d2-17b7746957a2',
    hourlyRate: 20,
    firstName: 'Max',
    lastName: 'Volovo',
  },
  {
    id: '2f09b807-72ee-49ea-83d2-17b7746957a3',
    hourlyRate: 25,
    firstName: 'Alice',
    lastName: 'James',
  },
];

export const DETAILED_CAREGIVER_INFO_EXAMPLE = {
  id: '2f09b807-72ee-49ea-83d2-17b7746957a3',
  hourlyRate: 25,
  firstName: 'Alice',
  lastName: 'James',
  isOpenToSeekerHomeLiving: true,
  numberOfAppointments: 2,
  description: 'I am an experienced nurse..',
  videoLink: 'https://youtube.com/user/video',
  services: ['Personal Care Assistance', 'Medication Management'],
  certificates: [
    {
      workplace: 'ABC Hospital',
      qualifications: 'Clinic',
      startDate: '2020-11-11',
      endDate: '2021-11-11',
    },
  ],
  workExperiences: [
    {
      name: 'First Aid Training',
      certificateId: 'CER12345',
      link: 'https://certificateprovider.com/certificate/123',
      dateIssued: '2020-11-11',
      expirationDate: '2021-11-11',
    },
  ],
};

export const TRUE = 'true';
export const FALSE = 'false';
