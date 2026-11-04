import axios from 'axios';
import { POST_FETCH_BEARER_TOKEN, POST_FETCH_USER, POST_REGISTER_USER, POST_VERIFY_EMAIL, POST_RESEND_VERIFICATION, POST_FORGOT_PASSWORD, POST_RESET_PASSWORD } from '../../../Constants';
import { AuthModel } from './_models';
import { UserModel } from './_models';

export function login(email: string, password: string) {
  return axios.post<AuthModel>(POST_FETCH_BEARER_TOKEN, {
    username: email,
    password,
    rememberMe: true
  });
}

export function getUserByToken(_token: string) {
  // Token is already added by axios interceptor, but we can use it directly here too
  return axios.post<UserModel>(POST_FETCH_USER, {});
}

/** Activates an account using the key from the verification email */
export function verifyEmail(key: string) {
  return axios.post(POST_VERIFY_EMAIL, { key });
}

/** Asks for a new verification link */
export function resendVerificationEmail(email: string) {
  return axios.post(POST_RESEND_VERIFICATION, { email });
}

/** Emails a password reset link if the address has an account */
export function forgotPassword(email: string) {
  return axios.post(POST_FORGOT_PASSWORD, { email });
}

/** Sets a new password using the key from the reset email */
export function resetPassword(key: string, newPassword: string) {
  return axios.post(POST_RESET_PASSWORD, { key, newPassword });
}

export function createUser(
  email: string,
  firstname: string,
  lastname: string,
  password: string,
  revealDetailsInPublicHistory?: boolean
) {
  return axios.post<{ verificationRequired?: boolean }>(POST_REGISTER_USER, {
    email,
    firstName: firstname,
    lastName: lastname,
    password,
    login: email,
    revealDetailsInPublicHistory: revealDetailsInPublicHistory ?? false,
  });
}

