import React from 'react';
import styles from './Button.module.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    disabled && styles.disabled,
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className={styles.spinner}>
          <div className={styles.spinnerIcon}></div>
        </span>
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className={styles.iconLeft}>{icon}</span>
      )}
      
      <span className={styles.content}>{children}</span>
      
      {!loading && icon && iconPosition === 'right' && (
        <span className={styles.iconRight}>{icon}</span>
      )}
    </button>
  );
};

export default Button;
