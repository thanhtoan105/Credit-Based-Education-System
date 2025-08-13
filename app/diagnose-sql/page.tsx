'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface DiagnosticResult {
  department: string;
  serverName: string;
  teacher: {
    serverName: string;
    connectionString: string;
    canConnect: boolean;
    error?: string;
    suggestions: string[];
  };
  student: {
    serverName: string;
    connectionString: string;
    canConnect: boolean;
    error?: string;
    suggestions: string[];
  };
}

interface DiagnosticResponse {
  success: boolean;
  results: DiagnosticResult[];
  timestamp: string;
  summary: {
    totalDepartments: number;
    teacherConnectionsWorking: number;
    studentConnectionsWorking: number;
  };
  error?: string;
}

export default function DiagnoseSQLPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    setDiagnostics(null);

    try {
      const response = await fetch('/api/diagnose-connection');
      const data = await response.json();
      setDiagnostics(data);
    } catch (error) {
      setDiagnostics({
        success: false,
        results: [],
        timestamp: new Date().toISOString(),
        summary: { totalDepartments: 0, teacherConnectionsWorking: 0, studentConnectionsWorking: 0 },
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (canConnect: boolean) => {
    return canConnect ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  const getStatusBadge = (canConnect: boolean) => {
    return (
      <Badge variant={canConnect ? "default" : "destructive"}>
        {canConnect ? "Connected" : "Failed"}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              SQL Server Connection Diagnostics
            </CardTitle>
            <CardDescription>
              Diagnose connection issues with your SQL Server instances and authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={runDiagnostics} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Diagnostics...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Run Diagnostics
                  </>
                )}
              </Button>
            </div>

            {diagnostics && (
              <div className="space-y-4">
                {diagnostics.success ? (
                  <>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Summary:</strong> {diagnostics.summary.totalDepartments} departments found. 
                        Teacher connections: {diagnostics.summary.teacherConnectionsWorking}/{diagnostics.summary.totalDepartments} working. 
                        Student connections: {diagnostics.summary.studentConnectionsWorking}/{diagnostics.summary.totalDepartments} working.
                      </AlertDescription>
                    </Alert>

                    <div className="grid gap-4">
                      {diagnostics.results.map((result, index) => (
                        <Card key={index} className="border-l-4 border-l-blue-500">
                          <CardHeader>
                            <CardTitle className="text-lg">{result.department}</CardTitle>
                            <CardDescription>Server: {result.serverName}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Teacher Connection */}
                            <div className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium flex items-center gap-2">
                                  {getStatusIcon(result.teacher.canConnect)}
                                  Teacher Connection (HTKN)
                                </h4>
                                {getStatusBadge(result.teacher.canConnect)}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{result.teacher.connectionString}</p>
                              
                              {!result.teacher.canConnect && (
                                <div className="space-y-2">
                                  <Alert variant="destructive">
                                    <AlertDescription>
                                      <strong>Error:</strong> {result.teacher.error}
                                    </AlertDescription>
                                  </Alert>
                                  
                                  {result.teacher.suggestions.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-1">Suggestions:</p>
                                      <ul className="text-sm text-gray-600 space-y-1">
                                        {result.teacher.suggestions.map((suggestion, i) => (
                                          <li key={i} className="flex items-start gap-2">
                                            <span className="text-blue-500">•</span>
                                            {suggestion}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Student Connection */}
                            <div className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium flex items-center gap-2">
                                  {getStatusIcon(result.student.canConnect)}
                                  Student Connection (SV)
                                </h4>
                                {getStatusBadge(result.student.canConnect)}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{result.student.connectionString}</p>
                              
                              {!result.student.canConnect && (
                                <div className="space-y-2">
                                  <Alert variant="destructive">
                                    <AlertDescription>
                                      <strong>Error:</strong> {result.student.error}
                                    </AlertDescription>
                                  </Alert>
                                  
                                  {result.student.suggestions.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-1">Suggestions:</p>
                                      <ul className="text-sm text-gray-600 space-y-1">
                                        {result.student.suggestions.map((suggestion, i) => (
                                          <li key={i} className="flex items-start gap-2">
                                            <span className="text-blue-500">•</span>
                                            {suggestion}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Diagnostics Failed:</strong> {diagnostics.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
