import type { NewsCategory } from '@/services/newsService'
import { useHideOnScroll } from '@/hooks/useHideOnScroll'

interface Props {
  newsCategory: NewsCategory
  setNewsCategory: (value: NewsCategory) => void
}

const topbarElements: { label: string; value: NewsCategory }[] = [
  { label: 'General', value: 'general' },
  { label: 'Crypto', value: 'crypto' },
  { label: 'Merger', value: 'merger' },
]

const TopbarNews: React.FC<Props> = ({ newsCategory, setNewsCategory }) => {
  const isHiddenOnScroll = useHideOnScroll()

  return (
    <header
      className={`fixed inset-x-0 z-20 border-b border-sidebar-border bg-sidebar py-4 transition-[translate] duration-300 ${
        isHiddenOnScroll ? 'max-lg:-translate-y-full' : 'translate-y-0'
      }`}
    >

        <ul className="flex flex-1 items-center justify-center gap-1 text-muted-foreground uppercase md:gap-8">
          {topbarElements.map(({ label, value }) => (
            <li key={value}>
              <button
                type="button"
                onClick={() => setNewsCategory(value)}
                className={`cursor-pointer rounded-md px-3 py-2 text-base font-semibold transition-colors md:text-2xl ${
                  newsCategory === value
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>

    </header>
  )
}

export default TopbarNews
