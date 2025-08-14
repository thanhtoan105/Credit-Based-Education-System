// PDF Export Utility
interface CreditClassData {
  CREDIT_CLASS_ID: number;
  ACADEMIC_YEAR: string;
  SEMESTER: number;
  SUBJECT_ID: string;
  SUBJECT_NAME: string;
  GROUP_NUMBER: number;
  LECTURER_ID: string;
  LECTURER_NAME: string;
  FACULTY_ID: string;
  MIN_STUDENTS: number;
  CANCELED_CLASS: boolean;
  REGISTERED_STUDENTS?: number;
}

interface ExportOptions {
  data: CreditClassData[];
  departmentName: string;
  academicYear: string;
  semester: string;
}

export const exportCreditClassesPDF = async (options: ExportOptions): Promise<void> => {
  const { data, departmentName, academicYear, semester } = options;

  try {
    // Try with autoTable first
    const jsPDF = (await import('jspdf')).default;
    await import('jspdf-autotable');

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('LIST OF AVAILABLE CREDIT CLASSES', 105, 20, { align: 'center' });

    // Add department info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`DEPARTMENT: ${departmentName}`, 105, 30, { align: 'center' });
    doc.text(`Academic Year: ${academicYear} | Semester: ${semester}`, 105, 40, { align: 'center' });

    // Add generation date
    doc.setFontSize(10);
    doc.text(
      `Generated on: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      105,
      50,
      { align: 'center' }
    );

    // Prepare table data
    const tableData = data.map((cls, index) => [
      (index + 1).toString(),
      cls.SUBJECT_NAME || '',
      cls.GROUP_NUMBER?.toString() || '',
      cls.LECTURER_NAME || '',
      cls.MIN_STUDENTS?.toString() || '',
      (cls.REGISTERED_STUDENTS || 0).toString(),
    ]);

    // Add table using autoTable
    (doc as any).autoTable({
      head: [['#', 'Course Name', 'Group', 'Instructor', 'Min Students', 'Registered Students']],
      body: tableData,
      startY: 60,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 60, left: 14, right: 14 },
    });

    // Add footer with total count
    const finalY = (doc as any).lastAutoTable?.finalY || 150;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total classes opened: ${data.length}`, 105, finalY + 15, { align: 'center' });

    // Save the PDF
    const fileName = `Credit_Classes_Report_${academicYear}_Semester_${semester}_${
      new Date().toISOString().split('T')[0]
    }.pdf`;
    doc.save(fileName);

    return Promise.resolve();
  } catch (error) {
    console.error('AutoTable PDF failed, trying simple PDF:', error);
    
    // Fallback to simple PDF
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('LIST OF AVAILABLE CREDIT CLASSES', 105, 20, { align: 'center' });

      // Add department info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`DEPARTMENT: ${departmentName}`, 105, 30, { align: 'center' });
      doc.text(`Academic Year: ${academicYear} | Semester: ${semester}`, 105, 40, { align: 'center' });

      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 50, { align: 'center' });

      // Add simple table headers
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      let yPos = 70;
      doc.text('#', 20, yPos);
      doc.text('Course Name', 35, yPos);
      doc.text('Group', 100, yPos);
      doc.text('Instructor', 120, yPos);
      doc.text('Min', 160, yPos);
      doc.text('Reg', 180, yPos);

      // Add table data
      doc.setFont('helvetica', 'normal');
      data.forEach((cls, index) => {
        yPos += 10;
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text((index + 1).toString(), 20, yPos);
        doc.text(cls.SUBJECT_NAME?.substring(0, 25) || '', 35, yPos);
        doc.text(cls.GROUP_NUMBER?.toString() || '', 100, yPos);
        doc.text(cls.LECTURER_NAME?.substring(0, 15) || '', 120, yPos);
        doc.text(cls.MIN_STUDENTS?.toString() || '', 160, yPos);
        doc.text((cls.REGISTERED_STUDENTS || 0).toString(), 180, yPos);
      });

      // Add footer
      yPos += 20;
      doc.setFont('helvetica', 'bold');
      doc.text(`Total classes: ${data.length}`, 105, yPos, { align: 'center' });

      // Save the PDF
      const fileName = `Credit_Classes_Report_${academicYear}_Semester_${semester}_${
        new Date().toISOString().split('T')[0]
      }.pdf`;
      doc.save(fileName);

      return Promise.resolve();
    } catch (fallbackError) {
      console.error('Simple PDF also failed:', fallbackError);
      throw new Error('Failed to export PDF');
    }
  }
};
