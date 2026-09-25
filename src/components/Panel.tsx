import { CheckCircle2, CircleAlert, Copy, ExternalLink, ShieldCheck, X } from 'lucide-react'
import type { ParcelSnapshot, Unit } from '../../shared/types'

export function UnitPanel({ unit, snapshot, onClose }: { unit: Unit | null; snapshot: ParcelSnapshot; onClose: () => void }) {
  if (!unit) return <aside className="detail-panel summary-panel">
    <div className="eyebrow">Scene intelligence</div>
    <h2>{snapshot.label}</h2>
    <span className={`status status-${snapshot.status.toLowerCase()}`}>{snapshot.status}</span>
    <div className="fact-grid">
      <div><small>Structure</small><strong>{snapshot.structureId ?? 'No structure'}</strong></div>
      <div><small>Use</small><strong>{snapshot.structureType}</strong></div>
      <div><small>Floors</small><strong>{snapshot.floors}</strong></div>
      <div><small>Spatial units</small><strong>{snapshot.units}</strong></div>
    </div>
    <div className="confidence"><div><span>Source confidence</span><strong>{snapshot.confidence}%</strong></div><div className="progress"><i style={{ width: `${snapshot.confidence}%` }} /></div></div>
    <p className="helper"><ShieldCheck size={17} /> The base parcel remains persistent across every scene. Structures are versioned, never erased.</p>
  </aside>

  return <aside className="detail-panel unit-panel">
    <button className="close-button" onClick={onClose} aria-label="Close unit details"><X size={18} /></button>
    <div className="eyebrow">Volumetric spatial unit</div>
    <h2>Floor {unit.floor} · Unit {unit.index}</h2>
    <button className="id-chip" onClick={() => navigator.clipboard?.writeText(unit.id)}>{unit.id}<Copy size={14} /></button>
    <div className="right-status">{unit.rightStatus === 'Active' ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}<span><small>Registered right</small><strong>{unit.rightStatus}</strong></span></div>
    <div className="fact-list">
      <div><span>Rights holder</span><strong>{unit.holder}</strong></div>
      <div><span>Floor area</span><strong>{unit.area} m²</strong></div>
      <div><span>Volume</span><strong>{unit.volume} m³</strong></div>
      <div><span>Common share</span><strong>{unit.share}</strong></div>
    </div>
    <button className="secondary full">Open complete record <ExternalLink size={15} /></button>
    <p className="legal-note">Prototype 3D spatial-property identifier. It supports administration and does not independently determine legal title.</p>
  </aside>
}
