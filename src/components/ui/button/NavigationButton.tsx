import type { ButtonHTMLAttributes } from 'react'

type NavigationButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: string
  iconClassName?: string
  selected?: boolean
}

export function NavigationButton({
  icon,
  iconClassName = 'size-6',
  selected = false,
  children,
  className = '',
  type = 'button',
  ...props
}: NavigationButtonProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={`flex min-h-14 w-full items-center gap-3 rounded-3xl border-0 px-4 py-3 text-left text-xl leading-7 font-medium max-sm:min-h-12 max-sm:justify-center max-sm:rounded-pill max-sm:px-0 max-sm:py-0 ${selected ? 'bg-navigation-highlight' : 'bg-transparent hover:bg-navigation-hover'} ${className}`}
      {...props}
    >
      <span className="grid size-6 shrink-0 place-items-center">
        <img className={`block ${iconClassName}`} src={icon} alt="" />
      </span>
      {/* На телефоне подпись остаётся только для скринридеров: в панели внизу помещаются одни иконки. */}
      <span className="max-sm:sr-only">{children}</span>
    </button>
  )
}
