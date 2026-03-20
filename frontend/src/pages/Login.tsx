import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/authStore';
import client from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', data.email);
      formData.append('password', data.password);
      
      const response = await client.post('/auth/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { access_token, refresh_token } = response.data;
      
      // Fetch user info
      const userResponse = await client.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      login(access_token, refresh_token, userResponse.data);
      toast.success('Login successful!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-lg">
            KSS
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Kitoma Secondary School</h1>
          <p className="text-slate-500">Accounts Management System</p>
        </div>

        <Card className="shadow-xl border-slate-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <Input 
                  {...register('email')}
                  type="email" 
                  placeholder="admin@kitoma.ac.ug"
                  className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <a href="#" className="text-xs text-indigo-600 hover:underline">Forgot password?</a>
                </div>
                <Input 
                  {...register('password')}
                  type="password" 
                  placeholder="••••••••"
                  className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : 'Sign In'}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-center text-xs text-slate-400 mt-8">
          © 2026 Kitoma Secondary School. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
