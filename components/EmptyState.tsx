import styles from '@components/EmptyState.module.scss';
import * as React from 'react';

interface EmptyStateProps {
  message?: string;
  children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, children }) => {
  return (
    <div className={styles.root}>
      {message && <p className={styles.message}>{message}</p>}
      {children}
    </div>
  );
};

export default EmptyState;
