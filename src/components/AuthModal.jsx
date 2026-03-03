import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, AlertCircle, Sparkles, UserPlus, X } from 'lucide-react';
import authAPI from '../api/authAPI';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuthStore();

  // Sync tab when initialTab prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>

        {/* Logo */}
        <div className="flex justify-center pt-6 pb-2">
          <img src="/muwas-logo-nobg.png" alt="Muwas Logo" className="h-14 w-auto" />
        </div>

        {/* Tab Switcher */}
        <div className="flex mx-6 mb-4 bg-gray-100 dark:bg-slate-900 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-800 text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'register'
                ? 'bg-white dark:bg-slate-800 text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {activeTab === 'login' ? (
            <LoginForm onClose={onClose} login={login} toast={toast} navigate={navigate} onSwitchTab={() => setActiveTab('register')} />
          ) : (
            <RegisterForm onClose={onClose} login={login} toast={toast} navigate={navigate} onSwitchTab={() => setActiveTab('login')} />
          )}
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onClose, login, toast, navigate, onSwitchTab }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
    if (loginError) setLoginError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setErrors({});
    setLoginError('');

    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      const response = await authAPI.login(formData.email, formData.password);
      if (response?.token) {
        login(
          { id: response.id, email: response.email, firstName: response.firstName, lastName: response.lastName, role: response.role },
          response.token, response.refreshToken, response.expiresIn || 3600
        );
        toast.success('Login successful! Welcome back.');
        onClose();
        setTimeout(() => {
          sessionStorage.setItem('showIntroOnNextLoad', 'true');
          navigate('/', { replace: true });
        }, 100);
      } else {
        toast.error('Login failed. Please check your credentials.');
        setLoading(false);
      }
    } catch (error) {
      const displayMessage = error.response?.data?.message || error.message;
      toast.error(displayMessage);
      setLoginError(displayMessage);
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    setLoading(true);
    authAPI.loginWithGoogle(credentialResponse.credential)
      .then((response) => {
        if (response?.token) {
          login(
            { id: response.id, email: response.email, firstName: response.firstName, lastName: response.lastName, role: response.role },
            response.token, response.refreshToken, response.expiresIn || 3600
          );
          toast.success('Google login successful!');
          onClose();
          sessionStorage.setItem('showIntroOnNextLoad', 'true');
          navigate('/');
        }
      })
      .catch(() => toast.error('Google login failed. Please try again.'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-4">
      {loginError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{loginError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="login-email">Email Address</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            disabled={loading}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <div className="relative">
            <Input
              id="login-password"
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
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => { onClose(); navigate('/forgot-password'); }}
            className="text-sm text-primary hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-950 px-2 text-muted-foreground">or continue with</span>
        </div>
      </div>

      {/* Google Login */}
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => toast.error('Google login failed.')}
          theme="outline"
          size="large"
          width="100%"
          text="signin_with"
        />
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Don't have an account?{' '}
        <button onClick={onSwitchTab} className="text-primary hover:underline font-medium">
          Sign up
        </button>
      </p>
    </div>
  );
}

function RegisterForm({ onClose, login, toast, navigate, onSwitchTab }) {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    else if (formData.firstName.trim().length < 2) newErrors.firstName = 'Min 2 characters';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    else if (formData.lastName.trim().length < 2) newErrors.lastName = 'Min 2 characters';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
    if (formData.password.length < 6) newErrors.password = 'Password must be 6+ characters';
    else if (!/^(?=.*[A-Za-z])(?=.*[\d@$!%*?&])/.test(formData.password))
      newErrors.password = 'Must contain letters and at least one digit or special character';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords don't match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await authAPI.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      toast.success('Account created! Please sign in.');
      // Switch to login tab after successful registration
      onSwitchTab();
    } catch (error) {
      let errorMsg = 'Registration failed. Please try again.';
      if (error.response?.data) {
        const data = error.response.data;
        if (data.message) errorMsg = data.message;
        else if (data.fieldErrors) errorMsg = Object.values(data.fieldErrors)[0];
        else if (data.error) errorMsg = data.error;
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = (credentialResponse) => {
    setLoading(true);
    authAPI.loginWithGoogle(credentialResponse.credential)
      .then((response) => {
        if (response?.token) {
          login(
            { id: response.id, email: response.email, firstName: response.firstName, lastName: response.lastName, role: response.role },
            response.token, response.refreshToken, response.expiresIn || 3600
          );
          toast.success('Google account created and logged in!');
          onClose();
          sessionStorage.setItem('showIntroOnNextLoad', 'true');
          navigate('/');
        }
      })
      .catch(() => toast.error('Google signup failed. Please try again.'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reg-firstName">First Name</Label>
            <Input id="reg-firstName" name="firstName" value={formData.firstName} onChange={handleChange} disabled={loading} className={errors.firstName ? 'border-destructive' : ''} />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-lastName">Last Name</Label>
            <Input id="reg-lastName" name="lastName" value={formData.lastName} onChange={handleChange} disabled={loading} className={errors.lastName ? 'border-destructive' : ''} />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-email">Email</Label>
          <Input id="reg-email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={loading} className={errors.email ? 'border-destructive' : ''} />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-password">Password</Label>
          <div className="relative">
            <Input id="reg-password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} disabled={loading} className={errors.password ? 'border-destructive pr-10' : 'pr-10'} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input id="reg-confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} disabled={loading} className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'} />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          <UserPlus className="h-4 w-4 mr-2" />
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-950 px-2 text-muted-foreground">or continue with</span>
        </div>
      </div>

      {/* Google Sign Up */}
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSignUp}
          onError={() => toast.error('Google signup failed.')}
          theme="outline"
          size="large"
          width="100%"
          text="signup_with"
        />
      </div>

      <p className="text-center text-sm text-muted-foreground mt-3">
        Already have an account?{' '}
        <button onClick={onSwitchTab} className="text-primary hover:underline font-medium">
          Sign in
        </button>
      </p>
    </div>
  );
}
