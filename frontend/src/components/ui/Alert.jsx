function Alert({
  children,
  variant = "info",
  className = "",
  ...props
}) {
  return (
    <div
      className={`alert alert--${variant} ${className}`}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
}

export default Alert;