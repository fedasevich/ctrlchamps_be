export enum ErrorMessage {
  InternalServerError = 'Internal server error',
  UserEmailAlreadyExists = 'User with this email already exists',
  UserPhoneNumberAlreadyExists = 'User with this phone number already exists',
  FailedHashPassword = 'Failed to hash the password',
  FailedCreateToken = 'Failed to create the token',
  FailedSendVerificationCode = 'Failed to send the verification code',
  OtpCodeIncorrect = 'OTP code provided is incorrect',
  UserAlreadyVerified = 'User with this credentials already verified',
  UserNotExist = "An account matching that email doesn't exist",
  UserEmailAndPhoneAlreadyExists = 'User with these email and phone already exists',
  BadLoginCredentials = 'Failed to sign in due to bad credentials',
  UserIsNotCaregiver = 'User does not have the caregiver role',
  UserProfileNotFound = 'User profile not found',
  UserProfileAlreadyExists = 'Profile already exists for this caregiver',
  CertificatesNotFound = 'There is no certificates found',
  WorkExpNotFound = 'Work experiences not found',
  BacketNotFound = "Couldn't access AWS S3 bucket, check your credentials",
  FailedSendActivities = 'Failed to send activities',
  FailedSendCapabilities = 'Failed to send capabilities',
  FailedSendDiagnoses = 'Failed to send diagnoses',
  FailedCreateAppointment = 'Failed to create appointment',
  CaregiverInfoNotFound = 'Caregiver Info not found',
  UserIsNotAuthorized = 'User not authorized or userId not found',
  FailedSendAppointmentConfirmation = 'Failed to send the appointment confirmation email',
  CaregiverNotExist = 'Caregiver does not exist',
  AppointmentNotFound = 'Appointment not found',
  FailedUpdateAppointment = 'Failed to update appointment',
  VirtualAssessmentNotFound = 'Virtual Assessment not found',
  CaregiverNotFound = "Caregiver with such id wasn't found",
  UnsupportedAppointmentStatus = 'Unsupported appointment status',
  StatusNotProvided = "Status wasn't provided",
  AssessmentAlreadyRescheduled = 'The virtual assessment can be rescheduled only once',
  FailedCreateActivityLog = 'Failed to create activity log',
  FailedUpdateActivityLogStatus = 'Failed to update activity log status',
  FailedUpdateUser = 'Failed to update user data',
  InvalidProvidedPassword = 'Provided password does not match the old one',
  InsufficientFunds = 'Insufficient funds',
}
