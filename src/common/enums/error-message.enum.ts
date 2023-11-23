export enum ErrorMessage {
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
}
