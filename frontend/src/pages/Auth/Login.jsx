import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import Button from '../../components/ui/Button/Button';
import Card from '../../components/ui/Card/Card';
import { useAuth } from '../../context/AuthContext';
import styles from './Auth.module.css';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loading, error, clearError, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const redirectPath = searchParams.get('redirect') || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath);
    }
  }, [isAuthenticated, navigate, redirectPath]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear general error
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await login(formData);
    
    if (result.success) {
      navigate(redirectPath);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className="container">
        <div className={styles.authContainer}>
          <Card className={styles.authCard}>
            <div className={styles.authHeader}>
              <h1>Welcome Back</h1>
              <p>Sign in to your account to continue shopping</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.authForm}>
              {error && (
                <div className={styles.errorAlert}>
                  <p>{error}</p>
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address</label>
                <div className={styles.inputWrapper}>
                  <FiMail className={styles.inputIcon} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className={`${styles.formInput} ${formErrors.email ? styles.error : ''}`}
                  />
                </div>
                {formErrors.email && (
                  <span className={styles.fieldError}>{formErrors.email}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password">Password</label>
                <div className={styles.inputWrapper}>
                  <FiLock className={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={`${styles.formInput} ${formErrors.password ? styles.error : ''}`}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {formErrors.password && (
                  <span className={styles.fieldError}>{formErrors.password}</span>
                )}
              </div>

              <div className={styles.formOptions}>
                <label className={styles.checkbox}>
                  <input type="checkbox" />
                  <span className={styles.checkmark}></span>
                  Remember me
                </label>
                <Link to="/forgot-password" className={styles.forgotLink}>
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                loading={loading}
                icon={<FiArrowRight />}
              >
                Sign In
              </Button>
            </form>

            <div className={styles.authFooter}>
              <p>
                Don't have an account?{' '}
                <Link to={`/register${redirectPath !== '/' ? `?redirect=${redirectPath}` : ''}`}>
                  Create one now
                </Link>
              </p>
            </div>

            {/* Demo Credentials */}
            <div className={styles.demoCredentials}>
              <h4>Demo Credentials</h4>
              <div className={styles.demoOptions}>
                <button
                  type="button"
                  className={styles.demoBtn}
                  onClick={() => setFormData({
                    email: 'demo@electrostore.com',
                    password: 'demo123456'
                  })}
                >
                  Demo User
                </button>
                <button
                  type="button"
                  className={styles.demoBtn}
                  onClick={() => setFormData({
                    email: 'admin@electrostore.com',
                    password: 'admin123456'
                  })}
                >
                  Demo Admin
                </button>
              </div>
            </div>
          </Card>

          <div className={styles.authImage}>
            <div className={styles.imageContent}>
              <h2>Join thousands of happy customers</h2>
              <p>Experience the best in electronics shopping with exclusive deals and fast delivery.</p>
              <div className={styles.features}>
                <div className={styles.feature}>
                  <span>✓</span>
                  <span>Secure payments</span>
                </div>
                <div className={styles.feature}>
                  <span>✓</span>
                  <span>Fast delivery</span>
                </div>
                <div className={styles.feature}>
                  <span>✓</span>
                  <span>Easy returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
