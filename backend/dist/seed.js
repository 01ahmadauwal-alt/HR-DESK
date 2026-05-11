"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("./models/User"));
const Employee_1 = __importDefault(require("./models/Employee"));
const Department_1 = __importDefault(require("./models/Department"));
const Company_1 = __importDefault(require("./models/Company"));
const LeaveBalance_1 = __importDefault(require("./models/LeaveBalance"));
const PayrollConfig_1 = __importDefault(require("./models/PayrollConfig"));
async function seed() {
    const uri = process.env.MONGO_URI;
    await mongoose_1.default.connect(uri);
    console.log('Connected to MongoDB');
    // Wipe existing seed data cleanly
    await Promise.all([
        User_1.default.deleteMany({}),
        Employee_1.default.deleteMany({}),
        Department_1.default.deleteMany({}),
        Company_1.default.deleteMany({}),
        LeaveBalance_1.default.deleteMany({}),
        PayrollConfig_1.default.deleteMany({}),
    ]);
    console.log('Cleared existing data');
    // Company
    const company = await Company_1.default.create({
        name: 'TechCorp Nigeria Ltd',
        industry: 'Information Technology',
        address: '14 Admiralty Way, Lekki Phase 1, Lagos',
        phone: '08012345678',
        email: 'info@techcorp.ng',
        website: 'https://techcorp.ng',
    });
    // Departments
    const [engDept, hrDept] = await Department_1.default.create([
        { name: 'Engineering', code: 'ENG', company: company._id, description: 'Software development and infrastructure' },
        { name: 'Human Resources', code: 'HR', company: company._id, description: 'HR operations and people management' },
    ]);
    const PASS = 'Admin1234';
    // ── 1. SUPER ADMIN ────────────────────────────────────────────────────────
    // Pass plain text — the User pre-save hook hashes it once
    const adminUser = await User_1.default.create({
        email: 'admin@hrdesk.com',
        phone: '08000000001',
        username: 'admin',
        passwordHash: PASS,
        role: 'super_admin',
        isFirstLogin: false,
        active: true,
        company: company._id,
    });
    const adminEmployee = await Employee_1.default.create({
        userId: adminUser._id,
        employeeId: 'EMP-0001',
        firstName: 'System',
        lastName: 'Admin',
        phone: '08000000001',
        email: 'admin@hrdesk.com',
        department: hrDept._id,
        position: 'System Administrator',
        hireDate: new Date('2022-01-01'),
        employmentType: 'full_time',
        basicSalary: 500000,
        housingAllowance: 100000,
        transportAllowance: 50000,
        gender: 'male',
        isActive: true,
        company: company._id,
        address: { street: '14 Admiralty Way', city: 'Lagos', state: 'Lagos', country: 'Nigeria' },
        bankAccount: { bankName: 'GTBank', accountNumber: '0100000001', accountName: 'System Admin' },
        pension: { pfaName: 'ARM Pension', rsaPin: 'PEN00000001' },
        emergencyContact: { name: 'Admin Contact', relationship: 'Spouse', phone: '08000000099' },
    });
    // Link user → employee
    adminUser.employeeId = adminEmployee._id;
    await adminUser.save({ validateBeforeSave: false });
    // ── 2. HR MANAGER ─────────────────────────────────────────────────────────
    const hrUser = await User_1.default.create({
        email: 'hr@hrdesk.com',
        phone: '08000000002',
        username: 'hrmanager',
        passwordHash: PASS,
        role: 'hr_manager',
        isFirstLogin: false,
        active: true,
        company: company._id,
    });
    const hrEmployee = await Employee_1.default.create({
        userId: hrUser._id,
        employeeId: 'EMP-0002',
        firstName: 'Amaka',
        lastName: 'Okonkwo',
        phone: '08000000002',
        email: 'hr@hrdesk.com',
        department: hrDept._id,
        position: 'HR Manager',
        hireDate: new Date('2022-03-15'),
        employmentType: 'full_time',
        basicSalary: 450000,
        housingAllowance: 90000,
        transportAllowance: 45000,
        gender: 'female',
        isActive: true,
        company: company._id,
        address: { street: '7 Bourdillon Road', city: 'Ikoyi', state: 'Lagos', country: 'Nigeria' },
        bankAccount: { bankName: 'Zenith Bank', accountNumber: '0100000002', accountName: 'Amaka Okonkwo' },
        pension: { pfaName: 'Stanbic IBTC Pension', rsaPin: 'PEN00000002' },
        emergencyContact: { name: 'Chidi Okonkwo', relationship: 'Spouse', phone: '08000000098' },
    });
    hrUser.employeeId = hrEmployee._id;
    await hrUser.save({ validateBeforeSave: false });
    // ── 3. MANAGER (HOD) ──────────────────────────────────────────────────────
    const managerUser = await User_1.default.create({
        email: 'manager@hrdesk.com',
        phone: '08000000003',
        username: 'teammanager',
        passwordHash: PASS,
        role: 'manager',
        isFirstLogin: false,
        active: true,
        company: company._id,
    });
    const managerEmployee = await Employee_1.default.create({
        userId: managerUser._id,
        employeeId: 'EMP-0003',
        firstName: 'Emeka',
        lastName: 'Nwosu',
        phone: '08000000003',
        email: 'manager@hrdesk.com',
        department: engDept._id,
        position: 'Engineering Manager',
        hireDate: new Date('2021-06-01'),
        employmentType: 'full_time',
        basicSalary: 600000,
        housingAllowance: 120000,
        transportAllowance: 60000,
        gender: 'male',
        isActive: true,
        company: company._id,
        address: { street: '3 Ozumba Mbadiwe', city: 'Victoria Island', state: 'Lagos', country: 'Nigeria' },
        bankAccount: { bankName: 'Access Bank', accountNumber: '0100000003', accountName: 'Emeka Nwosu' },
        pension: { pfaName: 'NLPC Pension', rsaPin: 'PEN00000003' },
        emergencyContact: { name: 'Ngozi Nwosu', relationship: 'Spouse', phone: '08000000097' },
    });
    managerUser.employeeId = managerEmployee._id;
    await managerUser.save({ validateBeforeSave: false });
    // ── 4. EMPLOYEE ───────────────────────────────────────────────────────────
    const empUser = await User_1.default.create({
        email: 'employee@hrdesk.com',
        phone: '08000000004',
        username: 'johndoe',
        passwordHash: PASS,
        role: 'employee',
        isFirstLogin: false,
        active: true,
        company: company._id,
    });
    const empEmployee = await Employee_1.default.create({
        userId: empUser._id,
        employeeId: 'EMP-0004',
        firstName: 'John',
        lastName: 'Doe',
        phone: '08000000004',
        email: 'employee@hrdesk.com',
        department: engDept._id,
        position: 'Software Engineer',
        hireDate: new Date('2023-01-16'),
        employmentType: 'full_time',
        basicSalary: 350000,
        housingAllowance: 70000,
        transportAllowance: 35000,
        gender: 'male',
        isActive: true,
        company: company._id,
        address: { street: '22 Allen Avenue', city: 'Ikeja', state: 'Lagos', country: 'Nigeria' },
        bankAccount: { bankName: 'First Bank', accountNumber: '0100000004', accountName: 'John Doe' },
        pension: { pfaName: 'Leadway Pensure', rsaPin: 'PEN00000004' },
        emergencyContact: { name: 'Jane Doe', relationship: 'Spouse', phone: '08000000096' },
    });
    empUser.employeeId = empEmployee._id;
    await empUser.save({ validateBeforeSave: false });
    // Update departments with manager and member references
    await Department_1.default.findByIdAndUpdate(engDept._id, {
        managerId: managerEmployee._id,
        hodId: managerEmployee._id,
        memberIds: [managerEmployee._id, empEmployee._id],
    });
    await Department_1.default.findByIdAndUpdate(hrDept._id, {
        managerId: hrEmployee._id,
        hodId: hrEmployee._id,
        memberIds: [adminEmployee._id, hrEmployee._id],
    });
    // Leave balances for current year
    const year = new Date().getFullYear();
    const employees = [adminEmployee, hrEmployee, managerEmployee, empEmployee];
    await LeaveBalance_1.default.insertMany(employees.map(e => ({
        employeeId: e._id,
        year,
        annual: 21, sick: 10, casual: 5, maternity: 84, paternity: 5, study: 0,
        usedAnnual: 0, usedSick: 0, usedCasual: 0, usedMaternity: 0, usedPaternity: 0, usedStudy: 0,
    })));
    // Default payroll config (Nigerian statutory rates)
    await PayrollConfig_1.default.create({
        company: company._id,
        pensionEmployeeRate: 8,
        pensionEmployerRate: 10,
        nhfRate: 2.5,
        nhfEnabled: true,
        loanEnabled: true,
        maxLoanAmount: 500000,
        maxRepaymentMonths: 12,
        loanInterestRate: 0,
        eligibilityMonths: 6,
        salaryAdvanceEnabled: true,
        maxAdvancePercent: 50,
        maxAdvancePerYear: 2,
    });
    console.log('\n✅ Seed complete!\n');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│                     LOGIN CREDENTIALS                      │');
    console.log('├──────────────┬──────────────────────────┬───────────────────┤');
    console.log('│ Role         │ Email                    │ Password          │');
    console.log('├──────────────┼──────────────────────────┼───────────────────┤');
    console.log('│ Admin        │ admin@hrdesk.com         │ Admin1234         │');
    console.log('│ HR Manager   │ hr@hrdesk.com            │ Admin1234         │');
    console.log('│ Manager      │ manager@hrdesk.com       │ Admin1234         │');
    console.log('│ Employee     │ employee@hrdesk.com      │ Admin1234         │');
    console.log('└──────────────┴──────────────────────────┴───────────────────┘');
    console.log('\nAll accounts ready — no first-login setup required.\n');
    await mongoose_1.default.disconnect();
}
seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map