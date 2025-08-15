import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Toaster } from 'sonner'

// Mock data for testing
export const mockStudentInfo = {
  STUDENT_ID: 'SV001',
  FULL_NAME: 'Nguyen Van Test',
  CLASS_ID: 'CNTT01',
  FACULTY_ID: 'IT',
  EMAIL: 'test@example.com',
  PHONE: '0123456789',
  ADDRESS: 'Test Address',
  DATE_OF_BIRTH: '2000-01-01',
  GENDER: 'Male',
  STATUS: 'Active'
}

export const mockCreditClass = {
  CREDIT_CLASS_ID: 1,
  SUBJECT_ID: 'IT001',
  SUBJECT_NAME: 'Web Programming',
  LECTURER_NAME: 'Dr. Test Teacher',
  GROUP_NUMBER: 1,
  MIN_STUDENTS: 10,
  ENROLLED_STUDENTS: 15,
  ACADEMIC_YEAR: '2023-2024',
  SEMESTER: 1,
  FACULTY_ID: 'IT'
}

export const mockEnrolledClass = {
  CREDIT_CLASS_ID: 1,
  SUBJECT_NAME: 'Web Programming',
  LECTURER_NAME: 'Dr. Test Teacher',
  GROUP: 1,
  ACADEMIC_YEAR: '2023-2024',
  SEMESTER: 1
}

export const mockUser = {
  username: 'SV001',
  isStudent: true,
  department: {
    branch_name: 'IT Department',
    server_name: 'IT_SERVER'
  }
}

// Mock API responses
export const mockApiResponses = {
  studentSuccess: {
    success: true,
    student: mockStudentInfo
  },
  creditClassesSuccess: {
    success: true,
    creditClasses: [mockCreditClass]
  },
  enrolledClassesSuccess: {
    success: true,
    enrolledClasses: [mockEnrolledClass]
  },
  enrollmentSuccess: {
    success: true,
    message: 'Enrollment successful'
  },
  academicYearsSuccess: {
    success: true,
    academicYears: ['2023-2024', '2024-2025']
  },
  semestersSuccess: {
    success: true,
    semesters: ['1', '2']
  }
}

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
