import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Phone, MapPin, CreditCard, Shield } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../api/client';
import type { Employee } from '../../types';
import { formatDate } from '../../utils/formatters';

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-primary" />
          <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm text-slate-700 mt-0.5">{value || '—'}</p>
    </div>
  );
}

export default function EmployeeProfile() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { data: emp, isLoading } = useQuery<Employee>({
    queryKey: ['my-profile'],
    queryFn: () => api.get('/employee/profile').then(r => r.data),
  });

  const [form, setForm] = useState({
    phone: '', street: '', city: '', state: '', country: '',
    emergencyName: '', emergencyRelationship: '', emergencyPhone: '',
    bankName: '', accountNumber: '', accountName: '',
    pfaName: '', rsaPin: '',
  });

  const startEdit = () => {
    if (!emp) return;
    setForm({
      phone: emp.phone || '',
      street: emp.address?.street || '',
      city: emp.address?.city || '',
      state: emp.address?.state || '',
      country: emp.address?.country || '',
      emergencyName: emp.emergencyContact?.name || '',
      emergencyRelationship: emp.emergencyContact?.relationship || '',
      emergencyPhone: emp.emergencyContact?.phone || '',
      bankName: emp.bankAccount?.bankName || '',
      accountNumber: emp.bankAccount?.accountNumber || '',
      accountName: emp.bankAccount?.accountName || '',
      pfaName: emp.pension?.pfaName || '',
      rsaPin: emp.pension?.rsaPin || '',
    });
    setEditing(true);
    setError('');
    setSuccess('');
  };

  const mutation = useMutation({
    mutationFn: () => api.put('/employee/profile', {
      phone: form.phone,
      address: { street: form.street, city: form.city, state: form.state, country: form.country },
      emergencyContact: { name: form.emergencyName, relationship: form.emergencyRelationship, phone: form.emergencyPhone },
      bankAccount: { bankName: form.bankName, accountNumber: form.accountNumber, accountName: form.accountName },
      pension: { pfaName: form.pfaName, rsaPin: form.rsaPin },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      setEditing(false);
      setSuccess('Profile updated successfully.');
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err.response?.data?.message ?? 'Failed to update profile'),
  });

  if (isLoading) return <DashboardLayout title="My Profile"><LoadingSpinner /></DashboardLayout>;
  if (!emp) return null;

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <DashboardLayout title="My Profile">
      <div className="space-y-4">
        {/* Header card */}
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {emp.firstName[0]}{emp.lastName[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-800">{emp.firstName} {emp.middleName} {emp.lastName}</h2>
              <p className="text-sm text-slate-500">{emp.position}</p>
              <p className="text-xs text-slate-400">{emp.employeeId} · {emp.department?.name} · Joined {formatDate(emp.hireDate)}</p>
            </div>
            {!editing ? (
              <button onClick={startEdit} className="btn-secondary">Edit Profile</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
                <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary">
                  {mutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>

        {success && <div className="bg-success-50 text-success-700 rounded-lg px-4 py-2 text-sm">{success}</div>}
        {error && <div className="bg-danger-50 text-danger-700 rounded-lg px-4 py-2 text-sm">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Personal Info */}
          <Section title="Personal Information" icon={User}>
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="label">Phone Number</label>
                  <input className="input" value={form.phone} onChange={f('phone')} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Employee ID" value={emp.employeeId} />
                <Field label="Employment Type" value={emp.employmentType?.replace('_', ' ')} />
                <Field label="Email" value={emp.email} />
                <Field label="Phone" value={emp.phone} />
                <Field label="Gender" value={emp.gender} />
                <Field label="Date of Birth" value={emp.dateOfBirth ? formatDate(emp.dateOfBirth) : undefined} />
                <Field label="Marital Status" value={emp.maritalStatus} />
              </div>
            )}
          </Section>

          {/* Address */}
          <Section title="Address" icon={MapPin}>
            {editing ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Street</label>
                  <input className="input" value={form.street} onChange={f('street')} />
                </div>
                <div>
                  <label className="label">City</label>
                  <input className="input" value={form.city} onChange={f('city')} />
                </div>
                <div>
                  <label className="label">State</label>
                  <input className="input" value={form.state} onChange={f('state')} />
                </div>
                <div className="col-span-2">
                  <label className="label">Country</label>
                  <input className="input" value={form.country} onChange={f('country')} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Street" value={emp.address?.street} />
                <Field label="City" value={emp.address?.city} />
                <Field label="State" value={emp.address?.state} />
                <Field label="Country" value={emp.address?.country} />
              </div>
            )}
          </Section>

          {/* Emergency Contact */}
          <Section title="Emergency Contact" icon={Phone}>
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" value={form.emergencyName} onChange={f('emergencyName')} />
                </div>
                <div>
                  <label className="label">Relationship</label>
                  <input className="input" value={form.emergencyRelationship} onChange={f('emergencyRelationship')} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.emergencyPhone} onChange={f('emergencyPhone')} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name" value={emp.emergencyContact?.name} />
                <Field label="Relationship" value={emp.emergencyContact?.relationship} />
                <Field label="Phone" value={emp.emergencyContact?.phone} />
              </div>
            )}
          </Section>

          {/* Bank Details */}
          <Section title="Bank Details" icon={CreditCard}>
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="label">Bank Name</label>
                  <input className="input" value={form.bankName} onChange={f('bankName')} />
                </div>
                <div>
                  <label className="label">Account Number</label>
                  <input className="input" value={form.accountNumber} onChange={f('accountNumber')} />
                </div>
                <div>
                  <label className="label">Account Name</label>
                  <input className="input" value={form.accountName} onChange={f('accountName')} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Bank Name" value={emp.bankAccount?.bankName} />
                <Field label="Account Number" value={emp.bankAccount?.accountNumber} />
                <Field label="Account Name" value={emp.bankAccount?.accountName} />
              </div>
            )}
          </Section>

          {/* Pension */}
          <Section title="Pension (PENCOM)" icon={Shield}>
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="label">PFA Name</label>
                  <input className="input" value={form.pfaName} onChange={f('pfaName')} />
                </div>
                <div>
                  <label className="label">RSA PIN</label>
                  <input className="input" value={form.rsaPin} onChange={f('rsaPin')} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Field label="PFA Name" value={emp.pension?.pfaName} />
                <Field label="RSA PIN" value={emp.pension?.rsaPin} />
              </div>
            )}
          </Section>
        </div>
      </div>
    </DashboardLayout>
  );
}
