import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  accountType: z.enum(['personal', 'company']),
  agreement: z.boolean().refine(val => val === true, 'You must accept the terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupAccountType, setSignupAccountType] = useState<'personal' | 'company'>('personal');
  const [signupAgreement, setSignupAgreement] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const data = loginSchema.parse({
        email: loginEmail,
        password: loginPassword,
      });

      setLoading(true);
      const { error } = await signIn(data.email, data.password);

      if (error) {
        return;
      }
      navigate('/');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const data = signupSchema.parse({
        name: signupName,
        email: signupEmail,
        phone: signupPhone || undefined,
        password: signupPassword,
        confirmPassword: signupConfirmPassword,
        accountType: signupAccountType,
        agreement: signupAgreement,
      });

      setLoading(true);
      const { error } = await signUp(data.email, data.password, {
        name: data.name,
        account_type: data.accountType,
        phone: data.phone,
      });

      if (error) {
        return;
      }
      navigate('/');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: 'url(/show-img.png)' }}
      />

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-white">
        <div className="w-full max-w-[580px]">
        {isLogin ? (
          /* Login Form */
          <div className="bg-[#FFFFFF] rounded border border-border lg:rounded-none lg:border-0 p-8 min-h-[600px] flex flex-col justify-center">
            <div className="flex justify-center mb-6">
              <img src="/logo.png" alt="Logo" className="h-12 w-auto filter invert" />
            </div>
            <h1 className="text-2xl font-bold text-foreground text-center mb-6">
              Welcome Back
            </h1>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email" className="text-min">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="form-input-lg auth-input mt-1"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-destructive text-min mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="login-password" className="text-min">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                      className="form-input-lg auth-input pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-min mt-1">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 text-base"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
              </Button>
            </form>

            <p className="text-center text-min text-muted-foreground mt-6">
              Don't have an account?{' '}
              <button
                onClick={() => setIsLogin(false)}
                className="text-black hover:underline font-[500]"
              >
                Sign up
              </button>
            </p>
          </div>
        ) : (
          /* Signup Form */
          <div className="bg-[#FFFFFF] rounded border border-border lg:rounded-none lg:border-0 p-8 min-h-[600px] flex flex-col justify-center">
            <div className="flex justify-center mb-6">
              <img src="/logo.png" alt="Logo" className="h-12 w-auto filter invert" />
            </div>
            <h1 className="text-2xl font-bold text-foreground text-center mb-6">
              Create Account
            </h1>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label htmlFor="signup-name" className="text-min">Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="form-input-lg auth-input mt-1"
                  placeholder="Your name or company name"
                />
                {errors.name && (
                  <p className="text-destructive text-min mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label className="text-min">Account Type</Label>
                <RadioGroup
                  value={signupAccountType}
                  onValueChange={(value: 'personal' | 'company') => setSignupAccountType(value)}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="personal" id="personal" />
                    <Label htmlFor="personal" className="text-min cursor-pointer">Personal</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="company" id="company" />
                    <Label htmlFor="company" className="text-min cursor-pointer">Company</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="signup-email" className="text-min">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="form-input-lg auth-input mt-1"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-destructive text-min mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="signup-phone" className="text-min">Phone Number (Optional)</Label>
                <Input
                  id="signup-phone"
                  type="tel"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  className="form-input-lg auth-input mt-1"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <Label htmlFor="signup-password" className="text-min">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="form-input-lg auth-input pr-12"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-min mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <Label htmlFor="signup-confirm" className="text-min">Verify Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="signup-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    className="form-input-lg auth-input pr-12"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-destructive text-min mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="agreement"
                  checked={signupAgreement}
                  onCheckedChange={(checked) => setSignupAgreement(checked as boolean)}
                  className="mt-1"
                />
                <Label htmlFor="agreement" className="text-min cursor-pointer">
                  I agree to the Terms of Service and Privacy Policy
                </Label>
              </div>
              {errors.agreement && (
                <p className="text-destructive text-min">{errors.agreement}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 text-base"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign Up'}
              </Button>
            </form>

            <p className="text-center text-min text-muted-foreground mt-6">
              Already have an account?{' '}
              <button
                onClick={() => setIsLogin(true)}
                className="text-black hover:underline font-[500]"
              >
                Log in
              </button>
            </p>
        
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default Auth;