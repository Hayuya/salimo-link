import { ReactNode, HTMLAttributes } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverable?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export const Card = ({
  children,
  hoverable = false,
  padding = 'md',
  className = '',
  ...props
}: CardProps) => {
  const classNames = [
    styles.card,
    styles[padding],
    hoverable && styles.hoverable,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
};