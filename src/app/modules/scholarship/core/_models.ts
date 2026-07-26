export enum StudentStatus {
  APPLIED = 'APPLIED',
  VERIFIED = 'VERIFIED',
  SELECTED = 'SELECTED',
  REJECTED = 'REJECTED',
  DISCONTINUED = 'DISCONTINUED'
}

export enum VerificationStatus {
  VALID = 'VALID',
  INVALID = 'INVALID'
}

export interface SchoolDTO {
  id?: number;
  uuid?: string;
  name: string;
  code: string;
  address?: string;
  district?: string;
  state?: string;
  active?: boolean;
}

export interface StudentImageDTO {
  id?: number;
  uuid?: string;
  studentId?: number;
  contentType?: string;
  fileSize?: number;
  sortOrder?: number;
  imageType?: string;
  /** URL path to load image (e.g. /api/student-images/{id}/content) */
  contentUrl?: string;
}

export interface StudentDTO {
  id?: number;
  uuid?: string;
  studentName: string;
  dateOfBirth?: string;
  gender?: string;
  classLevel?: number;
  rollNumber?: string;
  academicYear?: string;
  status?: StudentStatus;
  schoolId: number;
  schoolName?: string;
  schoolCode?: string;
  active?: boolean;
  images?: StudentImageDTO[];
  /** From verification; populated when listing verified students for admin selection */
  joiningFees?: number;
  annualFees?: number;
  booksPrice?: number;
  extraPrice?: number;
  /** Number already selected for this academic year; for selection limit warning */
  selectedCountInAcademicYear?: number;
}

export interface StudentVerificationDTO {
  id?: number;
  uuid?: string;
  studentId: number;
  studentName?: string;
  verificationStatus: VerificationStatus;
  remarks?: string;
  verifiedById?: number;
  verifiedByName?: string;
  verifiedAt?: string;
  active?: boolean;
  joiningFees?: number;
  annualFees?: number;
  booksPrice?: number;
  extraPrice?: number;
}

/** Default fee values per class level for verification form */
export interface ClassLevelFeeDefaultDTO {
  classLevel?: number;
  joiningFees?: number;
  annualFees?: number;
  booksPrice?: number;
  extraPrice?: number;
}

export interface StudentAnnualReviewDTO {
  id?: number;
  uuid?: string;
  studentId: number;
  studentName?: string;
  academicYear: string;
  attendanceRemarks?: string;
  performanceRemarks?: string;
  continuationApproved?: boolean;
  reviewedAt?: string;
  active?: boolean;
}

export interface StudentRegistrationFormData {
  // Student details
  studentName: string;
  dateOfBirth: string;
  gender: string;
  classLevel: number;
  rollNumber: string;
  academicYear: string;
  
  // School
  schoolId: number;
  
  // Parent/Guardian details
  parentName: string;
  parentRelation: string;
  parentOccupation?: string;
  parentPhone: string;
  parentEmail?: string;
  
  // Financial condition
  annualIncome?: number;
  familyMembers?: number;
  financialRemarks?: string;
  
  // Address & Contact
  address: string;
  district: string;
  state: string;
  pincode: string;
  phone: string;
  email?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
