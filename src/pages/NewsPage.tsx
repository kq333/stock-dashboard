import { translateError } from '@/lib/translationErrors'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useNewsQuery, type NewsCategory } from '@/services/newsService'
import NewsCard from '@/components/NewsCard'
import NewsLoader from '@/components/NewsLoader'
import TopbarNews from '@/components/TopbarNews'

const NewsPage = () => {
  const { t } = useTranslation()

  const [newsCategory, setNewsCategory] = useState<NewsCategory>('general')

  const { data: news = [], isPending, isFetching, error, refetch } = useNewsQuery(newsCategory)

  return (
    <>
      <TopbarNews newsCategory={newsCategory} setNewsCategory={setNewsCategory} />

      <section className="px-2 pt-24 pb-8 md:px-12">
        {isPending ? (
          <NewsLoader />
        ) : error ? (
          <div
            role="alert"
            className="mx-auto max-w-3xl rounded-lg border border-destructive/30 bg-destructive/10 p-4"
          >
            <p className="text-destructive">{translateError(error.message, t)}</p>
            <button
              type="button"
              disabled={isFetching}
              onClick={() => void refetch()}
              className="mt-3 rounded-md border border-border px-4 py-2 disabled:opacity-50"
            >
              {isFetching ? t('Retrying...') : t('Try again')}
            </button>
          </div>
        ) : news.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">
            {t('No news found for this category.')}
          </p>
        ) : (
          <section>
            <article className="mx-auto grid w-full max-w-375 grid-cols-[repeat(auto-fit,minmax(min(100%,450px),1fr))] gap-4">
              {news.map((article, index) => (
                <NewsCard key={article.id} {...article} isPriority={index === 0} />
              ))}
            </article>
          </section>
        )}
      </section>
    </>
  )
}

export default NewsPage
