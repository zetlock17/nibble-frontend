import fishIcon from '@/assets/icons/fishing/fish.svg'

export function SpotMarker({ name, selected, onSelect }: { name: string; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" aria-label={`Выбрать место: ${name}`} aria-pressed={selected} onClick={onSelect} className={`relative flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill ${selected ? 'bg-primary' : 'bg-surface'}`}>
      <img src={fishIcon} alt="" className={`size-6 ${selected ? 'brightness-0 invert' : ''}`} />
      {selected && <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-max max-w-52 -translate-x-1/2 rounded-xl bg-surface px-3 py-2 text-center text-sm leading-5 font-semibold wrap-anywhere text-text">{name}</span>}
    </button>
  )
}
