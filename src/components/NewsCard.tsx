import dateFunction from '../utils/dateFuncion'

interface Props {
  category: string
  datetime: number
  headline: string

  image: string
  related: string
  source: string
  summary: string
  url: string
  isPriority?: boolean
}

const NewsCard: React.FC<Props> = ({
  category,
  datetime,
  headline,
  image,
  source,
  summary,
  url,
  isPriority = false,
}) => {
  return (
    <div className="mx-auto mb-4 flex h-full w-full min-w-0 max-w-md  flex-col overflow-hidden rounded-md border bg-card transition-[translate,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
      <img
        className="aspect-video w-full max-w-full object-cover"
        src={image}
        alt={headline}
        loading={isPriority ? 'eager' : 'lazy'}
        fetchPriority={isPriority ? 'high' : 'auto'}
      />

      <div className="flex flex-1 flex-col p-4">
        <div className="flex gap-2 items-center mt-2 mb-4 text-sm text-gray-600">
          <p className=" text-md font-semibold text-gray-600 uppercase"> {source}</p>
          <p className="w-1 h-1 bg-gray-600 rounded-full"></p>
          <p> {dateFunction(datetime)}</p>
        </div>

        <h3 className="text-2xl font-bold mb-2 text-foreground ">{headline}</h3>
        <p className="text-muted-foreground text-xl pt-4 ">{summary}</p>

        <div className="mt-auto flex w-full items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
          <p className="text-muted-foreground text-xs font-semibold bg-accent pt-1 pb-1 pr-2 pl-2 uppercase">
            {' '}
            {category}
          </p>
          <a
            className="text-primary hover:underline "
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read more...
          </a>
        </div>
      </div>
    </div>
  )
}

export default NewsCard
