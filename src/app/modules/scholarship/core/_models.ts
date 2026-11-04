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
  /** Family, financial and contact details: only returned by the admin and verifier single-student endpoints */
  parentName?: string;
  parentRelation?: string;
  parentOccupation?: string;
  parentPhone?: string;
  parentEmail?: string;
  annualIncome?: number;
  familyMembers?: number;
  financialRemarks?: string;
  address?: string;
  district?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  /** From verification; populated when listing verified students for admin selection */
  joiningFees?: number;
  annualFees?: number;
  booksPrice?: number;
  extraPrice?: number;
  /** Travel to school (auto / rickshaw) */
  travelFees?: number;
  /** Number already selected for this academic year; for selection limit warning */
  selectedCountInAcademicYear?: number;
  /** Scholarship totals: sum of fees, paid from the fund so far, and remaining */
  totalCost?: number;
  totalPaid?: number;
  remainingAmount?: number;
}

/** Body for selecting a student (amount may be 0) or paying an installment (amount > 0) */
export interface ScholarshipPaymentRequestDTO {
  amount: number;
  /** Purpose of the payment; required when amount > 0 */
  remarks?: string;
  /** Date the payment was actually made (yyyy-MM-dd); defaults to today on the server */
  paidOn?: string;
}

/** Proof document (school receipt) attached to a scholarship payment */
export interface ScholarshipReceiptDTO {
  id: number;
  contentType: string;
  fileSize?: number;
  fileName?: string;
  uploadedAt?: string;
  /** URL path to load the file (e.g. /api/scholarship-receipts/{id}/content) */
  contentUrl: string;
}

/** One scholarship payment made to a student, with the student's current totals */
export interface ScholarshipPaymentDTO {
  id: number;
  studentId: number;
  studentName?: string;
  schoolName?: string;
  classLevel?: number;
  academicYear?: string;
  amount: number;
  /** Date the payment was actually made (yyyy-MM-dd) */
  paidOn: string;
  /** When the payment was recorded in the system (ISO timestamp) */
  paymentDate: string;
  /** Purpose of the payment */
  remarks?: string;
  receipts: ScholarshipReceiptDTO[];
  /** Paid to the student up to and including this payment, by paid-on date; fund page only */
  paidAfterThisPayment?: number;
  /** Admin who paid; only in admin views */
  paidByName?: string;
  totalCost: number;
  totalPaid: number;
  remainingAmount: number;
}

/** A student's scholarship payment status and history */
export interface StudentScholarshipSummaryDTO {
  studentId: number;
  studentName?: string;
  totalCost: number;
  totalPaid: number;
  remainingAmount: number;
  payments: ScholarshipPaymentDTO[];
  /** Fee corrections made after verification, newest first */
  feeChanges?: FeeChangeDTO[];
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
  travelFees?: number;
}

/** Corrected fees of a verified / selected student; reason is required */
export interface FeeUpdateRequestDTO {
  joiningFees: number;
  annualFees: number;
  booksPrice: number;
  extraPrice: number;
  travelFees: number;
  reason: string;
}

/** A fee correction made after verification */
export interface FeeChangeDTO {
  id: number;
  changedAt: string;
  /** e.g. "Joining fees: 5100.00 → 5300.00" */
  changes: string;
  oldTotal: number;
  newTotal: number;
  reason: string;
  /** Who made the change; only in admin views */
  changedByName?: string;
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
