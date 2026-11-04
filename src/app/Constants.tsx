// API URL - uses environment variable, defaults to localhost for development
export const API_URL: string = import.meta.env.VITE_APP_API_URL || 'http://localhost:8080/api';

// Authentication endpoints
export const POST_FETCH_BEARER_TOKEN = `${API_URL}/login`;
export const POST_FETCH_USER = `${API_URL}/get_user`;
export const POST_REGISTER_USER = `${API_URL}/create`;
export const POST_VERIFY_EMAIL = `${API_URL}/verify-email`;
export const POST_RESEND_VERIFICATION = `${API_URL}/resend-verification`;
export const POST_FORGOT_PASSWORD = `${API_URL}/forgot-password`;
export const POST_RESET_PASSWORD = `${API_URL}/reset-password`;
export const PUT_UPDATE_USER = `${API_URL}/users/updateUser`;
export const POST_CHANGE_PASSWORD = `${API_URL}/account/change-password`;
export const PUT_ACCOUNT_PROFILE = `${API_URL}/account/profile`;
export const POST_ACCOUNT_PROFILE_IMAGE = `${API_URL}/account/profile-image`;
export const GET_ACCOUNT_PROFILE_IMAGE = `${API_URL}/account/profile-image`;

// User roles
export const ROLE_USER = 'ROLE_USER';
export const ROLE_ADMIN = 'ROLE_ADMIN';
export const ROLE_SERVICE_CENTER = 'ROLE_SERVICE_CENTER';
export const ROLE_VERIFIER = 'ROLE_VERIFIER';
export const ROLE_AUDITOR = 'ROLE_AUDITOR';


