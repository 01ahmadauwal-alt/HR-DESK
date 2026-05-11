import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { IPayroll } from '../models/Payroll';
import { IEmployee } from '../models/Employee';

const COLORS = {
  primary: '#2563EB',
  dark: '#0F172A',
  gray: '#64748B',
  lightGray: '#F1F5F9',
  border: '#E2E8F0',
};

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getMonthName(month: number, year: number): string {
  return new Date(year, month - 1).toLocaleString('en-NG', { month: 'long', year: 'numeric' });
}

export async function generatePayslipPdf(
  payroll: IPayroll,
  employee: IEmployee,
  outputDir: string
): Promise<string> {
  const fileName = `payslip_${employee._id!.toString()}_${payroll.year}_${String(payroll.month).padStart(2, '0')}.pdf`;
  const filePath = path.join(outputDir, fileName);

  fs.mkdirSync(outputDir, { recursive: true });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header bar
    doc.rect(0, 0, doc.page.width, 80).fill(COLORS.primary);
    doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('HR-DESK', 50, 25);
    doc.fontSize(10).font('Helvetica').text('PAYSLIP', 50, 52);

    // Period badge
    const period = getMonthName(payroll.month, payroll.year);
    doc.fillColor('#FFFFFF').fontSize(10).text(`Pay Period: ${period}`, doc.page.width - 220, 35, { width: 170, align: 'right' });

    doc.moveDown(3);

    // Employee info box
    doc.fillColor(COLORS.lightGray).rect(50, 100, doc.page.width - 100, 80).fill();
    doc.fillColor(COLORS.dark).fontSize(14).font('Helvetica-Bold')
      .text(`${employee.firstName} ${employee.lastName}`, 65, 112);
    doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica')
      .text(`Employee ID: ${employee.employeeId}`, 65, 130)
      .text(`Position: ${employee.position}`, 65, 143);
    doc.text(`Bank: ${employee.bankAccount?.bankName || 'N/A'} — ${employee.bankAccount?.accountNumber || 'N/A'}`, 300, 130)
      .text(`PFA: ${employee.pension?.pfaName || 'N/A'} | RSA: ${employee.pension?.rsaPin || 'N/A'}`, 300, 143);

    let y = 200;

    // Earnings table
    y = drawTable(doc, y, 'EARNINGS', [
      ['Basic Salary', formatNaira(payroll.basicSalary)],
      ['Housing Allowance', formatNaira(payroll.housingAllowance)],
      ['Transport Allowance', formatNaira(payroll.transportAllowance)],
      ...payroll.otherAllowances.map((a): [string, string] => [a.name, formatNaira(a.amount)]),
    ], formatNaira(payroll.grossSalary), 'Gross Pay');

    y += 12;

    // Deductions table
    const deductionLines: [string, string][] = [
      ['PAYE Tax', formatNaira(payroll.paye)],
      ['Pension (Employee 8%)', formatNaira(payroll.pensionEmployee)],
    ];
    if (payroll.nhf) deductionLines.push(['NHF (2.5% of Basic)', formatNaira(payroll.nhf)]);
    if (payroll.lifeInsurance) deductionLines.push(['Life Insurance', formatNaira(payroll.lifeInsurance)]);
    if (payroll.healthInsurance) deductionLines.push(['Health Insurance (HMO)', formatNaira(payroll.healthInsurance)]);
    if (payroll.unionDue) deductionLines.push(['Union Dues', formatNaira(payroll.unionDue)]);
    if (payroll.cooperative) deductionLines.push(['Cooperative', formatNaira(payroll.cooperative)]);
    if (payroll.staffWelfareLevy) deductionLines.push(['Staff Welfare Levy', formatNaira(payroll.staffWelfareLevy)]);
    if (payroll.loanRepayment) deductionLines.push(['Loan Repayment', formatNaira(payroll.loanRepayment)]);
    if (payroll.salaryAdvanceRecovery) deductionLines.push(['Salary Advance Recovery', formatNaira(payroll.salaryAdvanceRecovery)]);
    payroll.customDeductions.forEach((d) => deductionLines.push([d.name, formatNaira(d.amount)]));

    y = drawTable(doc, y, 'DEDUCTIONS', deductionLines, formatNaira(payroll.totalDeductions), 'Total Deductions');

    y += 12;

    // Employer contributions
    y = drawTable(doc, y, 'EMPLOYER CONTRIBUTIONS', [
      ['Pension (Employer 10%)', formatNaira(payroll.pensionEmployer)],
      ...(payroll.groupLifeAssurance ? [['Group Life Assurance', formatNaira(payroll.groupLifeAssurance)] as [string, string]] : []),
    ]);

    y += 20;

    // Net pay box
    doc.fillColor(COLORS.primary).rect(50, y, doc.page.width - 100, 55).fill();
    doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica').text('NET PAY', 65, y + 12);
    doc.fontSize(22).font('Helvetica-Bold').text(formatNaira(payroll.netPay), 65, y + 26);
    doc.fontSize(9).font('Helvetica').text('This payslip is system-generated and requires no signature.', doc.page.width - 320, y + 20, { width: 260, align: 'right' });

    // Footer
    doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica')
      .text(`Generated on ${new Date().toLocaleDateString('en-NG')} by HR-DESK`, 50, doc.page.height - 50, { align: 'center' });

    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

function drawTable(
  doc: InstanceType<typeof PDFDocument>,
  startY: number,
  heading: string,
  rows: [string, string][],
  totalValue?: string,
  totalLabel?: string
): number {
  const left = 50;
  const right = doc.page.width - 50;
  const colSplit = right - 130;

  doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica-Bold').text(heading, left, startY);
  startY += 16;

  doc.fillColor(COLORS.border).rect(left, startY, right - left, 1).fill();
  startY += 6;

  for (const [label, value] of rows) {
    doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(label, left, startY);
    doc.fillColor(COLORS.dark).text(value, colSplit, startY, { width: 130, align: 'right' });
    startY += 18;
  }

  if (totalValue && totalLabel) {
    doc.fillColor(COLORS.border).rect(left, startY, right - left, 1).fill();
    startY += 6;
    doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica-Bold').text(totalLabel, left, startY);
    doc.text(totalValue, colSplit, startY, { width: 130, align: 'right' });
    startY += 22;
  }

  return startY;
}
