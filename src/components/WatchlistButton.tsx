import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'

type WatchlistButtonProps = {
  assetName: string
  isSaved: boolean
  onToggle: () => void
  showLabel?: boolean
}

const WatchlistButton = ({
  assetName,
  isSaved,
  onToggle,
  showLabel = false,
}: WatchlistButtonProps) => {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex size-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[label=true]:w-auto data-[label=true]:px-3"
      data-label={showLabel}
      aria-label={t(isSaved ? 'Remove watchlist asset' : 'Add watchlist asset', {
        name: assetName,
      })}
      title={t(isSaved ? 'Remove from watchlist' : 'Add to watchlist')}
    >
      <Star className={`size-4 ${isSaved ? 'fill-current text-yellow-500' : ''}`} />
      {showLabel && (
        <span className="text-sm font-medium">{isSaved ? t('Saved') : t('Watchlist')}</span>
      )}
    </button>
  )
}

export default WatchlistButton
