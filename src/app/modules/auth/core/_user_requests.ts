import axios from 'axios';
import { API_URL, POST_CHANGE_PASSWORD, PUT_ACCOUNT_PROFILE, POST_ACCOUNT_PROFILE_IMAGE, GET_ACCOUNT_PROFILE_IMAGE } from '../../../Constants';
import { getAuth } from './AuthHelpers';
import type { UserModel } from './_models';

export interface AdminUserDTO {
  id?: number;
  login: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string | null;
  activated: boolean;
  authorities?: string[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Setup axios instance for user requests
const userAxios = axios.create();
// Skip ngrok's free-tier browser-warning interstitial so API responses stay JSON
userAxios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

// Add request interceptor to include token
userAxios.interceptors.request.use(
  (config) => {
    const auth = getAuth();
    if (auth && auth.api_token) {
      config.headers.Authorization = `Bearer ${auth.api_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export function getAllUsers(page: number = 0, size: number = 20) {
  return userAxios.get<AdminUserDTO[]>(`${API_URL}/admin/users`, {
    params: { page, size }
  }).then(response => {
    // Convert response to PageResponse format
    const totalElements = parseInt(response.headers['x-total-count'] || '0', 10);
    const totalPages = parseInt(response.headers['x-total-pages'] || '0', 10);
    const pageNumber = parseInt(response.headers['x-page-number'] || '0', 10);
    const pageSize = parseInt(response.headers['x-page-size'] || String(size), 10);
    
    return {
      ...response,
      data: {
        content: response.data,
        totalElements,
        totalPages,
        size: pageSize,
        number: pageNumber
      } as PageResponse<AdminUserDTO>
    };
  });
}

export function updateUser(user: AdminUserDTO) {
  return userAxios.put<AdminUserDTO>(`${API_URL}/users/updateUser`, user);
}

/** Request/response for admin add payment (no gateway) */
export interface AdminAddPaymentRequest {
  userEmail: string;
  amount: number;
}

export interface AdminAddPaymentResult {
  orderId: string;
  transactionId: string;
  amount: number;
  userEmail: string;
  message: string;
}

export function addPaymentAsAdmin(data: AdminAddPaymentRequest) {
  return userAxios.post<AdminAddPaymentResult>(`${API_URL}/admin/payments/add`, data);
}

export function changePassword(currentPassword: string, newPassword: string) {
  return userAxios.post(POST_CHANGE_PASSWORD, { currentPassword, newPassword });
}

export function updateAccountProfile(firstName: string, lastName: string, revealDetailsInPublicHistory?: boolean, phone?: string) {
  return userAxios.put<UserModel>(PUT_ACCOUNT_PROFILE, { firstName, lastName, phone, revealDetailsInPublicHistory });
}

/**
 * The signed-in user's photo as a blob URL; the caller revokes it when done.
 * Goes through userAxios because on the live site a plain fetch gets ngrok's warning page instead of the image.
 */
export async function fetchProfileImageBlobUrl(): Promise<string> {
  const { data } = await userAxios.get<Blob>(GET_ACCOUNT_PROFILE_IMAGE, { responseType: 'blob' });
  if (!data.type.startsWith('image/')) throw new Error('Profile image response was not an image');
  return URL.createObjectURL(data);
}

export function uploadProfileImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return userAxios.post<UserModel>(POST_ACCOUNT_PROFILE_IMAGE, formData);
}
