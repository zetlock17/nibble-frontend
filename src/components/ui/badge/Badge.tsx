import type { ReactNode } from 'react'

type BadgeProps = {
  children: ReactNode
  icon?: string
  narrowIcon?: boolean
  tone?: 'soft' | 'overlay'
  size?: 'sm' | 'md'
}

export function Badge({ children, icon, narrowIcon = false, tone = 'soft', size = 'md' }: BadgeProps) {
  // У узких значков убираем боковые поля SVG, сохраняя высоту и геометрию контура.
  const iconSize = narrowIcon
    ? `${size === 'sm' ? 'h-3.5' : 'h-4'} w-2.5 object-cover`
    : size === 'sm' ? 'size-3.5' : 'size-4'

  return (
    <span className={`inline-flex max-w-full items-center rounded-pill align-middle text-xs leading-4 font-bold wrap-anywhere ${size === 'sm' ? 'gap-1 px-2 py-0.5' : 'gap-1.5 px-3 py-1.5'} ${tone === 'overlay' ? 'bg-photo-tag text-surface' : 'bg-accent-soft text-focus'}`}>
      {icon && <img className={`shrink-0 ${iconSize} ${tone === 'overlay' ? 'invert' : ''}`} src={icon} alt="" />}
      <span className="min-w-0">{children}</span>
    </span>
  )
}
