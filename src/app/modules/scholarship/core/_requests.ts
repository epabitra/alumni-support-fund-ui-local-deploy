import axios from 'axios';
import { API_URL } from '../../../Constants';
import { setupAxios } from '../../auth/core/setupAxios';
import {
  ClassLevelFeeDefaultDTO,
  SchoolDTO,
  StudentDTO,
  StudentVerificationDTO,
  StudentRegistrationFormData,
  PageResponse,
  ScholarshipPaymentRequestDTO,
  FeeUpdateRequestDTO,
  ScholarshipPaymentDTO,
  StudentScholarshipSummaryDTO
} from './_models';

// Setup axios instance for scholarship requests
const scholarshipAxios = axios.create();
setupAxios(scholarshipAxios);

const SCHOLARSHIP_BASE = `${API_URL}`;

// Public endpoints
export function getActiveSchools(page: number = 0, size: number = 100) {
  return scholarshipAxios.get<SchoolDTO[]>(`${SCHOLARSHIP_BASE}/public/schools`, {
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
      } as PageResponse<SchoolDTO>
    };
  });
}

// Admin endpoints
export function getAllSchools(page: number = 0, size: number = 20) {
  return scholarshipAxios.get<SchoolDTO[]>(`${SCHOLARSHIP_BASE}/admin/schools`, {
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
      } as PageResponse<SchoolDTO>
    };
  });
}

export function createSchool(school: SchoolDTO) {
  return scholarshipAxios.post<SchoolDTO>(`${SCHOLARSHIP_BASE}/admin/schools`, school);
}

export function updateSchool(id: number, school: SchoolDTO) {
  return scholarshipAxios.put<SchoolDTO>(`${SCHOLARSHIP_BASE}/admin/schools/${id}`, school);
}

export function updateSchoolActive(id: number, active: boolean) {
  return scholarshipAxios.patch<SchoolDTO>(`${SCHOLARSHIP_BASE}/admin/schools/${id}/active?active=${active}`);
}

const DEFAULT_SORT = 'createdDate,desc';

export function getAllStudents(
  page: number = 0,
  size: number = 20,
  search?: string,
  status?: string
) {
  const params: Record<string, string | number> = { page, size, sort: DEFAULT_SORT };
  if (search != null && search.trim() !== '') params.search = search.trim();
  if (status != null && status !== '' && status !== 'ALL') params.status = status;
  return scholarshipAxios.get<StudentDTO[]>(`${SCHOLARSHIP_BASE}/admin/students`, {
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
      } as PageResponse<StudentDTO>
    };
  });
}

/** Admin: correct a student's registration details */
export function getStudentDetails(id: number) {
  return scholarshipAxios.get<StudentDTO>(`${SCHOLARSHIP_BASE}/admin/students/${id}`);
}

export function updateStudent(id: number, student: StudentDTO) {
  return scholarshipAxios.put<StudentDTO>(`${SCHOLARSHIP_BASE}/admin/students/${id}`, student);
}

export function getServiceCenterStudents(
  page: number = 0,
  size: number = 20,
  search?: string,
  status?: string
) {
  const params: Record<string, string | number> = { page, size, sort: DEFAULT_SORT };
  if (search != null && search.trim() !== '') params.search = search.trim();
  if (status != null && status !== '' && status !== 'ALL') params.status = status;
  return scholarshipAxios.get<StudentDTO[]>(`${SCHOLARSHIP_BASE}/service-center/students`, {
    params
  }).then(response => {
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
      } as PageResponse<StudentDTO>
    };
  });
}

/** Multipart body: payment details as JSON part "data" plus receipt files as parts "receipts" */
function paymentFormData(body: ScholarshipPaymentRequestDTO, receipts: File[] = []): FormData {
  const formData = new FormData();
  formData.append('data', new Blob([JSON.stringify(body)], { type: 'application/json' }));
  receipts.forEach((file) => formData.append('receipts', file));
  return formData;
}

/** Select a verified student; amount is what is paid from the fund now (0 = pay later). */
export function selectStudent(id: number, body: ScholarshipPaymentRequestDTO, receipts: File[] = []) {
  return scholarshipAxios.post<StudentDTO>(`${SCHOLARSHIP_BASE}/admin/students/${id}/select`, paymentFormData(body, receipts), {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

/** Admin: total cost, paid, remaining and payment history of a student */
export function getStudentScholarshipPayments(studentId: number) {
  return scholarshipAxios
    .get<StudentScholarshipSummaryDTO>(`${SCHOLARSHIP_BASE}/admin/students/${studentId}/scholarship-payments`)
    .then((r) => r.data);
}

/** Any member: totals and payment history (purpose, dates, receipts) of a selected student */
export function getSelectedStudentPayments(studentId: number) {
  return scholarshipAxios
    .get<StudentScholarshipSummaryDTO>(`${SCHOLARSHIP_BASE}/selected-students/${studentId}/payments`)
    .then((r) => r.data);
}

/** Admin: pay an installment to a selected student */
export function addStudentScholarshipPayment(studentId: number, body: ScholarshipPaymentRequestDTO, receipts: File[] = []) {
  return scholarshipAxios
    .post<StudentScholarshipSummaryDTO>(
      `${SCHOLARSHIP_BASE}/admin/students/${studentId}/scholarship-payments`,
      paymentFormData(body, receipts),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    .then((r) => r.data);
}

/** Admin: attach receipts to an existing scholarship payment */
export function addScholarshipPaymentReceipts(studentId: number, paymentId: number, receipts: File[]) {
  const formData = new FormData();
  receipts.forEach((file) => formData.append('receipts', file));
  return scholarshipAxios
    .post<StudentScholarshipSummaryDTO>(
      `${SCHOLARSHIP_BASE}/admin/students/${studentId}/scholarship-payments/${paymentId}/receipts`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    .then((r) => r.data);
}

/** Admin: remove a wrongly uploaded receipt */
export function removeScholarshipPaymentReceipt(studentId: number, paymentId: number, receiptId: number) {
  return scholarshipAxios
    .delete<StudentScholarshipSummaryDTO>(
      `${SCHOLARSHIP_BASE}/admin/students/${studentId}/scholarship-payments/${paymentId}/receipts/${receiptId}`
    )
    .then((r) => r.data);
}

/** All scholarship payments to students, newest first (fund transparency). Authenticated. */
export function getScholarshipPaymentHistory(
  page: number = 0,
  size: number = 10,
  filters: { search?: string; from?: string; to?: string; sortBy?: 'date' | 'amount' | 'student'; sortDir?: 'asc' | 'desc' } = {}
): Promise<PageResponse<ScholarshipPaymentDTO>> {
  const params: Record<string, string | number> = { page, size };
  Object.entries(filters).forEach(([k, v]) => {
    if (v != null && String(v).trim() !== '') params[k] = String(v).trim();
  });
  return scholarshipAxios
    .get<PageResponse<ScholarshipPaymentDTO>>(`${SCHOLARSHIP_BASE}/selected-students/payments`, { params })
    .then((r) => r.data);
}

// Service Center endpoints
/** Optional form values: blank becomes undefined so it is stored as empty rather than failing validation. */
export const blankToUndefined = (value?: string) => value?.trim() || undefined;
const emptyToUndefined = (value?: number | string) => (value === '' || value == null ? undefined : Number(value));

export function registerStudent(studentData: StudentRegistrationFormData) {
  const studentDTO: StudentDTO = {
    studentName: studentData.studentName,
    dateOfBirth: studentData.dateOfBirth,
    gender: studentData.gender,
    classLevel: studentData.classLevel,
    rollNumber: studentData.rollNumber,
    academicYear: studentData.academicYear,
    schoolId: studentData.schoolId,
    parentName: blankToUndefined(studentData.parentName),
    parentRelation: blankToUndefined(studentData.parentRelation),
    parentOccupation: blankToUndefined(studentData.parentOccupation),
    parentPhone: blankToUndefined(studentData.parentPhone),
    parentEmail: blankToUndefined(studentData.parentEmail),
    annualIncome: emptyToUndefined(studentData.annualIncome),
    familyMembers: emptyToUndefined(studentData.familyMembers),
    financialRemarks: blankToUndefined(studentData.financialRemarks),
    address: blankToUndefined(studentData.address),
    district: blankToUndefined(studentData.district),
    state: blankToUndefined(studentData.state),
    pincode: blankToUndefined(studentData.pincode),
    phone: blankToUndefined(studentData.phone),
    email: blankToUndefined(studentData.email)
  };

  return scholarshipAxios.post<StudentDTO>(`${SCHOLARSHIP_BASE}/service-center/students`, studentDTO);
}

export function uploadStudentImage(studentId: number, file: File, sortOrder: number = 0) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('sortOrder', String(sortOrder));
  return scholarshipAxios.post<{ id: number; contentUrl: string }>(
    `${SCHOLARSHIP_BASE}/service-center/students/${studentId}/images`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
}

/**
 * Fetch an authenticated file (student image, payment receipt) as blob URL for display.
 * Caller must revoke the URL when done.
 */
export async function fetchStudentImageBlobUrl(contentUrl: string | undefined): Promise<string> {
  if (!contentUrl) return '';
  const base = (API_URL || '').replace(/\/api\/?$/, '');
  const fullUrl = base + (contentUrl.startsWith('/') ? contentUrl : '/' + contentUrl);
  const res = await scholarshipAxios.get(fullUrl, { responseType: 'blob' });
  return URL.createObjectURL(res.data);
}

// Verifier endpoints
export function getPendingStudents(page: number = 0, size: number = 20, search?: string) {
  const params: Record<string, string | number> = { page, size, sort: DEFAULT_SORT };
  if (search != null && search.trim() !== '') params.search = search.trim();
  return scholarshipAxios.get<StudentDTO[]>(`${SCHOLARSHIP_BASE}/verifier/students`, {
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
      } as PageResponse<StudentDTO>
    };
  });
}

/** Verifier / admin: verified and selected students (with paid / remaining) whose fees can be corrected */
export function getVerifiedStudents(page: number = 0, size: number = 20, search?: string) {
  const params: Record<string, string | number> = { page, size, sort: DEFAULT_SORT };
  if (search != null && search.trim() !== '') params.search = search.trim();
  return scholarshipAxios.get<StudentDTO[]>(`${SCHOLARSHIP_BASE}/verifier/students/verified`, { params }).then((response) => ({
    ...response,
    data: {
      content: response.data,
      totalElements: parseInt(response.headers['x-total-count'] || '0', 10),
      totalPages: parseInt(response.headers['x-total-pages'] || '0', 10),
      size: parseInt(response.headers['x-page-size'] || String(size), 10),
      number: parseInt(response.headers['x-page-number'] || '0', 10)
    } as PageResponse<StudentDTO>
  }));
}

/** Verifier / admin: correct the fees of a verified or selected student (logged with the reason) */
export function updateStudentFees(studentId: number, body: FeeUpdateRequestDTO) {
  return scholarshipAxios
    .put<StudentVerificationDTO>(`${SCHOLARSHIP_BASE}/verifier/students/${studentId}/fees`, body)
    .then((r) => r.data);
}

export function verifyStudent(studentId: number, verification: StudentVerificationDTO) {
  return scholarshipAxios.post<StudentVerificationDTO>(
    `${SCHOLARSHIP_BASE}/verifier/students/${studentId}/verify`,
    verification
  );
}

export function getFeeDefaults(classLevel?: number) {
  const params: Record<string, number> = {};
  if (classLevel != null) params.classLevel = classLevel;
  return scholarshipAxios.get<ClassLevelFeeDefaultDTO>(
    `${SCHOLARSHIP_BASE}/verifier/students/fee-defaults`,
    { params }
  );
}

/** Selected students (for all authenticated users); 10 per page by default */
export function getSelectedStudents(
  page: number = 0,
  size: number = 10,
  search?: string
) {
  const params: Record<string, string | number> = { page, size, sort: DEFAULT_SORT };
  if (search != null && search.trim() !== '') params.search = search.trim();
  return scholarshipAxios.get<StudentDTO[]>(`${SCHOLARSHIP_BASE}/selected-students`, {
    params
  }).then(response => {
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
      } as PageResponse<StudentDTO>
    };
  });
}
