export enum ErrorMessage {
  UserEmailAlreadyExists = 'User with this email already exists',
  UserPhoneNumberAlreadyExists = 'User with this phone number already exists',
  FailedHashPassword = 'Failed to hash the password',
  FailedCreateToken = 'Failed to create the token',
  UserNotExist = "An account matching that email doesn't exist",
  UserEmailAndPhoneAlreadyExists = 'User with these email and phone already exists',
  BadLoginCredentials = 'Failed to sign in due to bad credentials',
}
