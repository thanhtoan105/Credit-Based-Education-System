import { NextRequest } from 'next/server'
import { POST, DELETE } from '@/app/api/enrollment/route'

// Mock dependencies
jest.mock('@/lib/multi-database', () => ({
  getDepartmentPool: jest.fn()
}))

jest.mock('@/lib/services/department.service', () => ({
  DepartmentService: {
    getDepartmentByBranchName: jest.fn()
  }
}))

jest.mock('mssql', () => ({
  __esModule: true,
  default: {
    Table: jest.fn().mockImplementation(() => ({
      columns: {
        add: jest.fn()
      },
      rows: {
        add: jest.fn()
      }
    })),
    Int: 'Int',
    NVarChar: jest.fn()
  }
}))

const { getDepartmentPool } = require('@/lib/multi-database')
const { DepartmentService } = require('@/lib/services/department.service')

describe('/api/enrollment', () => {
  const mockDepartment = {
    branch_name: 'IT Department',
    server_name: 'IT_SERVER'
  }

  const mockPool = {
    request: jest.fn().mockReturnValue({
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({
        recordset: []
      }),
      execute: jest.fn().mockResolvedValue({})
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    DepartmentService.getDepartmentByBranchName.mockResolvedValue(mockDepartment)
    getDepartmentPool.mockResolvedValue(mockPool)
  })

  describe('POST /api/enrollment', () => {
    it('should successfully enroll a student', async () => {
      const requestBody = {
        departmentName: 'IT Department',
        studentId: 'SV001',
        creditClassId: 1
      }

      const request = new NextRequest('http://localhost:3000/api/enrollment', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Enrollment successful')
    })

    it('should return error for missing parameters', async () => {
      const requestBody = {
        departmentName: 'IT Department'
        // Missing studentId and creditClassId
      }

      const request = new NextRequest('http://localhost:3000/api/enrollment', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.error).toContain('required')
    })

    it('should return error for invalid department', async () => {
      DepartmentService.getDepartmentByBranchName.mockResolvedValue(null)

      const requestBody = {
        departmentName: 'Invalid Department',
        studentId: 'SV001',
        creditClassId: 1
      }

      const request = new NextRequest('http://localhost:3000/api/enrollment', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toContain('not found')
    })
  })

  describe('DELETE /api/enrollment', () => {
    it('should successfully cancel enrollment', async () => {
      const requestBody = {
        departmentName: 'IT Department',
        studentId: 'SV001',
        creditClassId: 1
      }

      const request = new NextRequest('http://localhost:3000/api/enrollment', {
        method: 'DELETE',
        body: JSON.stringify(requestBody)
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Enrollment cancelled successfully')
    })
  })
})
