import { Check, CircleAlert, LoaderCircle, X } from 'lucide-react'

interface Result { score: number; checks: Array<{ id: string; label: string; status: string; detail: string }> }

export function ValidationModal({ result, loading, onClose }: { result: Result | null; loading: boolean; onClose: () => void }) {
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Topology validation"><div className="modal-card">
    <button className="close-button" onClick={onClose}><X size={18} /></button>
    <div className="eyebrow">Rules engine</div>
    <h2>Cadastre validation</h2>
    {loading ? <div className="loading"><LoaderCircle className="spin" />Running topology and rights checks…</div> : result && <>
      <div className="score-ring" style={{ '--score': `${result.score * 3.6}deg` } as React.CSSProperties}><div><strong>{result.score}</strong><span>/100</span></div></div>
      <div className="check-list">{result.checks.map((check) => <div key={check.id} className="check-row">{check.status === 'pass' ? <Check className="pass" /> : <CircleAlert className="review" />}<div><strong>{check.label}</strong><p>{check.detail}</p></div></div>)}</div>
    </>}
  </div></div>
}
