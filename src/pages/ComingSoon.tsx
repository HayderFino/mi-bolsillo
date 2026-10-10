import { Clock } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState'
import { es } from '../i18n/es'

/** Honest placeholder for sections not built yet: it shows no data and pretends nothing. */
export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="visually-hidden">{title}</h1>
      <EmptyState icon={Clock} title={es.comingSoon.title} text={es.comingSoon.text} />
    </div>
  )
}
