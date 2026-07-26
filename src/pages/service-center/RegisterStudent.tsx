import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { getActiveSchools, registerStudent, uploadStudentImage } from '../../app/modules/scholarship/core/_requests';
import { SchoolDTO, StudentRegistrationFormData } from '../../app/modules/scholarship/core/_models';
import RoleBasedNav from '../../components/RoleBasedNav';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../service-center/service-center.css';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];

const RegisterStudent: React.FC = () => {
  const [schools, setSchools] = useState<SchoolDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string>('');
  const [errorPopup, setErrorPopup] = useState<string | null>(null);
  const prevSubmitCountRef = useRef(0);

  /** Errors that should be shown in a popup instead of inline (e.g. duplicate roll number). */
  const isBusinessError = (msg: string) =>
    /already exists|roll number|duplicate/i.test(msg);

  useEffect(() => {
    loadSchools();
  }, []);

  const revokePreviewUrls = () => {
    photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPhotoPreviewUrls([]);
  };

  const addPhotoFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImageError('');
    const nextFiles: File[] = [];
    const nextPreviews: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = (file.type || '').toLowerCase();
      const allowed = ALLOWED_IMAGE_TYPES.some((t) => type === t || (t === 'image/jpg' && type === 'image/jpeg'));
      if (!allowed) {
        setImageError(`Invalid format: ${file.name}. Use JPEG, PNG, WebP or HEIC.`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setImageError(`File too large: ${file.name}. Max size is 5 MB.`);
        continue;
      }
      nextFiles.push(file);
      nextPreviews.push(URL.createObjectURL(file));
    }
    revokePreviewUrls();
    setPhotoFiles((prev) => [...prev, ...nextFiles]);
    setPhotoPreviewUrls((prev) => [...prev, ...nextPreviews]);
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index]);
      return next.filter((_, i) => i !== index);
    });
    setImageError('');
  };

  const loadSchools = async () => {
    try {
      setLoading(true);
      const response = await getActiveSchools(0, 1000);
      setSchools(response.data.content);
      if (response.data.content.length === 0) {
        setError('No active schools available. Please contact administrator.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const validationSchema = Yup.object({
    studentName: Yup.string()
      .required('Student name is required')
      .max(255, 'Student name must not exceed 255 characters'),
    dateOfBirth: Yup.date()
      .required('Date of birth is required')
      .max(new Date(), 'Date of birth cannot be in the future'),
    gender: Yup.string()
      .required('Gender is required')
      .max(20, 'Gender must not exceed 20 characters'),
    classLevel: Yup.number()
      .required('Class level is required')
      .min(1, 'Class level must be between 1 and 10')
      .max(10, 'Class level must be between 1 and 10'),
    rollNumber: Yup.string()
      .required('Roll number is required')
      .max(50, 'Roll number must not exceed 50 characters'),
    academicYear: Yup.string()
      .required('Academic year is required')
      .max(20, 'Academic year must not exceed 20 characters'),
    schoolId: Yup.number()
      .required('School selection is required')
      .positive('Please select a valid school'),
    parentName: Yup.string()
      .required('Parent/Guardian name is required')
      .max(255, 'Name must not exceed 255 characters'),
    parentRelation: Yup.string()
      .required('Relation is required'),
    parentPhone: Yup.string()
      .required('Parent phone number is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
    address: Yup.string()
      .required('Address is required'),
    district: Yup.string()
      .required('District is required')
      .max(100, 'District must not exceed 100 characters'),
    state: Yup.string()
      .required('State is required')
      .max(100, 'State must not exceed 100 characters'),
    pincode: Yup.string()
      .required('Pincode is required')
      .matches(/^[0-9]{6}$/, 'Pincode must be 6 digits'),
    phone: Yup.string()
      .required('Contact phone is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
    email: Yup.string()
      .email('Invalid email address')
      .max(254, 'Email must not exceed 254 characters'),
    annualIncome: Yup.number()
      .min(0, 'Annual income cannot be negative'),
    familyMembers: Yup.number()
      .min(1, 'Family members must be at least 1')
      .integer('Family members must be a whole number')
  });

  const formik = useFormik<StudentRegistrationFormData>({
    initialValues: {
      studentName: '',
      dateOfBirth: '',
      gender: '',
      classLevel: 1,
      rollNumber: '',
      academicYear: '',
      schoolId: 0,
      parentName: '',
      parentRelation: '',
      parentOccupation: '',
      parentPhone: '',
      parentEmail: '',
      annualIncome: undefined,
      familyMembers: undefined,
      financialRemarks: '',
      address: '',
      district: '',
      state: '',
      pincode: '',
      phone: '',
      email: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitting(true);
        setError('');
        setImageError('');
        const response = await registerStudent(values);
        const studentId = response.data.id;
        if (studentId && photoFiles.length > 0) {
          for (let i = 0; i < photoFiles.length; i++) {
            await uploadStudentImage(studentId, photoFiles[i], i);
          }
        }
        revokePreviewUrls();
        setPhotoFiles([]);
        setPhotoPreviewUrls([]);
        setSuccess(true);
        setSubmitted(true);
      } catch (err: any) {
        const data = err.response?.data;
        const fieldErrors = data?.fieldErrors;
        const errorMessage = data?.message ||
          (fieldErrors?.[0]?.message) ||
          'Failed to register student';
        if (isBusinessError(errorMessage)) {
          setErrorPopup(errorMessage);
          setError('');
        } else {
          setError(errorMessage);
          if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
            fieldErrors.forEach((fe: { field: string; message: string }) => {
              formik.setFieldError(fe.field, fe.message);
            });
            const firstField = fieldErrors[0].field;
            setTimeout(() => scrollToFirstError(firstField), 100);
          } else {
            document.getElementById('register-error-alert')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      } finally {
        setSubmitting(false);
      }
    }
  });

  /** Scroll to first invalid field when validation fails on submit or when API returns field errors. */
  const scrollToFirstError = (firstFieldId: string) => {
    const el = document.getElementById(firstFieldId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    if (formik.submitCount > prevSubmitCountRef.current && Object.keys(formik.errors).length > 0) {
      prevSubmitCountRef.current = formik.submitCount;
      const first = Object.keys(formik.errors)[0];
      scrollToFirstError(first);
    }
  }, [formik.submitCount, formik.errors]);

  if (loading) {
    return (
      <div className="service-center-container">
        <RoleBasedNav />
        <main className="service-center-main">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  if (success && submitted) {
    return (
      <div className="service-center-container">
        <RoleBasedNav />
        <main className="service-center-main">
          <div className="success-container">
            <h1>Registration Successful</h1>
            <p>Student registration has been submitted successfully.</p>
            <p className="note">
              <strong>Important:</strong> This record is now locked and cannot be edited. 
              The application will proceed through the verification process.
            </p>
            <div className="success-actions">
              <Link to="/service-center/my-applications" className="btn btn-secondary btn-lg">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <span>View My Applications</span>
              </Link>
              <button 
                type="button"
                className="btn btn-primary btn-lg" 
                onClick={() => {
                  setSuccess(false);
                  setSubmitted(false);
                  formik.resetForm();
                  setPhotoFiles([]);
                  revokePreviewUrls();
                }}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4"/>
                </svg>
                <span>Register New Student</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="service-center-container">
      <RoleBasedNav />
      <main className="service-center-main">
        <PageHeader
          title="Register Student"
          subtitle="Complete the comprehensive form to register a new student for scholarship consideration"
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Service Center' },
            { label: 'Register Student' }
          ]}
          variant="service-center"
          actions={
            <Link to="/service-center/my-applications" className="btn btn-secondary">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              View My Applications
            </Link>
          }
        />

        {error && <div id="register-error-alert" className="alert alert-danger">{error}</div>}

        {errorPopup && (
          <div className="modal-overlay" onClick={() => setErrorPopup(null)} role="dialog" aria-modal="true" aria-labelledby="error-popup-title">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 id="error-popup-title">Registration notice</h2>
                <button type="button" className="modal-close" aria-label="Close" onClick={() => setErrorPopup(null)}>×</button>
              </div>
              <div className="modal-body">
                <p className="text-danger" style={{ margin: 0 }}>{errorPopup}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={() => setErrorPopup(null)}>OK</button>
              </div>
            </div>
          </div>
        )}

        {schools.length === 0 && (
          <div className="alert alert-warning">
            <strong>Notice:</strong> No active schools available. Please contact administrator before registering students.
          </div>
        )}

        <form onSubmit={formik.handleSubmit} className="registration-form">
          <section className="form-section">
            <h2>Student Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="studentName">Student Name *</label>
                <input
                  id="studentName"
                  name="studentName"
                  type="text"
                  placeholder="Enter full name of the student"
                  value={formik.values.studentName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={submitted}
                  className={formik.touched.studentName && formik.errors.studentName ? 'error' : ''}
                />
                {formik.touched.studentName && formik.errors.studentName && (
                  <span className="field-error">{formik.errors.studentName}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth *</label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formik.values.dateOfBirth}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={submitted}
                  className={formik.touched.dateOfBirth && formik.errors.dateOfBirth ? 'error' : ''}
                />
                {formik.touched.dateOfBirth && formik.errors.dateOfBirth && (
                  <span className="field-error">{formik.errors.dateOfBirth}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">Gender *</label>
                <select
                  id="gender"
                  name="gender"
                  value={formik.values.gender}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={submitted}
                  className={formik.touched.gender && formik.errors.gender ? 'error' : ''}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {formik.touched.gender && formik.errors.gender && (
                  <span className="field-error">{formik.errors.gender}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="classLevel">Class Level *</label>
                <input
                  id="classLevel"
                  name="classLevel"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="Enter class level (1-10)"
                  value={formik.values.classLevel}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={submitted}
                  className={formik.touched.classLevel && formik.errors.classLevel ? 'error' : ''}
                />
                {formik.touched.classLevel && formik.errors.classLevel && (
                  <span className="field-error">{formik.errors.classLevel}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="rollNumber">Roll Number *</label>
                <input
                  id="rollNumber"
                  name="rollNumber"
                  type="text"
                  placeholder="Enter student roll number"
                  value={formik.values.rollNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={submitted}
                  className={formik.touched.rollNumber && formik.errors.rollNumber ? 'error' : ''}
                />
                {formik.touched.rollNumber && formik.errors.rollNumber && (
                  <span className="field-error">{formik.errors.rollNumber}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="academicYear">Academic Year *</label>
                <input
                  id="academicYear"
                  name="academicYear"
                  type="text"
                  placeholder="e.g., 2024-2025"
                  value={formik.values.academicYear}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={submitted}
                  className={formik.touched.academicYear && formik.errors.academicYear ? 'error' : ''}
                />
                {formik.touched.academicYear && formik.errors.academicYear && (
                  <span className="field-error">{formik.errors.academicYear}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="schoolId">School *</label>
              <select
                id="schoolId"
                name="schoolId"
                value={formik.values.schoolId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={submitted || schools.length === 0}
                className={formik.touched.schoolId && formik.errors.schoolId ? 'error' : ''}
              >
                <option value={0}>Select School</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name} ({school.code})
                  </option>
                ))}
              </select>
              {formik.touched.schoolId && formik.errors.schoolId && (
                <span className="field-error">{formik.errors.schoolId}</span>
              )}
            </div>

            <div className="form-section photo-section">
              <h3>Pass photo(s)</h3>
              <p className="form-help">Upload from device or take a photo. You can add multiple images. Max 5 MB per image (JPEG, PNG, WebP or HEIC).</p>
              <div className="photo-actions">
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
                  multiple
                  className="photo-input-hidden"
                  onChange={(e) => { addPhotoFiles(e.target.files); e.target.value = ''; }}
                  disabled={submitted}
                />
                <input
                  type="file"
                  id="photo-camera"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
                  multiple
                  capture="environment"
                  className="photo-input-hidden"
                  onChange={(e) => { addPhotoFiles(e.target.files); e.target.value = ''; }}
                  disabled={submitted}
                />
                <label htmlFor="photo-upload" className="btn btn-secondary btn-photo-action">
                  Upload from device
                </label>
                <label htmlFor="photo-camera" className="btn btn-secondary btn-photo-action">
                  Take photo
                </label>
              </div>
              {imageError && <div className="field-error">{imageError}</div>}
              {photoPreviewUrls.length > 0 && (
                <div className="photo-previews">
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="photo-preview-wrap">
                      <img src={url} alt={`Preview ${index + 1}`} className="photo-preview-img" />
                      {!submitted && (
                        <button type="button" className="photo-preview-remove" onClick={() => removePhoto(index)} aria-label="Remove">×</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="form-section">
            <h2>Parent/Guardian Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="parentName">Parent/Guardian Name *</label>
                <input
                  id="parentName"
                  name="parentName"
                  type="text"
                  placeholder="Enter parent or guardian full name"
                  value={formik.values.parentName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={submitted}
                  className={formik.touched.parentName && formik.errors.parentName ? 'error' : ''}
                />
                {formik.touched.parentName && formik.errors.parentName && (
                  <span className="field-error">{formik.errors.parentName}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="parentRelation">Relation *</label>
                <select
                  id="parentRelation"
                  name="parentRelation"
                  value={formik.values.parentRelation}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={submitted}
                  className={formik.touched.parentRelation && formik.errors.parentRelation ? 'error' : ''}
                >
                  <option value="">Select Relation</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Other">Other</option>
                </select>
                {formik.touched.parentRelation && formik.errors.parentRelation && (
                  <span className="field-error">{formik.errors.parentRelation}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="parentOccupation">Occupation</label>
                <input
                  id="parentOccupation"
                  name="parentOccupation"
                  type="text"
                  placeholder="Enter occupation (optional)"
                  value={formik.values.parentOccupation || ''}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={submitted}
                />
              </div>

              <div className="form-group">
                <label htmlFor="parentPhone">Parent Phone *</label>
                <input
                  id="parentPhone"
                  name="parentPhone"
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                  value={formik.values.parentPhone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={submitted}
                  className={formik.touched.parentPhone && formik.errors.parentPhone ? 'error' : ''}
                />
                {formik.touched.parentPhone && formik.errors.parentPhone && (
                  <span className="field-error">{formik.errors.parentPhone}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="parentEmail">Parent Email</label>
              <input
                id="parentEmail"
                name="parentEmail"
                type="email"
                placeholder="Enter email address (optional)"
                value={formik.values.parentEmail || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={submitted}
                className={formik.touched.parentEmail && formik.errors.parentEmail ? 'error' : ''}
              />
              {formik.touched.parentEmail && formik.errors.parentEmail && (
                <span className="field-error">{formik.errors.parentEmail}</span>
              )}
            </div>
          </section>

          <section className="form-section">
            <h2>Financial Condition</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="annualIncome">Annual Income (₹)</label>
                <input
                  id="annualIncome"
                  name="annualIncome"
                  type="number"
                  min="0"
                  placeholder="Enter annual income in rupees"
                  value={formik.values.annualIncome || ''}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={submitted}
                  className={formik.touched.annualIncome && formik.errors.annualIncome ? 'error' : ''}
                />
                {formik.touched.annualIncome && formik.errors.annualIncome && (
                  <span className="field-error">{formik.errors.annualIncome}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="familyMembers">Family Members</label>
                <input
                  id="familyMembers"
                  name="familyMembers"
                  type="number"
                  min="1"
                  placeholder="Enter number of family members"
                  value={formik.values.familyMembers || ''}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={submitted}
                  className={formik.touched.familyMembers && formik.errors.familyMembers ? 'error' : ''}
                />
                {formik.touched.familyMembers && formik.errors.familyMembers && (
                  <span className="field-error">{formik.errors.familyMembers}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="financialRemarks">Financial Remarks</label>
              <textarea
                id="financialRemarks"
                name="financialRemarks"
                rows={4}
                placeholder="Enter any additional financial information or remarks (optional)"
                value={formik.values.financialRemarks || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={submitted}
              />
            </div>
          </section>

          <section className="form-section">
            <h2>Address & Contact</h2>
            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <textarea
                id="address"
                name="address"
                rows={3}
                placeholder="Enter complete residential address"
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={submitted}
                className={formik.touched.address && formik.errors.address ? 'error' : ''}
              />
              {formik.touched.address && formik.errors.address && (
                <span className="field-error">{formik.errors.address}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="district">District *</label>
                <input
                  id="district"
                  name="district"
                  type="text"
                  placeholder="Enter district name"
                  value={formik.values.district}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={submitted}
                  className={formik.touched.district && formik.errors.district ? 'error' : ''}
                />
                {formik.touched.district && formik.errors.district && (
                  <span className="field-error">{formik.errors.district}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="state">State *</label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  placeholder="Enter state name"
                  value={formik.values.state}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={submitted}
                  className={formik.touched.state && formik.errors.state ? 'error' : ''}
                />
                {formik.touched.state && formik.errors.state && (
                  <span className="field-error">{formik.errors.state}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="pincode">Pincode *</label>
                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit pincode"
                  value={formik.values.pincode}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={submitted}
                  className={formik.touched.pincode && formik.errors.pincode ? 'error' : ''}
                />
                {formik.touched.pincode && formik.errors.pincode && (
                  <span className="field-error">{formik.errors.pincode}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Contact Phone *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter 10-digit contact number"
                  maxLength={10}
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={submitted}
                  className={formik.touched.phone && formik.errors.phone ? 'error' : ''}
                />
                {formik.touched.phone && formik.errors.phone && (
                  <span className="field-error">{formik.errors.phone}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email address (optional)"
                  value={formik.values.email || ''}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={submitted}
                  className={formik.touched.email && formik.errors.email ? 'error' : ''}
                />
                {formik.touched.email && formik.errors.email && (
                  <span className="field-error">{formik.errors.email}</span>
                )}
              </div>
            </div>
          </section>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-lg submit-registration-btn"
              disabled={submitting || submitted || schools.length === 0}
            >
              {submitting ? (
                <>
                  <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                  <span>Submit Registration</span>
                </>
              )}
            </button>
            {submitted && (
              <p className="submitted-note">
                This form has been submitted and is now locked. No further edits are allowed.
              </p>
            )}
          </div>
        </form>
      </main>
    </div>
  );
};

export default RegisterStudent;
