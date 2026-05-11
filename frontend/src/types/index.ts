export type UserRole = 'super_admin' | 'hr_manager' | 'manager' | 'employee';

export interface User {
  id: string;
  email: string;
  username?: string;
  role: UserRole;
  avatar?: string;
  isFirstLogin?: boolean;
}

export interface Employee {
  _id: string;
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  email: string;
  department?: { _id: string; name: string; code: string };
  position: string;
  hireDate: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: { name: string; amount: number }[];
  bankAccount: { bankName: string; accountNumber: string; accountName: string };
  pension: { pfaName: string; rsaPin: string };
  address: { street: string; city: string; state: string; country: string };
  emergencyContact: { name: string; relationship: string; phone: string };
  avatar?: string;
  gender?: 'male' | 'female';
  dateOfBirth?: string;
  maritalStatus?: string;
  isActive: boolean;
  todayStatus?: 'on_duty' | 'on_leave' | 'absent';
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  managerId?: string;
  hodId?: string;
  memberIds: string[];
  description?: string;
  active: boolean;
}

export type LeaveStatus = 'pending_manager' | 'pending_hr' | 'approved' | 'rejected';
export type LeaveType = 'annual' | 'sick' | 'casual' | 'maternity' | 'paternity' | 'study' | 'unpaid';

export interface LeaveRequest {
  _id: string;
  employeeId: Employee | string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  rejectionReason?: string;
  createdAt: string;
}

export interface LeaveBalance {
  _id: string;
  employeeId: string;
  year: number;
  annual: number; sick: number; casual: number; maternity: number; paternity: number; study: number;
  usedAnnual: number; usedSick: number; usedCasual: number; usedMaternity: number; usedPaternity: number; usedStudy: number;
}

export interface Payroll {
  _id: string;
  employeeId: Employee | string;
  month: number;
  year: number;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  grossSalary: number;
  pensionEmployee: number;
  pensionEmployer: number;
  paye: number;
  nhf: number;
  lifeInsurance: number;
  healthInsurance: number;
  loanRepayment: number;
  salaryAdvanceRecovery: number;
  customDeductions: { name: string; amount: number }[];
  totalDeductions: number;
  netPay: number;
  status: 'draft' | 'approved' | 'paid';
  createdAt: string;
}

export interface Payslip {
  _id: string;
  payrollId: Payroll | string;
  employeeId: string;
  generatedAt: string;
  pdfPath: string;
  downloadCount: number;
}

export type TaskStatus = 'open' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  _id: string;
  title: string;
  description: string;
  assignedTo: { employeeId: Employee | string; status: string }[];
  assignedBy: Employee | string;
  department?: Department | string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  isOpenForCollaboration: boolean;
  collaborators: { employeeId: Employee | string; invitedBy: string; status: string }[];
  comments: { _id: string; authorId: string; text: string; createdAt: string }[];
  completedAt?: string;
  createdAt: string;
}

export interface Attendance {
  _id: string;
  employeeId: Employee | string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  source: 'device' | 'manual';
}

export interface Job {
  _id: string;
  title: string;
  department?: { _id: string; name: string };
  description: string;
  requirements: string[];
  responsibilities: string[];
  type: string;
  level: string;
  location: string;
  salaryRange: { min: number; max: number };
  deadline?: string;
  status: 'draft' | 'active' | 'closed';
  applicantCount: number;
  createdAt: string;
}

export type ApplicantStage = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

export interface Applicant {
  _id: string;
  jobId: Job | string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resume?: string;
  coverLetter?: string;
  stage: ApplicantStage;
  notes?: string;
  source?: string;
  createdAt: string;
}

export interface LoanApplication {
  _id: string;
  employeeId: Employee | string;
  amount: number;
  purpose: string;
  repaymentMonths: number;
  monthlyDeduction: number;
  interestRate: number;
  totalRepayable: number;
  amountRepaid: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed';
  disbursedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface SalaryAdvance {
  _id: string;
  employeeId: Employee | string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  deductMonth?: number;
  deductYear?: number;
  rejectionReason?: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface PayrollConfig {
  _id: string;
  taxBrackets: { min: number; max: number | null; rate: number }[];
  pensionEmployeeRate: number;
  pensionEmployerRate: number;
  nhfRate: number;
  nhfEnabled: boolean;
  lifeInsuranceEnabled: boolean;
  lifeInsuranceRate: number;
  healthInsuranceEnabled: boolean;
  healthInsuranceAmount: number;
  unionDueEnabled: boolean;
  unionDueAmount: number;
  cooperativeEnabled: boolean;
  staffWelfareLevyEnabled: boolean;
  staffWelfareLevyAmount: number;
  loanEnabled: boolean;
  maxLoanAmount: number;
  maxRepaymentMonths: number;
  loanInterestRate: number;
  eligibilityMonths: number;
  salaryAdvanceEnabled: boolean;
  maxAdvancePercent: number;
  maxAdvancePerYear: number;
  deductions: {
    name: string; code: string; type: 'fixed' | 'percentage';
    value: number; taxRelief: boolean; active: boolean;
  }[];
}

export interface HRMetrics {
  totalEmployees: number;
  activeEmployees: number;
  departments: number;
  pendingLeaves: number;
  openJobs: number;
  payroll: {
    month: number; year: number;
    totalNetPay: number; totalGross: number; processedCount: number;
  };
}
