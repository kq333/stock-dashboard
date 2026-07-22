const PLACEHOLDERS = Array.from({ length: 9 })

const NewsLoader = () => {
  return (
    <section aria-busy="true" aria-live="polite">
      <div className="mx-auto grid w-full max-w-375 grid-cols-[repeat(auto-fit,minmax(450px,1fr))] gap-4  ">
        {PLACEHOLDERS.map((_, index) => (
          <div
            key={index}
            className="mx-auto w-full max-w-md overflow-hidden rounded-md border bg-card"
          >
            <div className="aspect-video animate-pulse bg-muted" />

            <div className="space-y-4 p-4">
              <div className="flex gap-2">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </div>

              <div className="h-7 w-4/5 animate-pulse rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-5 w-full animate-pulse rounded bg-muted" />
                <div className="h-5 w-11/12 animate-pulse rounded bg-muted" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
              </div>

              <div className="flex justify-between border-t border-border pt-4">
                <div className="h-6 w-20 animate-pulse rounded bg-muted" />
                <div className="h-5 w-24 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default NewsLoader
