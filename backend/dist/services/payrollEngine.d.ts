import { IEmployee } from '../models/Employee';
import { IPayrollConfig, ITaxBracket } from '../models/PayrollConfig';
import { IEmployeeDeductionOverride } from '../models/EmployeeDeductionOverride';
export interface PayrollResult {
    employeeId: string;
    basicSalary: number;
    housingAllowance: number;
    transportAllowance: number;
    otherAllowances: {
        name: string;
        amount: number;
    }[];
    grossSalary: number;
    pensionEmployee: number;
    pensionEmployer: number;
    taxableIncome: number;
    paye: number;
    nhf: number;
    lifeInsurance: number;
    healthInsurance: number;
    groupLifeAssurance: number;
    unionDue: number;
    cooperative: number;
    staffWelfareLevy: number;
    loanRepayment: number;
    salaryAdvanceRecovery: number;
    customDeductions: {
        name: string;
        amount: number;
    }[];
    totalDeductions: number;
    netPay: number;
}
export declare function applyTaxBrackets(annualTaxable: number, brackets: ITaxBracket[]): number;
export declare function calculatePayroll(employee: IEmployee, config: IPayrollConfig, loanRepayment: number, salaryAdvanceRecovery: number, overrides: IEmployeeDeductionOverride[]): PayrollResult;
//# sourceMappingURL=payrollEngine.d.ts.map