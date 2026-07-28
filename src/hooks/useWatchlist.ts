import { useCallback, useMemo, useSyncExternalStore } from 'react'

export type WatchlistAsset = {
  id: string
  name: string
  symbol: string
  type: 'crypto' | 'stock'
}

const WATCHLIST_STORAGE_KEY = 'stock-dashboard-watchlist'
const WATCHLIST_CHANGE_EVENT = 'stock-dashboard-watchlist-change'
const DEFAULT_WATCHLIST: WatchlistAsset[] = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', type: 'crypto' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', type: 'crypto' },
  { id: 'AAPL', name: 'Apple', symbol: 'AAPL', type: 'stock' },
  { id: 'NVDA', name: 'Nvidia', symbol: 'NVDA', type: 'stock' },
]
const DEFAULT_WATCHLIST_JSON = JSON.stringify(DEFAULT_WATCHLIST)

const isWatchlistAsset = (value: unknown): value is WatchlistAsset => {
  if (!value || typeof value !== 'object') return false

  const asset = value as Partial<WatchlistAsset>

  return (
    typeof asset.id === 'string' &&
    typeof asset.name === 'string' &&
    typeof asset.symbol === 'string' &&
    (asset.type === 'crypto' || asset.type === 'stock')
  )
}

const parseWatchlist = (value: string): WatchlistAsset[] => {
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) && parsed.every(isWatchlistAsset) ? parsed : DEFAULT_WATCHLIST
  } catch {
    return DEFAULT_WATCHLIST
  }
}

const getWatchlistSnapshot = () =>
  localStorage.getItem(WATCHLIST_STORAGE_KEY) ?? DEFAULT_WATCHLIST_JSON

const subscribeToWatchlist = (onStoreChange: () => void) => {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === WATCHLIST_STORAGE_KEY) onStoreChange()
  }

  window.addEventListener('storage', handleStorage)
  window.addEventListener(WATCHLIST_CHANGE_EVENT, onStoreChange)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(WATCHLIST_CHANGE_EVENT, onStoreChange)
  }
}

const saveWatchlist = (watchlist: WatchlistAsset[]) => {
  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist))
  window.dispatchEvent(new Event(WATCHLIST_CHANGE_EVENT))
}

export const useWatchlist = () => {
  const snapshot = useSyncExternalStore(
    subscribeToWatchlist,
    getWatchlistSnapshot,
    () => DEFAULT_WATCHLIST_JSON,
  )
  const watchlist = useMemo(() => parseWatchlist(snapshot), [snapshot])

  const isInWatchlist = useCallback(
    (asset: Pick<WatchlistAsset, 'id' | 'type'>) =>
      watchlist.some((savedAsset) => savedAsset.id === asset.id && savedAsset.type === asset.type),
    [watchlist],
  )

  const addAsset = useCallback(
    (asset: WatchlistAsset) => {
      if (isInWatchlist(asset)) return
      saveWatchlist([...watchlist, asset])
    },
    [isInWatchlist, watchlist],
  )

  const removeAsset = useCallback(
    (asset: Pick<WatchlistAsset, 'id' | 'type'>) => {
      saveWatchlist(
        watchlist.filter(
          (savedAsset) => savedAsset.id !== asset.id || savedAsset.type !== asset.type,
        ),
      )
    },
    [watchlist],
  )

  const toggleAsset = useCallback(
    (asset: WatchlistAsset) => {
      if (isInWatchlist(asset)) {
        removeAsset(asset)
      } else {
        addAsset(asset)
      }
    },
    [addAsset, isInWatchlist, removeAsset],
  )

  return {
    addAsset,
    isInWatchlist,
    removeAsset,
    toggleAsset,
    watchlist,
  }
}
