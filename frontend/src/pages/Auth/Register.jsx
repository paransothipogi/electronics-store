import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import Button from '../../components/ui/Button/Button';
import Card from '../../components/ui/Card/Card';
import { useAuth } from '../../context/AuthContext';
import styles from './Auth.module.css';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, loading, error, clearError, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [acceptTerms, setAcceptTerms] = useState(false);

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

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptTerms) {
      errors.terms = 'You must accept the terms and conditions';
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

    const { confirmPassword, ...registrationData } = formData;
    const result = await register(registrationData);
    
    if (result.success) {
      navigate(redirectPath);
    }
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#ff4757', '#ff6b35', '#ffa726', '#66bb6a', '#4caf50'];

  return (
    <div className={styles.authPage}>
      <div className="container">
        <div className={styles.authContainer}>
          <Card className={styles.authCard}>
            <div className={styles.authHeader}>
              <h1>Create Account</h1>
              <p>Join ElectroStore and start shopping for amazing electronics</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.authForm}>
              {error && (
                <div className={styles.errorAlert}>
                  <p>{error}</p>
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="name">Full Name</label>
                <div className={styles.inputWrapper}>
                  <FiUser className={styles.inputIcon} />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className={`${styles.formInput} ${formErrors.name ? styles.error : ''}`}
                  />
                </div>
                {formErrors.name && (
                  <span className={styles.fieldError}>{formErrors.name}</span>
                )}
              </div>

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
                    placeholder="Create a password"
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
                {formData.password && (
                  <div className={styles.passwordStrength}>
                    <div className={styles.strengthBar}>
                      <div 
                        className={styles.strengthFill}
                        style={{ 
                          width: `${(passwordStrength / 5) * 100}%`,
                          backgroundColor: strengthColors[passwordStrength - 1] || '#ddd'
                        }}
                      />
                    </div>
                    <span 
                      className={styles.strengthLabel}
                      style={{ color: strengthColors[passwordStrength - 1] || '#ddd' }}
                    >
                      {strengthLabels[passwordStrength - 1] || 'Very Weak'}
                    </span>
                  </div>
                )}
                {formErrors.password && (
                  <span className={styles.fieldError}>{formErrors.password}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className={styles.inputWrapper}>
                  <FiLock className={styles.inputIcon} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className={`${styles.formInput} ${formErrors.confirmPassword ? styles.error : ''}`}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <span className={styles.fieldError}>{formErrors.confirmPassword}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => {
                      setAcceptTerms(e.target.checked);
                      if (formErrors.terms) {
                        setFormErrors(prev => ({ ...prev, terms: '' }));
                      }
                    }}
                  />
                  <span className={styles.checkmark}></span>
                  I agree to the{' '}
                  <Link to="/terms" target="_blank">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" target="_blank">Privacy Policy</Link>
                </label>
                {formErrors.terms && (
                  <span className={styles.fieldError}>{formErrors.terms}</span>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                loading={loading}
                icon={<FiArrowRight />}
              >
                Create Account
              </Button>
            </form>

            <div className={styles.authFooter}>
              <p>
                Already have an account?{' '}
                <Link to={`/login${redirectPath !== '/' ? `?redirect=${redirectPath}` : ''}`}>
                  Sign in here
                </Link>
              </p>
            </div>
          </Card>

          <div className={styles.authImage}>
            <div className={styles.imageContent}>
              <h2>Start your electronics journey</h2>
              <p>Create your account and get access to exclusive deals, fast checkout, and order tracking.</p>
              <div className={styles.benefits}>
                <div className={styles.benefit}>
                  <span>🎯</span>
                  <div>
                    <h4>Personalized Experience</h4>
                    <p>Get recommendations based on your preferences</p>
                  </div>
                </div>
                <div className={styles.benefit}>
                  <span>⚡</span>
                  <div>
                    <h4>Fast Checkout</h4>
                    <p>Save your info for lightning-fast purchases</p>
                  </div>
                </div>
                <div className={styles.benefit}>
                  <span>📦</span>
                  <div>
                    <h4>Order Tracking</h4>
                    <p>Track your orders from purchase to delivery</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
