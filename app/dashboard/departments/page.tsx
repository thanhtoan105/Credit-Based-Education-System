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
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  BookOpen,
  GraduationCap,
  Building
} from 'lucide-react';

// Mock department data
const departments = [
  {
    id: 'CS',
    name: 'Computer Science',
    head: 'Dr. Nguyen Van A',
    email: 'cs@university.edu',
    phone: '+84 123 456 789',
    students: 342,
    faculty: 18,
    courses: 24,
    status: 'Active',
    description: 'Department of Computer Science and Information Technology'
  },
  {
    id: 'BUS',
    name: 'Business Administration',
    head: 'Prof. Tran Thi B',
    email: 'business@university.edu',
    phone: '+84 987 654 321',
    students: 289,
    faculty: 15,
    courses: 20,
    status: 'Active',
    description: 'Department of Business Administration and Management'
  },
  {
    id: 'ENG',
    name: 'Engineering',
    head: 'Dr. Le Van C',
    email: 'engineering@university.edu',
    phone: '+84 456 789 123',
    students: 198,
    faculty: 12,
    courses: 18,
    status: 'Active',
    description: 'Department of Civil and Mechanical Engineering'
  },
  {
    id: 'ARTS',
    name: 'Liberal Arts',
    head: 'Prof. Pham Thi D',
    email: 'arts@university.edu',
    phone: '+84 321 654 987',
    students: 156,
    faculty: 10,
    courses: 15,
    status: 'Active',
    description: 'Department of Liberal Arts and Humanities'
  }
];

export default function DepartmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.head.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      case 'Under Review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-600 mt-1">Manage academic departments and their operations</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-50 text-blue-600 hover:bg-blue-100">
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
              <DialogDescription>
                Create a new academic department with basic information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deptId">Department ID</Label>
                  <Input id="deptId" placeholder="CS" className="border-sky-300 focus:border-sky-500 focus:ring-sky-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deptName">Department Name</Label>
                  <Input id="deptName" placeholder="Computer Science" className="border-sky-300 focus:border-sky-500 focus:ring-sky-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Department description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="head">Department Head</Label>
                  <Input id="head" placeholder="Dr. John Doe" className="border-sky-300 focus:border-sky-500 focus:ring-sky-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="dept@university.edu" className="border-sky-300 focus:border-sky-500 focus:ring-sky-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+84 123 456 789" className="border-sky-300 focus:border-sky-500 focus:ring-sky-500" />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-blue-50 text-blue-600 hover:bg-blue-100">
                Add Department
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Departments</p>
              <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{departments.reduce((sum, d) => sum + d.students, 0)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <GraduationCap className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Faculty</p>
              <p className="text-2xl font-bold text-gray-900">{departments.reduce((sum, d) => sum + d.faculty, 0)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
              <BookOpen className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{departments.reduce((sum, d) => sum + d.courses, 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Departments</CardTitle>
          <CardDescription>Find departments by name, ID, or department head</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-sky-300 focus:border-sky-500 focus:ring-sky-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Departments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Departments ({filteredDepartments.length})</CardTitle>
          <CardDescription>
            {filteredDepartments.length} departments found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Department Head</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Faculty</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.map((dept) => (
                <TableRow key={dept.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">{dept.name}</div>
                      <div className="text-sm text-gray-500">{dept.id}</div>
                      <div className="text-sm text-gray-500 mt-1">{dept.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>{dept.head}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="text-gray-900">{dept.email}</div>
                      <div className="text-gray-500">{dept.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{dept.students}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{dept.faculty}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{dept.courses}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(dept.status)}>
                      {dept.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Department
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Department
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}