"use client"

import { useEffect } from "react"
import { useRoleAccess } from "@/hooks/use-role-access"
import { DashboardPage } from "@/lib/types/role-permissions"

interface PageAccessGuardProps {
  page: DashboardPage
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PageAccessGuard({ 
  page, 
  children, 
  fallback 
}: PageAccessGuardProps) {
  const { checkPageAccess, enforcePageAccess, isLoading, getUserRoleInfo } = useRoleAccess()

  useEffect(() => {
    if (!isLoading) {
      enforcePageAccess(page)
    }
  }, [page, isLoading, enforcePageAccess])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!checkPageAccess(page)) {
    if (fallback) {
      return <>{fallback}</>
    }

    const roleInfo = getUserRoleInfo()
    
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            Your role ({roleInfo.displayName}) does not have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">
            {roleInfo.description}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
