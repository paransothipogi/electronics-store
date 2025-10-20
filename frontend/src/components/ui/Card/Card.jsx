import React from 'react';
import styles from './Card.module.css';

const Card = ({
  children,
  variant = 'default',
  padding = 'medium',
  hover = false,
  shadow = 'medium',
  className = '',
  onClick,
  ...props
}) => {
  const cardClasses = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    styles[`shadow-${shadow}`],
    hover && styles.hover,
    onClick && styles.clickable,
    className
  ].filter(Boolean).join(' ');

  const CardComponent = onClick ? 'button' : 'div';

  return (
    <CardComponent
      className={cardClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`${styles.header} ${className}`}>
    {children}
  </div>
);

const CardBody = ({ children, className = '' }) => (
  <div className={`${styles.body} ${className}`}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`${styles.footer} ${className}`}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
