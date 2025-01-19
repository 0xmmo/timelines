import Link from 'next/link'

interface TimelineCardProps {
  name: string
  slug: string
  startDate: string
  endDate: string
}

export function TimelineCard({ name, slug, startDate, endDate }: TimelineCardProps) {
  return (
    <Link href={`/timeline?slug=${slug}`} className="block">
      <div className="border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4">
        <h3 className="font-corben text-lg font-semibold mb-2">{name}</h3>
        <p className="text-sm text-gray-600">
          {startDate} - {endDate}
        </p>
      </div>
    </Link>
  )
}

