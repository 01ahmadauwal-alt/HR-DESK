import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../api/client';
import type { Payslip, Payroll } from '../../types';
import { formatNaira, formatDate, getMonthName } from '../../utils/formatters';

export default function EmployeePayslips() {
  const { data: payslips = [], isLoading } = useQuery<Payslip[]>({
    queryKey: ['my-payslips'],
    queryFn: () => api.get('/employee/payslips').then((r) => r.data),
  });

  const handleDownload = async (payslipId: string) => {
    const response = await api.get(`/employee/payslips/${payslipId}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${payslipId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="My Payslips">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Your payslips are system-generated and require no signature.</p>

        {isLoading ? (
          <LoadingSpinner />
        ) : payslips.length === 0 ? (
          <div className="card">
            <EmptyState icon={FileText} title="No payslips yet" description="Your payslips will appear here once payroll is processed." />
          </div>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Gross Pay</th>
                    <th>Total Deductions</th>
                    <th>Net Pay</th>
                    <th>Status</th>
                    <th>Generated</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.map((ps) => {
                    const pr = ps.payrollId as Payroll;
                    return (
                      <tr key={ps._id}>
                        <td className="font-medium">
                          {pr?.month && pr?.year ? getMonthName(pr.month, pr.year) : formatDate(ps.generatedAt)}
                        </td>
                        <td>{formatNaira(pr?.grossSalary)}</td>
                        <td>{formatNaira(pr?.totalDeductions)}</td>
                        <td className="font-semibold text-success-700">{formatNaira(pr?.netPay)}</td>
                        <td><Badge status={pr?.status ?? 'approved'} /></td>
                        <td>{formatDate(ps.generatedAt)}</td>
                        <td>
                          <button
                            onClick={() => handleDownload(ps._id)}
                            className="btn-secondary px-3 py-1 text-xs"
                          >
                            <Download size={13} /> Download
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
