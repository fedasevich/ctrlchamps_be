export enum ErrorMessage {
  UserEmailAlreadyExist = 'User with this email already exist',
  UserPhoneNumberAlreadyExist = 'User with this phone number already exists',
  FailedHashPassword = 'Failed to hash the password',
  FailedCreateToken = 'Failed to create the token',
  FailedSendVerificationCode = 'Failed to send the verification code',
  VerificationCodeIncorrect = 'Verification code provided is incorrect',
  NoExistingUser = 'No existing user found with the provided credentials',
  UserAlreadyVerified = 'User with this credentials already verified',
  BadLoginCredentials = 'Failed to sign in due to bad credentials',
}
