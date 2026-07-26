export interface AuthModel {
  api_token: string;
  refresh_token?: string;
  trialExpired?: boolean;
}

export interface UserModel {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  login: string;
  activated: boolean;
  authorities: string[];
  /** When set, use with API base URL to load profile image (e.g. /api/account/profile-image) */
  imageUrl?: string | null;
  /** If true, name/email shown in public payment history; if false, masked */
  revealDetailsInPublicHistory?: boolean;
}

export interface CompanyModel {
  id: number;
  name: string;
}


