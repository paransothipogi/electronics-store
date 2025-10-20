import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiArrowLeft } from 'react-icons/fi';
import Button from '../../components/ui/Button/Button';
import styles from './NotFound.module.css';

const NotFound = () => {
  return (
    <div className={styles.notFound}>
      <div className="container">
        <div className={styles.content}>
          <div className={styles.errorCode}>404</div>
          <h1>Page Not Found</h1>
          <p>
            Sorry, the page you are looking for doesn't exist or has been moved.
          </p>
          <div className={styles.actions}>
            <Link to="/">
              <Button variant="primary" icon={<FiHome />}>
                Go Home
              </Button>
            </Link>
            <Button 
              variant="outline" 
              icon={<FiArrowLeft />}
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
