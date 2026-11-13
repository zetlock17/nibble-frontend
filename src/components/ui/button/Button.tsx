import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md'
}

export function Button({
  className = '',
  type = 'button',
  variant = 'primary',
  size = 'sm',
  ...props
}: ButtonProps) {
  const colors = variant === 'secondary'
    ? 'bg-accent-soft font-extrabold text-focus hover:bg-selection active:bg-selection'
    : 'bg-primary font-semibold text-surface hover:bg-primary-hover active:bg-focus'
  const dimensions = size === 'md' ? 'min-h-11 px-4' : 'min-h-9.5 px-3.5'

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-pill border-0 py-0 text-sm leading-snug whitespace-nowrap disabled:cursor-default disabled:opacity-50 [&_svg]:shrink-0 ${dimensions} ${colors} ${className}`}
      {...props}
    />
  )
}
