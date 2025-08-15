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

describe('Course Registration Page', () => {
  beforeEach(() => {
    getCurrentUser.mockReturnValue(mockUser)
    
    // Mock fetch responses
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
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render course registration page', async () => {
    render(<CourseRegistrationPage />)
    
    expect(screen.getByText('Course Registration')).toBeInTheDocument()
    expect(screen.getByText('Register for credit classes')).toBeInTheDocument()
  })

  it('should display student information when loaded', async () => {
    render(<CourseRegistrationPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Welcome Nguyen Van Test')).toBeInTheDocument()
    })
  })

  it('should load academic years on mount', async () => {
    render(<CourseRegistrationPage />)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/academic-years')
      )
    })
  })

  it('should show search button when academic year and semester are selected', async () => {
    render(<CourseRegistrationPage />)
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Welcome Nguyen Van Test')).toBeInTheDocument()
    })

    // Find and click academic year select
    const academicYearSelect = screen.getByRole('combobox', { name: /academic year/i })
    fireEvent.click(academicYearSelect)
    
    // Select an academic year
    const yearOption = screen.getByText('2023-2024')
    fireEvent.click(yearOption)

    // Mock semester response
    global.fetch = jest.fn().mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.semestersSuccess)
      })
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /search available classes/i })).toBeInTheDocument()
    })
  })

  it('should search for available classes when search button is clicked', async () => {
    render(<CourseRegistrationPage />)
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Welcome Nguyen Van Test')).toBeInTheDocument()
    })

    // Mock the search response
    global.fetch = jest.fn()
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.creditClassesSuccess)
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.enrolledClassesSuccess)
        })
      )

    // Simulate search button click
    const searchButton = screen.getByRole('button', { name: /search available classes/i })
    fireEvent.click(searchButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/credit-classes')
      )
    })
  })

  it('should display available classes after search', async () => {
    render(<CourseRegistrationPage />)
    
    // Wait for initial load and mock search
    await waitFor(() => {
      expect(screen.getByText('Welcome Nguyen Van Test')).toBeInTheDocument()
    })

    // Mock successful search
    global.fetch = jest.fn()
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.creditClassesSuccess)
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.enrolledClassesSuccess)
        })
      )

    const searchButton = screen.getByRole('button', { name: /search available classes/i })
    fireEvent.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText('Web Programming')).toBeInTheDocument()
      expect(screen.getByText('Dr. Test Teacher')).toBeInTheDocument()
    })
  })

  it('should show enrolled classes table', async () => {
    render(<CourseRegistrationPage />)
    
    await waitFor(() => {
      expect(screen.getByText('My Enrolled Classes')).toBeInTheDocument()
    })
  })
})
