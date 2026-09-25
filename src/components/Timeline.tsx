import type { LifecycleEvent, SceneYear } from '../../shared/types'

const years: SceneYear[] = [2026, 2028, 2029, 2031]

export function Timeline({ year, events, onChange }: { year: SceneYear; events: LifecycleEvent[]; onChange: (year: SceneYear) => void }) {
  return <div className="timeline" aria-label="Property lifecycle timeline">
    <div className="timeline-line" />
    {years.map((item) => {
      const event = events.find((candidate) => candidate.year === item)
      return <button key={item} className={`timeline-stop ${year === item ? 'active' : ''}`} onClick={() => onChange(item)} aria-pressed={year === item}>
        <span className="timeline-dot" />
        <strong>{item}</strong>
        <small>{event?.type === 'construction' ? 'Occupied' : event?.type}</small>
      </button>
    })}
  </div>
}
