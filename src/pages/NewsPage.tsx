import { useState } from 'react'
import { useNewsQuery, type NewsCategory } from '@/services/newsService'
import NewsCard from '@/components/NewsCard'
import NewsLoader from '@/components/NewsLoader'
import TopbarNews from '@/components/TopbarNews'

const NewsPage = () => {
  const [newsCategory, setNewsCategory] = useState<NewsCategory>('general')

  const { data: news = [], isPending, error } = useNewsQuery(newsCategory)

  return (
    <>
      <TopbarNews newsCategory={newsCategory} setNewsCategory={setNewsCategory} />

      {isPending ? (
        <NewsLoader />
      ) : error ? (
        <div>{error.message}</div>
      ) : (
        <section>
          <article className="mx-auto grid w-full max-w-375 grid-cols-[repeat(auto-fit,minmax(min(100%,450px),1fr))] gap-4 px-2 pt-32 pb-8 md:px-12">
            {news.map((article, index) => (
              <NewsCard key={article.id} {...article} isPriority={index === 0} />
            ))}
          </article>
        </section>
      )}
    </>
  )
}

export default NewsPage
