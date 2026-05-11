import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const schema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_\.]+$/, 'Only letters, numbers, underscores, dots allowed'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function FirstLoginSetup() {
  const { setUser, user } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const password = watch('password', '');
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Contains a number', ok: /\d/.test(password) },
    { label: 'Contains a letter', ok: /[a-zA-Z]/.test(password) },
  ];

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      await api.post('/auth/setup', { username: data.username, password: data.password });
      if (user) setUser({ ...user, username: data.username, isFirstLogin: false });
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Setup failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-slate-900">HR-DESK</span>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Set up your account</h2>
              <p className="text-sm text-slate-500 mt-1">
                Welcome! Create your custom credentials to get started.
              </p>
            </div>

            {error && (
              <div className="bg-danger-50 border border-danger-100 text-danger-700 rounded-lg px-4 py-3 text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Choose a Username</label>
                <input
                  {...register('username')}
                  className={`input ${errors.username ? 'input-error' : ''}`}
                  placeholder="e.g. john.doe"
                  autoComplete="username"
                />
                {errors.username && <p className="text-xs text-danger mt-1">{errors.username.message}</p>}
                <p className="text-xs text-slate-400 mt-1">Letters, numbers, underscores, dots only</p>
              </div>

              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPw ? 'text' : 'password'}
                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
                <div className="mt-2 space-y-1">
                  {checks.map((c) => (
                    <div key={c.label} className="flex items-center gap-1.5">
                      <CheckCircle size={12} className={c.ok ? 'text-success' : 'text-slate-300'} />
                      <span className={`text-xs ${c.ok ? 'text-success-700' : 'text-slate-400'}`}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Confirm Password</label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-danger mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-2.5 mt-2"
              >
                {isSubmitting ? 'Saving...' : 'Complete Setup'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
