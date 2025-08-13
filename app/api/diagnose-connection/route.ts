import { NextRequest, NextResponse } from 'next/server';
import { MultiAuthService } from '@/lib/services/multi-auth.service';
import { DepartmentService } from '@/lib/services/department.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverName, isStudent = false } = body;

    if (!serverName) {
      return NextResponse.json({
        success: false,
        error: 'Server name is required'
      }, { status: 400 });
    }

    // Run connection diagnostics
    const diagnostics = await MultiAuthService.diagnoseConnection(serverName, isStudent);

    return NextResponse.json({
      success: true,
      diagnostics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Connection diagnostics error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get all departments and test their connections
    const departments = await DepartmentService.getDepartments();
    const results = [];

    for (const dept of departments) {
      // Test teacher connection
      const teacherDiag = await MultiAuthService.diagnoseConnection(dept.server_name, false);
      
      // Test student connection  
      const studentDiag = await MultiAuthService.diagnoseConnection(dept.server_name, true);

      results.push({
        department: dept.branch_name,
        serverName: dept.server_name,
        teacher: teacherDiag,
        student: studentDiag
      });
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
      summary: {
        totalDepartments: departments.length,
        teacherConnectionsWorking: results.filter(r => r.teacher.canConnect).length,
        studentConnectionsWorking: results.filter(r => r.student.canConnect).length
      }
    });

  } catch (error) {
    console.error('Full diagnostics error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
