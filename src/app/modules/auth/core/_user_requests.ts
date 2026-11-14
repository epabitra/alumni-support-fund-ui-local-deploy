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
  /** Read only (list) */
  createdDate?: string;
  totalContributed?: number;
  contributionCount?: number;
  lastContributionDate?: string | null;
}

export interface UserFilters {
  /** Name, email, login or mobile */
  search?: string;
  role?: string;
  /** 'active' | 'inactive' */
  status?: string;
  /** Joined from / to, yyyy-MM-dd */
  from?: string;
  to?: string;
  sortBy?: 'name' | 'email' | 'joined';
  sortDir?: 'asc' | 'desc';
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

export function getAllUsers(page: number = 0, size: number = 20, filters: UserFilters = {}) {
  const params: Record<string, string | number> = { page, size };
  Object.entries(filters).forEach(([k, v]) => {
    if (v != null && String(v).trim() !== '') params[k] = String(v).trim();
  });
  return userAxios.get<AdminUserDTO[]>(`${API_URL}/admin/users`, {
    params
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

/** Member suggestions for pickers: matches name, mobile or email */
export function searchMembers(query: string, size = 8) {
  return getAllUsers(0, size, { search: query, sortBy: 'name', sortDir: 'asc' }).then((r) => r.data.content);
}

export function updateUser(user: AdminUserDTO) {
  return userAxios.put<AdminUserDTO>(`${API_URL}/users/updateUser`, user);
}

/** Request/response for admin add payment (no gateway) */
export interface AdminAddPaymentRequest {
  userEmail: string;
  amount: number;
  /** The event this money is for; empty = General Fund */
  fundEventId?: number;
  /** Day the money was received, yyyy-MM-dd; empty = today */
  paidOn?: string;
}

export interface PaymentCorrectionDTO {
  correctedAt: string;
  correctedBy?: string | null;
  oldAmount: number;
  newAmount: number;
  oldUser?: string | null;
  newUser?: string | null;
  oldPurpose: string;
  newPurpose: string;
  oldPaidAt?: string | null;
  newPaidAt?: string | null;
  reason: string;
}

/** A payment as admins see it (Add payment page, edit dialog) */
export interface AdminPaymentEntry {
  orderId: string;
  amount: number;
  refundedAmount: number;
  purpose: string;
  fundEventId?: number | null;
  paidAt: string;
  recordedAt: string;
  recordedBy?: string | null;
  paymentMethod?: string;
  userId?: number;
  userName?: string;
  userEmail?: string;
  userPhone?: string | null;
  correctedAt?: string | null;
  editable: boolean;
  notEditableReason?: string | null;
  corrections: PaymentCorrectionDTO[];
}

export interface AdminPaymentCorrection {
  userEmail: string;
  amount: number;
  /** null = General Fund */
  fundEventId: number | null;
  paidOn: string;
  reason: string;
}

/** Payments recorded by admins, newest first */
export function getAdminPaymentEntries(page = 0, size = 8) {
  return userAxios
    .get<PageResponse<AdminPaymentEntry>>(`${API_URL}/admin/payments/entries`, { params: { page, size } })
    .then((r) => r.data);
}

export function getAdminPaymentEntry(orderId: string) {
  return userAxios.get<AdminPaymentEntry>(`${API_URL}/admin/payments/${encodeURIComponent(orderId)}`).then((r) => r.data);
}

/** Correct member, amount, fund or date of a payment recorded by an admin; updated everywhere */
export function correctAdminPayment(orderId: string, body: AdminPaymentCorrection) {
  return userAxios.put<AdminPaymentEntry>(`${API_URL}/admin/payments/${encodeURIComponent(orderId)}`, body).then((r) => r.data);
}

export interface AdminAddPaymentResult {
  orderId: string;
  transactionId: string;
  amount: number;
  userEmail: string;
  message: string;
  /** Event title, or "General Fund" */
  purpose?: string;
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
