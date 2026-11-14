import { Button } from '@/components/ui/button/Button'
import type { FishStatus } from './use-fish'

export function FishLoadingState({ status, onRetry }: { status: FishStatus; onRetry: () => void }) {
  if (status === 'ready') return null
  return <div role={status === 'error' ? 'alert' : 'status'} className="flex flex-col items-start gap-3 rounded-3xl bg-surface p-5 text-sm text-text-muted">
    <p className="m-0">{status === 'loading' ? 'Загружаем рыб…' : 'Не удалось загрузить рыб. Проверьте подключение и попробуйте ещё раз.'}</p>
    {status === 'error' && <Button variant="secondary" onClick={onRetry}>Повторить</Button>}
  </div>
}
