import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const schema = z.object({
  identifier: z.string().min(1, 'Email or username required'),
  password: z.string().min(1, 'Password required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const { isFirstLogin } = await login(data.identifier, data.password);
      if (isFirstLogin) {
        navigate('/setup', { replace: true });
      } else {
        // Route to role-appropriate dashboard — handled by App router
        navigate('/', { replace: true });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-sidebar flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">H</span>
          </div>
          <span className="text-white font-bold text-2xl">HR-DESK</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            People management,<br />
            <span className="text-primary-400">simplified.</span>
          </h1>
          <p className="text-slate-400 mt-4 text-lg leading-relaxed">
            Manage payroll, leave, attendance, recruitment and more — all in one place.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            {['Payroll', 'Leave', 'Attendance', 'Recruitment'].map((f) => (
              <div key={f} className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                <p className="text-white text-sm font-medium">{f}</p>
                <p className="text-slate-400 text-xs mt-0.5">Fully managed</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-slate-500 text-sm">© {new Date().getFullYear()} HR-DESK. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 lg:hidden mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-lg text-slate-900">HR-DESK</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 mt-1 text-sm">Sign in to your workspace</p>
          </div>

          {error && (
            <div className="bg-danger-50 border border-danger-100 text-danger-700 rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email or Username</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('identifier')}
                  className={`input pl-9 ${errors.identifier ? 'input-error' : ''}`}
                  placeholder="you@company.com"
                  autoComplete="username"
                />
              </div>
              {errors.identifier && <p className="text-xs text-danger mt-1">{errors.identifier.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  className={`input pl-9 pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-slate-100 rounded-lg">
            <p className="text-xs text-slate-500 font-medium">First time logging in?</p>
            <p className="text-xs text-slate-400 mt-1">
              Use your <strong>email</strong> as identifier and your <strong>phone number</strong> as password.
              You'll be prompted to set a custom password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
