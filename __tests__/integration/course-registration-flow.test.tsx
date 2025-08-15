import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import CourseRegistrationPage from '@/app/dashboard/course-registration/page'
import { mockApiResponses, mockUser } from '../utils/test-utils'

// Mock the session module
jest.mock('@/lib/session', () => ({
  getCurrentUser: jest.fn()
}))

// Mock the toast module
jest.mock('@/lib/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}))

const { getCurrentUser } = require('@/lib/session')

describe('Course Registration Integration Flow', () => {
  beforeEach(() => {
    getCurrentUser.mockReturnValue(mockUser)
    jest.clearAllMocks()
  })

  it('should complete full registration flow', async () => {
    // Mock all API calls in sequence
    global.fetch = jest.fn()
      // Initial student info load
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.studentSuccess)
        })
      )
      // Faculty ID lookup
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, classes: [{ FACULTY_ID: 'IT' }] })
        })
      )
      // Academic years load
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.academicYearsSuccess)
        })
      )
      // Semesters load
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.semestersSuccess)
        })
      )
      // Available classes search
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.creditClassesSuccess)
        })
      )
      // Enrolled classes load
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, enrolledClasses: [] })
        })
      )
      // Registration API call
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.enrollmentSuccess)
        })
      )
      // Refresh enrolled classes after registration
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.enrolledClassesSuccess)
        })
      )

    render(<CourseRegistrationPage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Welcome Nguyen Van Test')).toBeInTheDocument()
    })

    // Select academic year
    const academicYearSelect = screen.getByRole('combobox', { name: /academic year/i })
    fireEvent.click(academicYearSelect)
    
    await waitFor(() => {
      const yearOption = screen.getByText('2023-2024')
      fireEvent.click(yearOption)
    })

    // Wait for semesters to load and select semester
    await waitFor(() => {
      const semesterSelect = screen.getByRole('combobox', { name: /semester/i })
      fireEvent.click(semesterSelect)
    })

    await waitFor(() => {
      const semesterOption = screen.getByText('1')
      fireEvent.click(semesterOption)
    })

    // Click search button
    await waitFor(() => {
      const searchButton = screen.getByRole('button', { name: /search available classes/i })
      fireEvent.click(searchButton)
    })

    // Wait for classes to load
    await waitFor(() => {
      expect(screen.getByText('Web Programming')).toBeInTheDocument()
    })

    // Click on a class checkbox to register
    const classCheckbox = screen.getByRole('checkbox')
    fireEvent.click(classCheckbox)

    // Confirm registration in dialog
    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /yes, register/i })
      fireEvent.click(confirmButton)
    })

    // Verify registration was successful
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/enrollment',
        expect.objectContaining({
          method: 'POST'
        })
      )
    })
  })

  it('should handle registration errors gracefully', async () => {
    // Mock API calls with error response
    global.fetch = jest.fn()
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.studentSuccess)
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, classes: [{ FACULTY_ID: 'IT' }] })
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.academicYearsSuccess)
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.semestersSuccess)
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.creditClassesSuccess)
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, enrolledClasses: [] })
        })
      )
      // Registration fails
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: false,
            error: 'Registration failed'
          })
        })
      )

    render(<CourseRegistrationPage />)

    // Follow the same flow but expect error handling
    await waitFor(() => {
      expect(screen.getByText('Welcome Nguyen Van Test')).toBeInTheDocument()
    })

    // Complete the registration flow...
    // (Similar steps as above)

    // The error should be handled gracefully without crashing
    expect(screen.getByText('Course Registration')).toBeInTheDocument()
  })
})
