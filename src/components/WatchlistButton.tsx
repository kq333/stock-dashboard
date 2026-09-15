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
}: WatchlistButtonProps) => (
  <button
    type="button"
    onClick={onToggle}
    className="inline-flex size-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[label=true]:w-auto data-[label=true]:px-3"
    data-label={showLabel}
    aria-label={`${isSaved ? 'Remove' : 'Add'} ${assetName} ${isSaved ? 'from' : 'to'} watchlist`}
    title={`${isSaved ? 'Remove from' : 'Add to'} watchlist`}
  >
    <Star className={`size-4 ${isSaved ? 'fill-current text-yellow-500' : ''}`} />
    {showLabel && <span className="text-sm font-medium">{isSaved ? 'Saved' : 'Watchlist'}</span>}
  </button>
)

export default WatchlistButton
