"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Save, CreditCard, User, Calendar, DollarSign } from "lucide-react";

// Interfaces
interface Student {
  id: string;
  name: string;
  class: string;
  departmentCode: string;
  year: string;
  email: string;
}

interface TuitionRecord {
  id: string;
  studentId: string;
  academicYear: string;
  semester: string;
  tuitionFee: number;
  amountPaid: number;
  amountDue: number;
  status: 'paid' | 'partial' | 'unpaid';
}

interface PaymentDetail {
  id: string;
  tuitionRecordId: string;
  paymentDate: string;
  amountPaid: number;
  paymentMethod: string;
  notes?: string;
}

// Mock data
const mockStudents: Student[] = [
  { id: "SV001", name: "Nguyen Van An", class: "CNTT-K65-A1", departmentCode: "CNTT", year: "2024-2025", email: "an.nv@student.edu" },
  { id: "SV002", name: "Tran Thi Binh", class: "CNTT-K65-A1", departmentCode: "CNTT", year: "2024-2025", email: "binh.tt@student.edu" },
  { id: "SV003", name: "Le Van Cuong", class: "CNTT-K65-A2", departmentCode: "CNTT", year: "2024-2025", email: "cuong.lv@student.edu" },
  { id: "SV004", name: "Pham Thi Dung", class: "VT-K65-B1", departmentCode: "VT", year: "2024-2025", email: "dung.pt@student.edu" },
  { id: "SV005", name: "Hoang Van Em", class: "VT-K65-B1", departmentCode: "VT", year: "2024-2025", email: "em.hv@student.edu" },
];

const initialTuitionRecords: TuitionRecord[] = [
  {
    id: "TR001",
    studentId: "SV001",
    academicYear: "2024-2025",
    semester: "1",
    tuitionFee: 15000000,
    amountPaid: 15000000,
    amountDue: 0,
    status: 'paid'
  },
  {
    id: "TR002",
    studentId: "SV001",
    academicYear: "2024-2025",
    semester: "2",
    tuitionFee: 15000000,
    amountPaid: 10000000,
    amountDue: 5000000,
    status: 'partial'
  },
  {
    id: "TR003",
    studentId: "SV001",
    academicYear: "2023-2024",
    semester: "1",
    tuitionFee: 14000000,
    amountPaid: 14000000,
    amountDue: 0,
    status: 'paid'
  },
];

const initialPaymentDetails: PaymentDetail[] = [
  {
    id: "PD001",
    tuitionRecordId: "TR001",
    paymentDate: "2024-01-15",
    amountPaid: 15000000,
    paymentMethod: "Bank Transfer",
    notes: "Full payment for semester 1"
  },
  {
    id: "PD002",
    tuitionRecordId: "TR002",
    paymentDate: "2024-02-20",
    amountPaid: 10000000,
    paymentMethod: "Cash",
    notes: "Partial payment"
  },
  {
    id: "PD003",
    tuitionRecordId: "TR003",
    paymentDate: "2023-08-10",
    amountPaid: 14000000,
    paymentMethod: "Bank Transfer",
    notes: "Full payment for semester 1"
  },
];

export default function TuitionPaymentPage() {
  // State management
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [tuitionRecords, setTuitionRecords] = useState<TuitionRecord[]>(initialTuitionRecords);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>(initialPaymentDetails);
  const [selectedTuitionRecord, setSelectedTuitionRecord] = useState<TuitionRecord | null>(null);
  const [isAddTuitionDialogOpen, setIsAddTuitionDialogOpen] = useState(false);
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);

  // Form states
  const [tuitionFormData, setTuitionFormData] = useState({
    academicYear: "",
    semester: "",
    tuitionFee: 0
  });

  const [paymentFormData, setPaymentFormData] = useState({
    paymentDate: "",
    amountPaid: 0,
    paymentMethod: "",
    notes: ""
  });

  // Filtered data
  const filteredStudents = mockStudents.filter(student =>
    student.id.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const studentTuitionRecords = tuitionRecords
    .filter(record => record.studentId === selectedStudent?.id)
    .sort((a, b) => {
      if (a.academicYear !== b.academicYear) {
        return b.academicYear.localeCompare(a.academicYear);
      }
      return parseInt(b.semester) - parseInt(a.semester);
    });

  const recordPaymentDetails = paymentDetails.filter(detail =>
    detail.tuitionRecordId === selectedTuitionRecord?.id
  );

  // Handle student selection
  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setStudentSearch("");
    setSelectedTuitionRecord(null);
  };

  // Handle tuition record selection
  const handleTuitionRecordSelect = (record: TuitionRecord) => {
    setSelectedTuitionRecord(record);
  };

  // Calculate amounts
  const calculateAmounts = (tuitionFee: number, payments: PaymentDetail[]) => {
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
    const due = tuitionFee - totalPaid;
    return { totalPaid, due };
  };

  // Handle add tuition record
  const handleAddTuitionRecord = () => {
    if (!selectedStudent || !tuitionFormData.academicYear || !tuitionFormData.semester || tuitionFormData.tuitionFee <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newRecord: TuitionRecord = {
      id: `TR${String(tuitionRecords.length + 1).padStart(3, '0')}`,
      studentId: selectedStudent.id,
      academicYear: tuitionFormData.academicYear,
      semester: tuitionFormData.semester,
      tuitionFee: tuitionFormData.tuitionFee,
      amountPaid: 0,
      amountDue: tuitionFormData.tuitionFee,
      status: 'unpaid'
    };

    setTuitionRecords(prev => [...prev, newRecord]);
    setTuitionFormData({ academicYear: "", semester: "", tuitionFee: 0 });
    setIsAddTuitionDialogOpen(false);

    toast({
      title: "Success!",
      description: "Tuition record added successfully",
    });
  };

  // Handle add payment
  const handleAddPayment = () => {
    if (!selectedTuitionRecord || !paymentFormData.paymentDate || paymentFormData.amountPaid <= 0 || !paymentFormData.paymentMethod) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (paymentFormData.amountPaid > selectedTuitionRecord.amountDue) {
      toast({
        title: "Validation Error",
        description: "Payment amount cannot exceed amount due",
        variant: "destructive",
      });
      return;
    }

    const newPayment: PaymentDetail = {
      id: `PD${String(paymentDetails.length + 1).padStart(3, '0')}`,
      tuitionRecordId: selectedTuitionRecord.id,
      paymentDate: paymentFormData.paymentDate,
      amountPaid: paymentFormData.amountPaid,
      paymentMethod: paymentFormData.paymentMethod,
      notes: paymentFormData.notes
    };

    setPaymentDetails(prev => [...prev, newPayment]);

    // Update tuition record amounts
    const updatedRecords = tuitionRecords.map(record => {
      if (record.id === selectedTuitionRecord.id) {
        const newAmountPaid = record.amountPaid + paymentFormData.amountPaid;
        const newAmountDue = record.tuitionFee - newAmountPaid;
        const newStatus = newAmountDue === 0 ? 'paid' : newAmountDue < record.tuitionFee ? 'partial' : 'unpaid';
        
        return {
          ...record,
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: newStatus as 'paid' | 'partial' | 'unpaid'
        };
      }
      return record;
    });

    setTuitionRecords(updatedRecords);
    setSelectedTuitionRecord(updatedRecords.find(r => r.id === selectedTuitionRecord.id) || null);
    setPaymentFormData({ paymentDate: "", amountPaid: 0, paymentMethod: "", notes: "" });
    setIsAddPaymentDialogOpen(false);

    toast({
      title: "Success!",
      description: "Payment recorded successfully",
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tuition Payment Management</h1>
          <p className="text-gray-600 mt-1">Manage student tuition payments and records (PkeToan Access Only)</p>
        </div>
        <Badge className="bg-purple-100 text-purple-800">
          <CreditCard className="w-4 h-4 mr-1" />
          Accounting Module
        </Badge>
      </div>

      {/* Student Search */}
      <Card>
        <CardHeader>
          <CardTitle>Student Search</CardTitle>
          <CardDescription>Search and select a student to manage their tuition payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by Student ID or Name..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Student Search Results */}
            {studentSearch && (
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleStudentSelect(student)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-gray-500">ID: {student.id} | Class: {student.class}</div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">{student.departmentCode}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Student Info */}
            {selectedStudent && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-4">
                  <User className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-blue-900">{selectedStudent.name}</h3>
                    <p className="text-sm text-blue-700">ID: {selectedStudent.id} | Class: {selectedStudent.class}</p>
                    <p className="text-sm text-blue-600">{selectedStudent.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tuition Records */}
      {selectedStudent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tuition Payment Records</CardTitle>
                <CardDescription>
                  Payment history for {selectedStudent.name} (ordered by academic year and semester)
                </CardDescription>
              </div>
              <Dialog open={isAddTuitionDialogOpen} onOpenChange={setIsAddTuitionDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-50 text-green-600 hover:bg-green-100">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Tuition Record
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Tuition Record</DialogTitle>
                    <DialogDescription>
                      Create a new tuition record for {selectedStudent.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="academicYear">Academic Year</Label>
                        <Select 
                          value={tuitionFormData.academicYear} 
                          onValueChange={(value) => setTuitionFormData(prev => ({ ...prev, academicYear: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2023-2024">2023-2024</SelectItem>
                            <SelectItem value="2024-2025">2024-2025</SelectItem>
                            <SelectItem value="2025-2026">2025-2026</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="semester">Semester</Label>
                        <Select 
                          value={tuitionFormData.semester} 
                          onValueChange={(value) => setTuitionFormData(prev => ({ ...prev, semester: value }))}
                        >
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
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tuitionFee">Total Tuition Fee (VND)</Label>
                      <Input
                        id="tuitionFee"
                        type="number"
                        placeholder="Enter tuition fee"
                        value={tuitionFormData.tuitionFee || ""}
                        onChange={(e) => setTuitionFormData(prev => ({ ...prev, tuitionFee: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddTuitionDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddTuitionRecord} className="bg-green-50 text-green-600 hover:bg-green-100">
                      <Save className="mr-2 h-4 w-4" />
                      Save Record
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead className="text-right">Tuition Fee</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                    <TableHead className="text-right">Amount Due</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentTuitionRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No tuition records found for this student
                      </TableCell>
                    </TableRow>
                  ) : (
                    studentTuitionRecords.map((record) => (
                      <TableRow 
                        key={record.id} 
                        className={`cursor-pointer hover:bg-gray-50 ${selectedTuitionRecord?.id === record.id ? 'bg-blue-50' : ''}`}
                        onClick={() => handleTuitionRecordSelect(record)}
                      >
                        <TableCell className="font-medium">{record.academicYear}</TableCell>
                        <TableCell>
                          <Badge className="bg-purple-100 text-purple-800">
                            Semester {record.semester}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(record.tuitionFee)}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {formatCurrency(record.amountPaid)}
                        </TableCell>
                        <TableCell className="text-right text-red-600 font-medium">
                          {formatCurrency(record.amountDue)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getStatusColor(record.status)}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Details */}
      {selectedTuitionRecord && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>
                  Payment history for {selectedTuitionRecord.academicYear} - Semester {selectedTuitionRecord.semester}
                </CardDescription>
              </div>
              {selectedTuitionRecord.amountDue > 0 && (
                <Dialog open={isAddPaymentDialogOpen} onOpenChange={setIsAddPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-50 text-blue-600 hover:bg-blue-100">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record New Payment</DialogTitle>
                      <DialogDescription>
                        Record payment for {selectedStudent?.name} - {selectedTuitionRecord.academicYear} Semester {selectedTuitionRecord.semester}
                        <br />
                        <span className="text-red-600 font-medium">Amount Due: {formatCurrency(selectedTuitionRecord.amountDue)}</span>
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="paymentDate">Payment Date</Label>
                          <Input
                            id="paymentDate"
                            type="date"
                            value={paymentFormData.paymentDate}
                            onChange={(e) => setPaymentFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="amountPaid">Amount Paid (VND)</Label>
                          <Input
                            id="amountPaid"
                            type="number"
                            placeholder="Enter amount"
                            max={selectedTuitionRecord.amountDue}
                            value={paymentFormData.amountPaid || ""}
                            onChange={(e) => setPaymentFormData(prev => ({ ...prev, amountPaid: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select 
                          value={paymentFormData.paymentMethod} 
                          onValueChange={(value) => setPaymentFormData(prev => ({ ...prev, paymentMethod: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="Credit Card">Credit Card</SelectItem>
                            <SelectItem value="Online Payment">Online Payment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Input
                          id="notes"
                          placeholder="Enter payment notes"
                          value={paymentFormData.notes}
                          onChange={(e) => setPaymentFormData(prev => ({ ...prev, notes: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddPaymentDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddPayment} className="bg-blue-50 text-blue-600 hover:bg-blue-100">
                        <Save className="mr-2 h-4 w-4" />
                        Record Payment
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Date</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recordPaymentDetails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No payment records found for this tuition period
                      </TableCell>
                    </TableRow>
                  ) : (
                    recordPaymentDetails.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                            {new Date(payment.paymentDate).toLocaleDateString('vi-VN')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          <div className="flex items-center justify-end">
                            <DollarSign className="mr-1 h-4 w-4" />
                            {formatCurrency(payment.amountPaid)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-gray-100 text-gray-800">
                            {payment.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {payment.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Toaster />
    </div>
  );
} 