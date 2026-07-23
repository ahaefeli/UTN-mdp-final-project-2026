import styles from './Button.module.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  type = 'button',
  className = '',
  ...props
}) {
  const classes = [
    styles.btn,
    styles[variant] || styles.primary,
    size !== 'md' ? styles[size] : '',
    block ? styles.block : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
