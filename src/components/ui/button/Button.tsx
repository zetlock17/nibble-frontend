import type { ButtonHTMLAttributes } from 'react'

export function Button({
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-9.5 items-center justify-center gap-2 rounded-pill border-0 bg-primary px-3.5 py-0 text-sm leading-snug font-semibold whitespace-nowrap text-surface hover:bg-primary-hover active:bg-focus disabled:cursor-default disabled:opacity-50 [&_svg]:shrink-0 ${className}`}
      {...props}
    />
  )
}
