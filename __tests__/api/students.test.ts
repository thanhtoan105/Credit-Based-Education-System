import { NextRequest } from 'next/server'
import { GET } from '@/app/api/students/route'

// Mock dependencies
jest.mock('@/lib/multi-database', () => ({
  getDepartmentPool: jest.fn()
}))

jest.mock('@/lib/services/department.service', () => ({
  DepartmentService: {
    getDepartmentByBranchName: jest.fn()
  }
}))

const { getDepartmentPool } = require('@/lib/multi-database')
const { DepartmentService } = require('@/lib/services/department.service')

describe('/api/students', () => {
  const mockDepartment = {
    branch_name: 'IT Department',
    server_name: 'IT_SERVER'
  }

  const mockStudentData = {
    STUDENT_ID: 'SV001',
    FULL_NAME: 'Nguyen Van Test',
    CLASS_ID: 'CNTT01',
    EMAIL: 'test@example.com'
  }

  const mockPool = {
    request: jest.fn().mockReturnValue({
      input: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({
        recordset: [mockStudentData]
      })
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    DepartmentService.getDepartmentByBranchName.mockResolvedValue(mockDepartment)
    getDepartmentPool.mockResolvedValue(mockPool)
  })

  it('should return student data successfully', async () => {
    const url = new URL('http://localhost:3000/api/students?department=IT%20Department&studentId=SV001')
    const request = new NextRequest(url)

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.student).toEqual(mockStudentData)
  })

  it('should return error for missing parameters', async () => {
    const url = new URL('http://localhost:3000/api/students')
    const request = new NextRequest(url)

    const response = await GET(request)
    const data = await response.json()

    expect(data.success).toBe(false)
    expect(data.error).toContain('required')
  })

  it('should return error for invalid department', async () => {
    DepartmentService.getDepartmentByBranchName.mockResolvedValue(null)

    const url = new URL('http://localhost:3000/api/students?department=Invalid&studentId=SV001')
    const request = new NextRequest(url)

    const response = await GET(request)
    const data = await response.json()

    expect(data.success).toBe(false)
    expect(data.error).toContain('not found')
  })

  it('should handle database errors', async () => {
    mockPool.request.mockReturnValue({
      input: jest.fn().mockReturnThis(),
      execute: jest.fn().mockRejectedValue(new Error('Database error'))
    })

    const url = new URL('http://localhost:3000/api/students?department=IT%20Department&studentId=SV001')
    const request = new NextRequest(url)

    const response = await GET(request)
    const data = await response.json()

    expect(data.success).toBe(false)
    expect(data.error).toContain('Failed to fetch student')
  })
})
