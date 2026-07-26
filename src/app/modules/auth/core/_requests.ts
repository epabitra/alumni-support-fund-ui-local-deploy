import axios from 'axios';
import { POST_FETCH_BEARER_TOKEN, POST_FETCH_USER, POST_REGISTER_USER } from '../../../Constants';
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

export function createUser(
  email: string,
  firstname: string,
  lastname: string,
  password: string,
  revealDetailsInPublicHistory?: boolean
) {
  return axios.post(POST_REGISTER_USER, {
    email,
    firstName: firstname,
    lastName: lastname,
    password,
    login: email,
    revealDetailsInPublicHistory: revealDetailsInPublicHistory ?? false,
  });
}

