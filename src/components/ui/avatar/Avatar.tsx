type AvatarProps = { initials: string }

export function Avatar({ initials }: AvatarProps) {
  return (
    <span
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-pill bg-avatar text-xs leading-none font-extrabold text-surface"
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}
