import axios from 'axios';
import { API_URL } from '../../../Constants';
import { setupAxios } from '../../auth/core/setupAxios';
import {
  ClassLevelFeeDefaultDTO,
  SchoolDTO,
  StudentDTO,
  StudentVerificationDTO,
  StudentRegistrationFormData,
  PageResponse
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

export function selectStudent(id: number) {
  return scholarshipAxios.post<StudentDTO>(`${SCHOLARSHIP_BASE}/admin/students/${id}/select`);
}

// Service Center endpoints
export function registerStudent(studentData: StudentRegistrationFormData) {
  const studentDTO: StudentDTO = {
    studentName: studentData.studentName,
    dateOfBirth: studentData.dateOfBirth,
    gender: studentData.gender,
    classLevel: studentData.classLevel,
    rollNumber: studentData.rollNumber,
    academicYear: studentData.academicYear,
    schoolId: studentData.schoolId
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

/** Fetch student image as blob URL (for display with auth). Caller must revoke the URL when done. */
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
