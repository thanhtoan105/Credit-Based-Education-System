'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableFooter 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText,
  Download,
  Printer,
  Users,
  GraduationCap,
  ClipboardList,
  DollarSign,
  BookOpen,
  Search
} from 'lucide-react';

// Types
interface CreditClass {
  id: string;
  courseName: string;
  courseCode: string;
  group: string;
  instructorName: string;
  minStudents: number;
  registeredStudents: number;
  academicYear: string;
  semester: string;
  facultyName: string;
}

interface Student {
  id: string;
  lastName: string;
  firstName: string;
  gender: string;
  classCode: string;
}

interface Grade {
  studentId: string;
  lastName: string;
  firstName: string;
  attendance: number;
  midterm: number;
  finalExam: number;
  totalGrade: number;
}

interface PaymentRecord {
  studentName: string;
  tuitionFee: number;
  amountPaid: number;
}

interface TranscriptRecord {
  studentId: string;
  studentName: string;
  subjects: { [key: string]: string };
}

// Mock data
const mockCreditClasses: CreditClass[] = [
  {
    id: 'CC001',
    courseName: 'Cấu trúc dữ liệu & Giải thuật',
    courseCode: 'CTDL',
    group: 'A1',
    instructorName: 'Dr. Nguyen Van A',
    minStudents: 20,
    registeredStudents: 18,
    academicYear: '2024-2025',
    semester: '1',
    facultyName: 'Faculty of Information Technology'
  },
  {
    id: 'CC002',
    courseName: 'Cơ sở dữ liệu',
    courseCode: 'CSDL',
    group: 'B1',
    instructorName: 'Dr. Tran Thi B',
    minStudents: 25,
    registeredStudents: 30,
    academicYear: '2024-2025',
    semester: '1',
    facultyName: 'Faculty of Information Technology'
  }
];

const mockStudents: Student[] = [
  { id: 'SV001', lastName: 'Nguyen', firstName: 'Van A', gender: 'Male', classCode: 'CNTT01' },
  { id: 'SV002', lastName: 'Tran', firstName: 'Thi B', gender: 'Female', classCode: 'CNTT01' },
  { id: 'SV003', lastName: 'Le', firstName: 'Van C', gender: 'Male', classCode: 'CNTT02' }
];

const mockGrades: Grade[] = [
  { studentId: 'SV001', lastName: 'Nguyen', firstName: 'Van A', attendance: 9.5, midterm: 8.5, finalExam: 8.0, totalGrade: 8.3 },
  { studentId: 'SV002', lastName: 'Tran', firstName: 'Thi B', attendance: 9.0, midterm: 9.0, finalExam: 8.5, totalGrade: 8.7 }
];

export default function ReportsPage() {
  const { toast } = useToast();
  
  // Form states
  const [report1Form, setReport1Form] = useState({ academicYear: '', semester: '', faculty: 'Faculty of Information Technology' });
  const [report2Form, setReport2Form] = useState({ academicYear: '', semester: '', course: '', group: '' });
  const [report3Form, setReport3Form] = useState({ academicYear: '', semester: '', course: '', group: '' });
  const [report4Form, setReport4Form] = useState({ studentId: '' });
  const [report5Form, setReport5Form] = useState({ classCode: '', academicYear: '', semester: '' });
  const [report6Form, setReport6Form] = useState({ classCode: '' });
  
  // Data states
  const [creditClassesData, setCreditClassesData] = useState<CreditClass[]>([]);
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [gradesData, setGradesData] = useState<Grade[]>([]);
  const [paymentsData, setPaymentsData] = useState<PaymentRecord[]>([]);
  const [transcriptData, setTranscriptData] = useState<TranscriptRecord[]>([]);
  const [studentGradeData, setStudentGradeData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);

  // Generate Report 1: List of Available Credit Classes
  const generateReport1 = () => {
    if (!report1Form.academicYear || !report1Form.semester) {
      toast({
        title: "Missing Information",
        description: "Please select academic year and semester.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const filtered = mockCreditClasses.filter(cls => 
        cls.academicYear === report1Form.academicYear && 
        cls.semester === report1Form.semester
      ).sort((a, b) => a.courseName.localeCompare(b.courseName));
      
      setCreditClassesData(filtered);
      setLoading(false);
      
      toast({
        title: "Report Generated",
        description: `Found ${filtered.length} credit classes`,
      });
    }, 1000);
  };

  // Generate Report 2: Students Registered for Credit Class
  const generateReport2 = () => {
    if (!report2Form.academicYear || !report2Form.semester || !report2Form.course || !report2Form.group) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const sorted = [...mockStudents].sort((a, b) => 
        a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
      );
      setStudentsData(sorted);
      setLoading(false);
      
      toast({
        title: "Report Generated",
        description: `Found ${sorted.length} registered students`,
      });
    }, 1000);
  };

  // Generate Report 3: Course Grade Report
  const generateReport3 = () => {
    if (!report3Form.academicYear || !report3Form.semester || !report3Form.course || !report3Form.group) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const sorted = [...mockGrades].sort((a, b) => 
        a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
      );
      setGradesData(sorted);
      setLoading(false);
      
      toast({
        title: "Report Generated",
        description: `Generated grade report for ${sorted.length} students`,
      });
    }, 1000);
  };

  // Generate Report 4: Individual Student Grade Slip
  const generateReport4 = () => {
    if (!report4Form.studentId) {
      toast({
        title: "Missing Information",
        description: "Please enter student ID.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const mockStudentGrades = [
        { courseName: 'Cấu trúc dữ liệu & Giải thuật', grade: 'A' },
        { courseName: 'Cơ sở dữ liệu', grade: 'B+' },
        { courseName: 'Lập trình hướng đối tượng', grade: 'A-' }
      ];
      setStudentGradeData(mockStudentGrades);
      setLoading(false);
      
      toast({
        title: "Report Generated",
        description: `Generated grade slip for student ${report4Form.studentId}`,
      });
    }, 1000);
  };

  // Generate Report 5: Tuition Payment Report
  const generateReport5 = () => {
    if (!report5Form.classCode || !report5Form.academicYear || !report5Form.semester) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const mockPayments: PaymentRecord[] = [
        { studentName: 'Nguyen Van A', tuitionFee: 5000000, amountPaid: 5000000 },
        { studentName: 'Tran Thi B', tuitionFee: 5000000, amountPaid: 3000000 },
        { studentName: 'Le Van C', tuitionFee: 5000000, amountPaid: 5000000 }
      ];
      setPaymentsData(mockPayments);
      setLoading(false);
      
      toast({
        title: "Report Generated",
        description: `Generated payment report for ${mockPayments.length} students`,
      });
    }, 1000);
  };

  // Generate Report 6: Final Transcript
  const generateReport6 = () => {
    if (!report6Form.classCode) {
      toast({
        title: "Missing Information",
        description: "Please enter class code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const mockTranscript: TranscriptRecord[] = [
        { 
          studentId: 'SV001', 
          studentName: 'Nguyen Van A', 
          subjects: { 'CTDL': 'A', 'CSDL': 'B+', 'OOP': 'A-' }
        },
        { 
          studentId: 'SV002', 
          studentName: 'Tran Thi B', 
          subjects: { 'CTDL': 'A-', 'CSDL': 'A', 'OOP': 'B+' }
        }
      ];
      setTranscriptData(mockTranscript);
      setLoading(false);
      
      toast({
        title: "Report Generated",
        description: `Generated transcript for ${mockTranscript.length} students`,
      });
    }, 1000);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Export to PDF (placeholder)
  const handleExportPDF = () => {
    toast({
      title: "Export to PDF",
      description: "PDF export functionality would be implemented here.",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="bg-primary p-2 rounded-md">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Reports & Printing</h1>
              <p className="text-sm text-muted-foreground">
                Generate and print various academic reports
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="report1" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="report1" className="text-xs">Credit Classes</TabsTrigger>
            <TabsTrigger value="report2" className="text-xs">Class Students</TabsTrigger>
            <TabsTrigger value="report3" className="text-xs">Grade Report</TabsTrigger>
            <TabsTrigger value="report4" className="text-xs">Grade Slip</TabsTrigger>
            <TabsTrigger value="report5" className="text-xs">Payment Report</TabsTrigger>
            <TabsTrigger value="report6" className="text-xs">Transcript</TabsTrigger>
          </TabsList>

          {/* Report 1: List of Available Credit Classes */}
          <TabsContent value="report1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  List of Available Credit Classes
                </CardTitle>
                <CardDescription>
                  Generate a list of credit classes by academic year and semester
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Faculty</Label>
                    <Input value={report1Form.faculty} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Academic Year</Label>
                    <Select value={report1Form.academicYear} onValueChange={(value) => setReport1Form({...report1Form, academicYear: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024-2025">2024-2025</SelectItem>
                        <SelectItem value="2025-2026">2025-2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select value={report1Form.semester} onValueChange={(value) => setReport1Form({...report1Form, semester: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semester 1</SelectItem>
                        <SelectItem value="2">Semester 2</SelectItem>
                        <SelectItem value="3">Semester 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={generateReport1} disabled={loading} className="w-full">
                      <Search className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </div>
                </div>

                {creditClassesData.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Report Results</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrint}>
                          <Printer className="mr-2 h-4 w-4" />
                          Print
                        </Button>
                        <Button variant="outline" onClick={handleExportPDF}>
                          <Download className="mr-2 h-4 w-4" />
                          Export PDF
                        </Button>
                      </div>
                    </div>
                    
                    <Card className="print-area">
                      <CardContent className="p-6">
                        <div className="text-center mb-6 space-y-1">
                          <h2 className="text-xl font-bold">LIST OF AVAILABLE CREDIT CLASSES</h2>
                          <p className="text-muted-foreground">FACULTY: {report1Form.faculty}</p>
                          <p className="text-muted-foreground">Academic Year: {report1Form.academicYear} | Semester: {report1Form.semester}</p>
                        </div>
                        
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">#</TableHead>
                              <TableHead>Course Name</TableHead>
                              <TableHead>Group</TableHead>
                              <TableHead>Instructor</TableHead>
                              <TableHead>Min Students</TableHead>
                              <TableHead>Registered Students</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {creditClassesData.map((cls, index) => (
                              <TableRow key={cls.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">{cls.courseName}</TableCell>
                                <TableCell>{cls.group}</TableCell>
                                <TableCell>{cls.instructorName}</TableCell>
                                <TableCell>{cls.minStudents}</TableCell>
                                <TableCell>{cls.registeredStudents}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableFooter>
                            <TableRow>
                              <TableCell colSpan={6} className="text-center font-semibold">
                                Total classes opened: {creditClassesData.length}
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Report 2: Students Registered for Credit Class */}
          <TabsContent value="report2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Students Registered for Credit Class
                </CardTitle>
                <CardDescription>
                  Generate a list of students registered for a specific credit class
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>Academic Year</Label>
                    <Select value={report2Form.academicYear} onValueChange={(value) => setReport2Form({...report2Form, academicYear: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024-2025">2024-2025</SelectItem>
                        <SelectItem value="2025-2026">2025-2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select value={report2Form.semester} onValueChange={(value) => setReport2Form({...report2Form, semester: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semester 1</SelectItem>
                        <SelectItem value="2">Semester 2</SelectItem>
                        <SelectItem value="3">Semester 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <Select value={report2Form.course} onValueChange={(value) => setReport2Form({...report2Form, course: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CTDL">CTDL - Cấu trúc dữ liệu</SelectItem>
                        <SelectItem value="CSDL">CSDL - Cơ sở dữ liệu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Group</Label>
                    <Select value={report2Form.group} onValueChange={(value) => setReport2Form({...report2Form, group: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A1">A1</SelectItem>
                        <SelectItem value="B1">B1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={generateReport2} disabled={loading} className="w-full">
                      <Search className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </div>
                </div>

                {studentsData.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Report Results</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrint}>
                          <Printer className="mr-2 h-4 w-4" />
                          Print
                        </Button>
                        <Button variant="outline" onClick={handleExportPDF}>
                          <Download className="mr-2 h-4 w-4" />
                          Export PDF
                        </Button>
                      </div>
                    </div>
                    
                    <Card className="print-area">
                      <CardContent className="p-6">
                        <div className="text-center mb-6 space-y-1">
                          <h2 className="text-xl font-bold">LIST OF STUDENTS REGISTERED FOR CREDIT CLASS</h2>
                          <p className="text-muted-foreground">FACULTY: Faculty of Information Technology</p>
                          <p className="text-muted-foreground">Academic Year: {report2Form.academicYear} | Semester: {report2Form.semester}</p>
                          <p className="text-muted-foreground">Course: {report2Form.course} – Group: {report2Form.group}</p>
                        </div>
                        
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">#</TableHead>
                              <TableHead>Student ID</TableHead>
                              <TableHead>Last Name</TableHead>
                              <TableHead>First Name</TableHead>
                              <TableHead>Gender</TableHead>
                              <TableHead>Class Code</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentsData.map((student, index) => (
                              <TableRow key={student.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">{student.id}</TableCell>
                                <TableCell>{student.lastName}</TableCell>
                                <TableCell>{student.firstName}</TableCell>
                                <TableCell>{student.gender}</TableCell>
                                <TableCell>{student.classCode}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableFooter>
                            <TableRow>
                              <TableCell colSpan={6} className="text-center font-semibold">
                                Total students registered: {studentsData.length}
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Report 3: Course Grade Report */}
          <TabsContent value="report3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Course Grade Report for Credit Class
                </CardTitle>
                <CardDescription>
                  Generate grade report for students in a specific credit class
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>Academic Year</Label>
                    <Select value={report3Form.academicYear} onValueChange={(value) => setReport3Form({...report3Form, academicYear: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024-2025">2024-2025</SelectItem>
                        <SelectItem value="2025-2026">2025-2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select value={report3Form.semester} onValueChange={(value) => setReport3Form({...report3Form, semester: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semester 1</SelectItem>
                        <SelectItem value="2">Semester 2</SelectItem>
                        <SelectItem value="3">Semester 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <Select value={report3Form.course} onValueChange={(value) => setReport3Form({...report3Form, course: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CTDL">CTDL - Cấu trúc dữ liệu</SelectItem>
                        <SelectItem value="CSDL">CSDL - Cơ sở dữ liệu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Group</Label>
                    <Select value={report3Form.group} onValueChange={(value) => setReport3Form({...report3Form, group: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A1">A1</SelectItem>
                        <SelectItem value="B1">B1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={generateReport3} disabled={loading} className="w-full">
                      <Search className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </div>
                </div>

                {gradesData.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Grade Report</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrint}>
                          <Printer className="mr-2 h-4 w-4" />
                          Print
                        </Button>
                        <Button variant="outline" onClick={handleExportPDF}>
                          <Download className="mr-2 h-4 w-4" />
                          Export PDF
                        </Button>
                      </div>
                    </div>
                    
                    <Card className="print-area">
                      <CardContent className="p-6">
                        <div className="text-center mb-6 space-y-1">
                          <h2 className="text-xl font-bold">FINAL GRADE REPORT</h2>
                          <p className="text-muted-foreground">FACULTY: Faculty of Information Technology</p>
                          <p className="text-muted-foreground">Academic Year: {report3Form.academicYear} | Semester: {report3Form.semester}</p>
                          <p className="text-muted-foreground">Course: {report3Form.course} – Group: {report3Form.group}</p>
                        </div>
                        
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">#</TableHead>
                              <TableHead>Student ID</TableHead>
                              <TableHead>Last Name</TableHead>
                              <TableHead>First Name</TableHead>
                              <TableHead>Attendance</TableHead>
                              <TableHead>Midterm</TableHead>
                              <TableHead>Final Exam</TableHead>
                              <TableHead>Total Grade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {gradesData.map((grade, index) => (
                              <TableRow key={grade.studentId}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">{grade.studentId}</TableCell>
                                <TableCell>{grade.lastName}</TableCell>
                                <TableCell>{grade.firstName}</TableCell>
                                <TableCell>{grade.attendance}</TableCell>
                                <TableCell>{grade.midterm}</TableCell>
                                <TableCell>{grade.finalExam}</TableCell>
                                <TableCell className="font-semibold">{grade.totalGrade}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableFooter>
                            <TableRow>
                              <TableCell colSpan={8} className="text-center font-semibold">
                                Total students: {gradesData.length}
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Report 4: Individual Student Grade Slip */}
          <TabsContent value="report4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Individual Student Grade Slip
                </CardTitle>
                <CardDescription>
                  Print grade slip for an individual student
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Student ID</Label>
                    <Input 
                      placeholder="Enter Student ID (e.g., SV001)"
                      value={report4Form.studentId}
                      onChange={(e) => setReport4Form({...report4Form, studentId: e.target.value})}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={generateReport4} disabled={loading} className="w-full">
                      <Search className="mr-2 h-4 w-4" />
                      Generate Grade Slip
                    </Button>
                  </div>
                </div>

                {studentGradeData.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Grade Slip</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrint}>
                          <Printer className="mr-2 h-4 w-4" />
                          Print
                        </Button>
                        <Button variant="outline" onClick={handleExportPDF}>
                          <Download className="mr-2 h-4 w-4" />
                          Export PDF
                        </Button>
                      </div>
                    </div>
                    
                    <Card className="print-area">
                      <CardContent className="p-6">
                        <div className="text-center mb-6 space-y-1">
                          <h2 className="text-xl font-bold">INDIVIDUAL GRADE SLIP</h2>
                          <p className="text-muted-foreground">Student ID: {report4Form.studentId}</p>
                          <p className="text-muted-foreground">Faculty of Information Technology</p>
                        </div>
                        
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">#</TableHead>
                              <TableHead>Course Name</TableHead>
                              <TableHead>Grade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentGradeData.map((course, index) => (
                              <TableRow key={index}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">{course.courseName}</TableCell>
                                <TableCell>
                                  <Badge variant={course.grade.startsWith('A') ? 'default' : course.grade.startsWith('B') ? 'secondary' : 'outline'}>
                                    {course.grade}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Report 5: Tuition Payment Report */}
          <TabsContent value="report5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Tuition Payment Report for Class
                </CardTitle>
                <CardDescription>
                  Generate tuition payment report for all students in a class
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Class Code</Label>
                    <Select value={report5Form.classCode} onValueChange={(value) => setReport5Form({...report5Form, classCode: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CNTT01">CNTT01</SelectItem>
                        <SelectItem value="CNTT02">CNTT02</SelectItem>
                        <SelectItem value="VT01">VT01</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Academic Year</Label>
                    <Select value={report5Form.academicYear} onValueChange={(value) => setReport5Form({...report5Form, academicYear: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024-2025">2024-2025</SelectItem>
                        <SelectItem value="2025-2026">2025-2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select value={report5Form.semester} onValueChange={(value) => setReport5Form({...report5Form, semester: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semester 1</SelectItem>
                        <SelectItem value="2">Semester 2</SelectItem>
                        <SelectItem value="3">Semester 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={generateReport5} disabled={loading} className="w-full">
                      <Search className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </div>
                </div>

                {paymentsData.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Payment Report</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrint}>
                          <Printer className="mr-2 h-4 w-4" />
                          Print
                        </Button>
                        <Button variant="outline" onClick={handleExportPDF}>
                          <Download className="mr-2 h-4 w-4" />
                          Export PDF
                        </Button>
                      </div>
                    </div>
                    
                    <Card className="print-area">
                      <CardContent className="p-6">
                        <div className="text-center mb-6 space-y-1">
                          <h2 className="text-xl font-bold">TUITION PAYMENT LIST</h2>
                          <p className="text-muted-foreground">CLASS CODE: {report5Form.classCode}</p>
                          <p className="text-muted-foreground">FACULTY: Faculty of Information Technology</p>
                        </div>
                        
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">#</TableHead>
                              <TableHead>Student Name</TableHead>
                              <TableHead>Tuition Fee</TableHead>
                              <TableHead>Amount Paid</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paymentsData.map((payment, index) => (
                              <TableRow key={index}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">{payment.studentName}</TableCell>
                                <TableCell>{formatCurrency(payment.tuitionFee)}</TableCell>
                                <TableCell>{formatCurrency(payment.amountPaid)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableFooter>
                            <TableRow>
                              <TableCell colSpan={2} className="font-semibold">Total students: {paymentsData.length}</TableCell>
                              <TableCell colSpan={2} className="font-semibold">
                                Total amount paid: {formatCurrency(paymentsData.reduce((sum, p) => sum + p.amountPaid, 0))}
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Report 6: Final Transcript */}
          <TabsContent value="report6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Final Transcript (Summary Grade Report)
                </CardTitle>
                <CardDescription>
                  Generate final transcript for all students in a class
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Class Code</Label>
                    <Select value={report6Form.classCode} onValueChange={(value) => setReport6Form({...report6Form, classCode: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CNTT01">CNTT01</SelectItem>
                        <SelectItem value="CNTT02">CNTT02</SelectItem>
                        <SelectItem value="VT01">VT01</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={generateReport6} disabled={loading} className="w-full">
                      <Search className="mr-2 h-4 w-4" />
                      Generate Transcript
                    </Button>
                  </div>
                </div>

                {transcriptData.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Final Transcript</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrint}>
                          <Printer className="mr-2 h-4 w-4" />
                          Print
                        </Button>
                        <Button variant="outline" onClick={handleExportPDF}>
                          <Download className="mr-2 h-4 w-4" />
                          Export PDF
                        </Button>
                      </div>
                    </div>
                    
                    <Card className="print-area">
                      <CardContent className="p-6">
                        <div className="text-center mb-6 space-y-1">
                          <h2 className="text-xl font-bold">FINAL TRANSCRIPT</h2>
                          <p className="text-muted-foreground">CLASS: {report6Form.classCode} – COURSE TERM: 2024-2025</p>
                          <p className="text-muted-foreground">FACULTY: Faculty of Information Technology</p>
                        </div>
                        
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student ID - Name</TableHead>
                              <TableHead>CTDL</TableHead>
                              <TableHead>CSDL</TableHead>
                              <TableHead>OOP</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transcriptData.map((record) => (
                              <TableRow key={record.studentId}>
                                <TableCell className="font-medium">
                                  {record.studentId} - {record.studentName}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{record.subjects.CTDL || '-'}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{record.subjects.CSDL || '-'}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{record.subjects.OOP || '-'}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
        </Tabs>
      </div>
    </div>
  );
} 