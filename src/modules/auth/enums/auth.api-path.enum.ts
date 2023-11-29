export enum AuthApiPath {
  Auth = 'auth',
  SignUp = '/sign-up',
  SignIn = '/sign-in',
  AccountCheck = '/account-check',
  VerifyAccount = '/verify-account/:userId',
  RequestNewVerificationCode = '/request-new-verification-code/:userId',
  ResetPassword = '/reset-password',
  RequestResetOtp = '/request-reset-otp',
  VerifyResetOtp = '/verify-reset-otp',
}
