import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { apiService } from '@/lib/services/apiService';
import { OTPInput } from './OTPInput';
import { AuthLayout } from './AuthLayout';
import { parseApiError } from '@/lib/utils/errorParser';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiService.requestRegistrationOTP(email);
      setIsOtpSent(true);
      toast.success('OTP Sent', {
        description: 'Please check your email for the OTP',
      });
    } catch (err: any) {
      console.error('OTP request error:', err);
      const { title, message } = parseApiError(err);
      
      toast.error(title, {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (otp.length !== 6) {
        toast.error('Invalid OTP', {
          description: 'Please enter a valid 6-digit OTP',
        });
        return;
      }

      await apiService.register(email, otp);
      
      toast.success('Registration Request Submitted', {
        description: 'Your registration request has been submitted. You will receive an email once approved by your organization administrator.',
      });

      // Add a small delay before navigation to ensure toast is shown
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
      const { title, message } = parseApiError(err);
      
      toast.error(title, {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold tracking-tight text-center text-slate-800">
            Create Account
          </CardTitle>
          <CardDescription className="text-center text-base text-slate-600">
            {!isOtpSent
              ? 'Enter your organization email to register'
              : 'Enter the OTP sent to your email'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isOtpSent ? handleRegister : handleSendOTP} className="space-y-6">
            {!isOtpSent ? (
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    className="text-base h-12 pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 text-center">
                  Your organization must be registered with us. Contact your administrator if you don't have access.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-6">
                <div className="text-sm text-center">
                  <p className="font-medium text-slate-500">Verification code sent to</p>
                  <p className="font-medium text-slate-700 mt-1">{email}</p>
                </div>
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                type="submit" 
                className="flex-1 text-base font-medium h-12 bg-slate-800 hover:bg-slate-900" 
                size="lg" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Please wait...</span>
                  </div>
                ) : isOtpSent ? 'Submit Request' : 'Continue'}
              </Button>
              {isOtpSent && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setIsOtpSent(false)}
                  disabled={isLoading}
                  className="h-12 border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Back
                </Button>
              )}
            </div>
          </form>
        </CardContent>
        {!isOtpSent && (
          <CardFooter>
            <div className="w-full text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-semibold text-slate-800 hover:text-slate-900 transition-colors"
              >
                Login
              </Link>
            </div>
          </CardFooter>
        )}
      </Card>
    </AuthLayout>
  );
} 