"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyTaxBrackets = applyTaxBrackets;
exports.calculatePayroll = calculatePayroll;
function applyTaxBrackets(annualTaxable, brackets) {
    let tax = 0;
    let remaining = Math.max(0, annualTaxable);
    const sorted = [...brackets].sort((a, b) => a.min - b.min);
    for (const bracket of sorted) {
        if (remaining <= 0)
            break;
        const bracketMax = bracket.max ?? Infinity;
        const bracketSize = bracketMax - bracket.min + 1;
        const taxable = Math.min(remaining, bracketSize);
        tax += (taxable * bracket.rate) / 100;
        remaining -= taxable;
    }
    return tax;
}
function calculatePayroll(employee, config, loanRepayment, salaryAdvanceRecovery, overrides) {
    const basic = employee.basicSalary;
    const housing = employee.housingAllowance;
    const transport = employee.transportAllowance;
    const otherAllowances = employee.otherAllowances ?? [];
    const otherAllowancesTotal = otherAllowances.reduce((sum, a) => sum + a.amount, 0);
    const grossSalary = basic + housing + transport + otherAllowancesTotal;
    // Pension
    const pensionBase = basic + housing + transport;
    const pensionEmployee = round((pensionBase * config.pensionEmployeeRate) / 100);
    const pensionEmployer = round((pensionBase * config.pensionEmployerRate) / 100);
    // NHF
    const nhf = config.nhfEnabled ? round((basic * config.nhfRate) / 100) : 0;
    // Consolidated Relief Allowance (FIRS CRA): higher of ₦200,000 or 1% of gross, PLUS 20% of gross
    const cra = Math.max(200000, grossSalary * 0.01) + grossSalary * 0.2;
    // Taxable income (annualised)
    const annualTaxable = Math.max(0, (grossSalary - pensionEmployee - nhf - cra) * 12);
    const taxableIncome = annualTaxable / 12;
    const paye = round(applyTaxBrackets(annualTaxable, config.taxBrackets) / 12);
    // Optional statutory deductions
    const lifeInsurance = config.lifeInsuranceEnabled
        ? round((basic * config.lifeInsuranceRate) / 100)
        : 0;
    const healthInsurance = config.healthInsuranceEnabled ? config.healthInsuranceAmount : 0;
    const groupLifeAssurance = config.groupLifeAssuranceEnabled
        ? round((basic * config.groupLifeAssuranceRate) / 100)
        : 0;
    const unionDue = config.unionDueEnabled ? config.unionDueAmount : 0;
    const staffWelfareLevy = config.staffWelfareLevyEnabled ? config.staffWelfareLevyAmount : 0;
    // Cooperative override
    const cooperativeOverride = overrides.find((o) => o.deductionCode === 'COOPERATIVE');
    const cooperative = config.cooperativeEnabled
        ? (cooperativeOverride ? cooperativeOverride.overrideValue : 0)
        : 0;
    // Custom deductions from config
    const customDeductions = [];
    for (const d of config.deductions) {
        if (!d.active)
            continue;
        const override = overrides.find((o) => o.deductionCode === d.code);
        const amount = override
            ? override.overrideValue
            : d.type === 'fixed'
                ? d.value
                : round((grossSalary * d.value) / 100);
        customDeductions.push({ name: d.name, amount });
    }
    const customTotal = customDeductions.reduce((s, d) => s + d.amount, 0);
    const totalDeductions = pensionEmployee +
        paye +
        nhf +
        lifeInsurance +
        healthInsurance +
        groupLifeAssurance +
        unionDue +
        cooperative +
        staffWelfareLevy +
        loanRepayment +
        salaryAdvanceRecovery +
        customTotal;
    const netPay = round(grossSalary - totalDeductions);
    return {
        employeeId: employee._id.toString(),
        basicSalary: basic,
        housingAllowance: housing,
        transportAllowance: transport,
        otherAllowances,
        grossSalary: round(grossSalary),
        pensionEmployee,
        pensionEmployer,
        taxableIncome: round(taxableIncome),
        paye,
        nhf,
        lifeInsurance,
        healthInsurance,
        groupLifeAssurance,
        unionDue,
        cooperative,
        staffWelfareLevy,
        loanRepayment,
        salaryAdvanceRecovery,
        customDeductions,
        totalDeductions: round(totalDeductions),
        netPay,
    };
}
function round(n) {
    return Math.round(n * 100) / 100;
}
//# sourceMappingURL=payrollEngine.js.map