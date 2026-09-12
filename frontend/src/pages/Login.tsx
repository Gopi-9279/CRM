import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/axios';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setServerError(null);
      const res = await api.post('/auth/login', data);
      
      const { accessToken, user } = res.data.data;
      login(accessToken, user);
      
      navigate('/');
    } catch (error: any) {
      if (error.response?.data?.error) {
        setServerError(error.response.data.error.message || 'Login failed');
      } else {
        setServerError('Network error. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            {serverError && (
              <div className="bg-error-bg text-error p-3 rounded-md text-sm">
                {serverError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Email address
              </label>
              <Input
                type="email"
                {...register('email')}
                error={!!errors.email}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-error">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Password
              </label>
              <Input
                type="password"
                {...register('password')}
                error={!!errors.password}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-error">{errors.password.message}</p>
              )}
            </div>

            <div>
              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                Sign in
              </Button>
            </div>
          </form>
          
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-sm text-text-secondary">Demo Accounts:</p>
            <ul className="text-xs text-text-secondary mt-2 space-y-1 list-disc list-inside">
              <li>admin@demo.com / password123</li>
              <li>ops@demo.com / password123</li>
              <li>sales@demo.com / password123</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
