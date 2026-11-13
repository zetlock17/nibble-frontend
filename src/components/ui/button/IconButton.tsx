import type { ButtonHTMLAttributes } from 'react'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: string
  label: string
  iconClassName?: string
}

export function IconButton({ icon, label, iconClassName = 'size-6', className = '', type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-pill border-0 disabled:opacity-50 ${className}`}
      {...props}
    >
      <img className={iconClassName} src={icon} alt="" />
    </button>
  )
}
