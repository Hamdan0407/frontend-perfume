import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
// import { toast } from 'react-toastify';
// const toast = { success: () => { }, error: () => { }, info: () => { }, warn: () => { }, warning: () => { } };
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';
import authAPI from '../api/authAPI';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(''); // For wrong credentials error

  // Show session expired message if redirected from token refresh failure
  const sessionExpired = searchParams.get('session') === 'expired';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    // Clear login error when user starts typing
    if (loginError) {
      setLoginError('');
    }
  };

  const handleSubmit = async (e) => {
    // CRITICAL: Prevent default form submission and page reload
    e.preventDefault();
    e.stopPropagation();

    console.log('🚀 Form submitted');
    console.log('📧 Email:', formData.email);
    console.log('🔑 Password:', formData.password);
    console.log('📏 Password length:', formData.password.length);

    setErrors({});
    setLoginError(''); // Clear previous login errors

    // Validate inputs
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Attempting login with:', formData.email);

      // Direct fetch to bypass any axios interceptor issues
      const fetchResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

      console.log('📡 Fetch response status:', fetchResponse.status);
      const response = await fetchResponse.json();
      console.log('📦 Login response:', response);

      if (response?.token) {
        // Store user data and tokens from API response
        console.log('✅ Login successful, storing tokens and navigating...');
        login(
          {
            id: response.id,
            email: response.email,
            firstName: response.firstName,
            lastName: response.lastName,
            role: response.role
          },
          response.token,
          response.refreshToken,
          response.expiresIn || 3600
        );

        toast.success('Login successful! Welcome back.');

        // Use React Router navigate for smooth client-side navigation (NO page reload)
        // Small delay to ensure state is updated before navigation
        setTimeout(() => {
          console.log('🔄 Navigating to home page...');
          sessionStorage.setItem('showIntroOnNextLoad', 'true');
          navigate('/', { replace: true });
        }, 100);
      } else {
        toast.error('Login failed. Please check your credentials.');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Error message:', error.message);

      // Show the actual error
      setLoginError('Login error: ' + error.message);
      setLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleSuccess = (credentialResponse) => {
    setLoading(true);
    try {
      const token = credentialResponse.credential;
      // Send token to backend for verification and user creation
      authAPI.loginWithGoogle(token)
        .then((response) => {
          if (response?.token) {
            login(
              {
                id: response.id,
                email: response.email,
                firstName: response.firstName,
                lastName: response.lastName,
                role: response.role
              },
              response.token,
              response.refreshToken,
              response.expiresIn || 3600
            );
            toast.success('Google login successful!');
            sessionStorage.setItem('showIntroOnNextLoad', 'true');
            navigate('/');
          }
        })
        .catch((error) => {
          console.error('Google login error:', error);
          toast.error('Google login failed. Please try again.');
        })
        .finally(() => setLoading(false));
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Google login failed. Please try again.');
      setLoading(false);
    }
  };

  // Handle Facebook login (placeholder)
  const handleFacebookLogin = () => {
    toast.info('Facebook login is not yet configured. Please use email login or Google OAuth.');
  };

  // Handle Microsoft login (placeholder)
  const handleMicrosoftLogin = () => {
    toast.info('Microsoft login is not yet configured. Please use email login or Google OAuth.');
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-accent" />
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
            </div>
          </div>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {sessionExpired && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your session has expired. Please log in again.
              </AlertDescription>
            </Alert>
          )}

          {loginError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                disabled={loading}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="space-y-4">
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>

            <Alert className="bg-muted/50">
              <AlertDescription className="text-xs space-y-1">
                <p className="font-semibold text-foreground">Example Format:</p>
                <p><strong>Email:</strong> your.email@example.com</p>
                <p><strong>Password:</strong> Your secure password</p>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
