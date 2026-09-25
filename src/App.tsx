import { lazy, Suspense, useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Box,
  Building2,
  Check,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Compass,
  Database,
  Expand,
  FileCheck2,
  Layers3,
  LayoutGrid,
  LockKeyhole,
  Map,
  MapPin,
  Pause,
  Play,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  atYear,
  uses,
  useColors,
  type CityData,
  type CityUnit,
  type LandUse,
  type Review,
  type Validation,
} from "../shared/city";
import { call, cityApi } from "./city-api";
import { CityMap } from "./components/CityMap";
import { SceneBoundary } from "./components/SceneBoundary";
const CityScene = lazy(() => import("./components/CityScene"));
type Page =
  | "City explorer"
  | "Parcel registry"
  | "Review queue"
  | "Audit trail";
export default function App() {
  const [data, setData] = useState<CityData | null>(null),
    [error, setError] = useState(""),
    [page, setPage] = useState<Page>("City explorer");
  const [selected, setSelected] = useState("P-9471"),
    [year, setYear] = useState(2026),
    [mode, setMode] = useState<"2D" | "3D" | "Split">("3D");
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState<LandUse | "All">("All"),
    [floor, setFloor] = useState(0),
    [unit, setUnit] = useState<CityUnit | null>(null);
  const [boundaries, setBoundaries] = useState(true),
    [buildings, setBuildings] = useState(true),
    [focus, setFocus] = useState(0),
    [playing, setPlaying] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]),
    [audit, setAudit] = useState<Awaited<
      ReturnType<typeof cityApi.audit>
    > | null>(null);
  const [validation, setValidation] = useState<Validation | null>(null),
    [busy, setBusy] = useState(false),
    [modal, setModal] = useState<
      "validation" | "review" | "login" | "guide" | null
    >(null);
  const [token, setToken] = useState(""),
    [credential, setCredential] = useState(""),
    [note, setNote] = useState(""),
    [notice, setNotice] = useState("");
  async function refresh() {
    const [r, a] = await Promise.all([cityApi.reviews(), cityApi.audit()]);
    setReviews(r);
    setAudit(a);
  }
  useEffect(() => {
    Promise.all([cityApi.load(), cityApi.reviews(), cityApi.audit()])
      .then(([d, r, a]) => {
        setData(d);
        setReviews(r);
        setAudit(a);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!playing || !data) return;
    const timer = setInterval(
      () =>
        setYear(
          (y) => data.years[(data.years.indexOf(y) + 1) % data.years.length],
        ),
      3000,
    );
    return () => clearInterval(timer);
  }, [playing, data]);
  useEffect(() => {
    setFloor(0);
    setUnit(null);
  }, [selected, year]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);
  const p = data?.parcels.find((p) => p.id === selected),
    v = p ? atYear(p, year) : null;
  const parcels =
    data?.parcels.filter(
      (p) =>
        (filter === "All" || p.use === filter) &&
        [
          p.name,
          p.id,
          p.ulpin,
          p.ward,
          ...p.versions.flatMap((v) => v.units.map((u) => u.id)),
        ].some((s) => s.toLowerCase().includes(query.toLowerCase())),
    ) ?? [];
  const count =
    data?.parcels.reduce((n, p) => n + atYear(p, year).units.length, 0) ?? 0;
  function select(id: string) {
    setSelected(id);
    setUnit(null);
  }
  async function validate() {
    if (!p) return;
    setModal("validation");
    setValidation(null);
    setBusy(true);
    setError("");
    try {
      setValidation(await cityApi.validate(p.id, year));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (modal === "login") {
        await call("/session", {}, credential);
        setToken(credential);
        setCredential("");
        setNotice("Officer access enabled for this session.");
      } else {
        await call("/reviews", { parcelId: selected, note }, token);
        setNote("");
        await refresh();
        setNotice("Review submitted. Audit chain updated.");
      }
      setModal(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function resolveReview(id: string) {
    setBusy(true);
    try {
      await call("/reviews/" + id + "/resolve", {}, token);
      await refresh();
      setNotice("Review resolved and recorded in the audit trail.");
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!data || !p || !v)
    return (
      <div className="startup">
        <Layers3 size={40} />
        <h1>BhuDrishti</h1>
        <p>{error || "Opening your city workspace…"}</p>
        {error && (
          <button onClick={() => location.reload()}>Retry connection</button>
        )}
      </div>
    );
  const mapProps = {
    parcels: data.parcels,
    selected,
    year,
    filter,
    onSelect: select,
    boundaries,
    buildings,
  };
  return (
    <div className="app-shell">
      <aside className="sidebar" inert={!!modal}>
        <a className="brand" href="/">
          <span className="brand-icon">
            <Layers3 size={25} />
          </span>
          <span>
            BhuDrishti<small>LAND. SPACE. TIME.</small>
          </span>
        </a>
        <div className="workspace-label">
          WORKSPACE <span>BETA 02</span>
        </div>
        <nav aria-label="Main navigation">
          {(
            [
              ["City explorer", Map],
              ["Parcel registry", Database],
              ["Review queue", ClipboardCheck],
              ["Audit trail", ShieldCheck],
            ] as const
          ).map(([name, Icon]) => (
            <button
              className={page === name ? "active" : ""}
              key={name}
              onClick={() => setPage(name)}
            >
              <Icon size={18} />
              {name}
              {name === "Review queue" && (
                <span className="nav-count">
                  {reviews.filter((r) => r.status === "Pending").length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="side-section">
          <span className="workspace-label">DISTRICT OVERVIEW</span>
          <div className="district-icon">
            <Building2 size={24} />
            <div>
              East Bengaluru<small>Synthetic urban district</small>
            </div>
          </div>
          <div className="side-stat">
            <span>Mapped parcels</span>
            <strong>{data.parcels.length}</strong>
          </div>
          <div className="side-stat">
            <span>Spatial units · {year}</span>
            <strong>{count.toLocaleString()}</strong>
          </div>
          <div className="side-stat">
            <span>Land coverage</span>
            <strong>
              {(data.parcels.reduce((n, p) => n + p.area, 0) / 10000).toFixed(
                2,
              )}{" "}
              ha
            </strong>
          </div>
        </div>
        <div className="side-bottom">
          <div className="help-card">
            <span className="little-orbit">4D</span>
            <h3>A city with a memory.</h3>
            <p>Explore how property identity survives change.</p>
            <button onClick={() => setModal("guide")}>
              Take the demo tour <ArrowRight size={15} />
            </button>
          </div>
          <button
            className="user-button"
            onClick={() => {
              if (token) {
                setToken("");
                setNotice("Signed out.");
              } else {
                setError("");
                setModal("login");
              }
            }}
          >
            <span className="avatar">{token ? "OF" : "GV"}</span>
            <span>
              {token ? "Demo officer" : "Guest viewer"}
              <small>{token ? "Sign out" : "Read-only access"}</small>
            </span>
            <LockKeyhole size={15} />
          </button>
        </div>
      </aside>
      <div className="main-shell" inert={!!modal}>
        <header className="header">
          <div className="breadcrumb">
            Workspace <ChevronRight size={13} /> <strong>{page}</strong>
          </div>
          <div className="header-right">
            <span className="demo-badge">
              <i />
              Synthetic demo
            </span>
            <button className="text-button" onClick={() => setModal("guide")}>
              Quick guide <CircleAlert size={15} />
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">SPATIAL INTELLIGENCE / BENGALURU</div>
              <h1>
                {page === "City explorer" ? "One city. Every dimension." : page}
              </h1>
              <p>
                {page === "City explorer"
                  ? "Explore land parcels, vertical spaces and the stories connecting them."
                  : page === "Parcel registry"
                    ? "A connected register of land and the spaces above it."
                    : page === "Review queue"
                      ? "Track field observations and administrative follow-up."
                      : "Verify the chain of changes recorded in this workspace."}
              </p>
            </div>
            <a className="button export" href={"/api/city/export?year=" + year}>
              <ArrowDownToLine size={16} />
              Export city
            </a>
          </div>
          <div className="summary-strip">
            <div>
              <span className="stat-icon">
                <Map size={19} />
              </span>
              <span>
                <small>2D LAND PARCELS</small>
                <strong>
                  {data.parcels.length}
                  <em>linked identities</em>
                </strong>
              </span>
            </div>
            <div>
              <span className="stat-icon blue">
                <Box size={19} />
              </span>
              <span>
                <small>3D SPATIAL UNITS</small>
                <strong>
                  {count.toLocaleString()}
                  <em>at {year}</em>
                </strong>
              </span>
            </div>
            <div>
              <span className="stat-icon amber">
                <ClipboardCheck size={19} />
              </span>
              <span>
                <small>OPEN REVIEWS</small>
                <strong>
                  {reviews.filter((r) => r.status === "Pending").length}
                  <em>awaiting action</em>
                </strong>
              </span>
            </div>
            <div>
              <span className="stat-icon">
                <ShieldCheck size={19} />
              </span>
              <span>
                <small>AUDIT CHAIN</small>
                <strong className="verified">
                  {audit?.integrity.valid ? "Verified" : "Check needed"}
                  <em>{audit?.integrity.events ?? 0} events</em>
                </strong>
              </span>
            </div>
          </div>
          {(page === "City explorer" || page === "Parcel registry") && (
            <div className="explorer-toolbar">
              <label className="search-field">
                <Search size={17} />
                <input
                  aria-label="Search parcels"
                  placeholder="Search parcel, ULPIN, building or spatial ID…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    aria-label="Clear search"
                    onClick={() => setQuery("")}
                  >
                    <X size={14} />
                  </button>
                )}
              </label>
              <select
                aria-label="Land use filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value as LandUse | "All")}
              >
                <option>All</option>
                {uses.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
              <span className="result-count">{parcels.length} parcels</span>
              {page === "City explorer" && (
                <div className="segmented">
                  {(["2D", "3D", "Split"] as const).map((m) => (
                    <button
                      key={m}
                      aria-pressed={mode === m}
                      className={mode === m ? "active" : ""}
                      onClick={() => setMode(m)}
                    >
                      {m === "2D" ? (
                        <Map size={14} />
                      ) : m === "3D" ? (
                        <Box size={14} />
                      ) : (
                        <LayoutGrid size={14} />
                      )}{" "}
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {page === "City explorer" && (
            <div className="explorer-grid">
              <section className="map-card">
                <div className="map-heading">
                  <span>
                    <i />
                    EAST BENGALURU <small>Virtual district · {year}</small>
                  </span>
                  <button
                    title="Focus selected parcel"
                    aria-label="Focus selected parcel"
                    onClick={() => setFocus((f) => f + 1)}
                  >
                    <Expand size={16} />
                  </button>
                </div>
                <div
                  className={
                    "city-viewport " + (mode === "Split" ? "split-view" : "")
                  }
                >
                  {mode !== "3D" && (
                    <div className="map-pane">
                      <CityMap {...mapProps} />
                      <span className="view-label">
                        2D · Cadastral footprint
                      </span>
                    </div>
                  )}
                  {mode !== "2D" && (
                    <div className="map-pane">
                      <SceneBoundary
                        fallback={
                          <>
                            <CityMap {...mapProps} />
                            <span className="scene-fallback">
                              3D unavailable on this device · showing 2D
                            </span>
                          </>
                        }
                      >
                        <Suspense
                          fallback={
                            <div className="scene-loading">
                              Preparing the virtual city…
                            </div>
                          }
                        >
                          <CityScene
                            {...mapProps}
                            focus={focus}
                            floor={floor}
                            selectedUnit={unit?.id ?? null}
                            onUnit={setUnit}
                          />
                        </Suspense>
                      </SceneBoundary>
                      <span className="view-label">3D · Volumetric city</span>
                    </div>
                  )}
                  <div className="map-compass">
                    <Compass size={23} />
                    <span>N</span>
                  </div>
                  <div className="map-layers">
                    <label>
                      <input
                        type="checkbox"
                        checked={boundaries}
                        onChange={(e) => setBoundaries(e.target.checked)}
                      />
                      Parcel boundaries
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={buildings}
                        onChange={(e) => setBuildings(e.target.checked)}
                      />
                      Buildings
                    </label>
                  </div>
                  <div className="map-caption">
                    <span>LOCAL GRID · METRES</span>
                    <span>6 × 6 BLOCK GRID</span>
                  </div>
                </div>
                <div className="map-legend">
                  {uses.map((u) => (
                    <button
                      key={u}
                      onClick={() => setFilter(filter === u ? "All" : u)}
                    >
                      <i style={{ background: useColors[u] }} />
                      {u}
                    </button>
                  ))}
                  <span>Drag to orbit · scroll to zoom</span>
                </div>
                <div className="time-machine">
                  <div className="time-title">
                    <span>
                      <Layers3 size={17} />
                      Property time machine
                    </span>
                    <small>Identity persists. Structures evolve.</small>
                    <button
                      onClick={() => {
                        select("P-9471");
                        setPlaying(!playing);
                      }}
                      aria-label={playing ? "Pause timeline" : "Play timeline"}
                    >
                      {playing ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                  </div>
                  <div className="time-stops">
                    {data.years.map((y, i) => (
                      <button
                        key={y}
                        aria-label={`${y} ${["Occupied", "Damage assessed", "Vacant site", "Redeveloped"][i]}`}
                        aria-pressed={year === y}
                        className={year === y ? "active" : ""}
                        onClick={() => {
                          setPlaying(false);
                          setYear(y);
                        }}
                      >
                        <span className="time-dot" />
                        <strong>{y}</strong>
                        <small>
                          {
                            [
                              "Occupied",
                              "Damage assessed",
                              "Vacant site",
                              "Redeveloped",
                            ][i]
                          }
                        </small>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
              <aside className="property-card">
                <div className="property-header">
                  <span className="eyebrow">SELECTED PARCEL</span>
                  <span className={"status " + v.status.toLowerCase()}>
                    {v.status}
                  </span>
                </div>
                <h2>{p.name}</h2>
                <p className="address">
                  <MapPin size={13} />
                  {p.ward} · Bengaluru
                </p>
                <div className="identity-box">
                  <span>
                    2D PARCEL ANCHOR <small>DEMO ID</small>
                  </span>
                  <strong>{p.ulpin}</strong>
                  <div>
                    <i />
                    Linked to {v.units.length} 3D spatial units
                  </div>
                </div>
                <div className="property-facts">
                  <div>
                    <small>Parcel area</small>
                    <strong>
                      {p.area.toLocaleString()} <em>m²</em>
                    </strong>
                  </div>
                  <div>
                    <small>Land use</small>
                    <strong>
                      {v.status === "Redeveloped" ? "Commercial" : p.use}
                    </strong>
                  </div>
                  <div>
                    <small>Structure</small>
                    <strong>{v.structureId || "No structure"}</strong>
                  </div>
                  <div>
                    <small>Building height</small>
                    <strong>
                      {(v.floors * 3.2).toFixed(1)} <em>m</em>
                    </strong>
                  </div>
                </div>
                <div className="floor-heading">
                  <h3>Explore vertical spaces</h3>
                  <span>{v.floors} floors</span>
                </div>
                <label className="floor-select">
                  Floor{" "}
                  <select
                    aria-label="Select floor"
                    value={floor}
                    onChange={(e) => {
                      setFloor(Number(e.target.value));
                      setUnit(null);
                    }}
                  >
                    <option value={0}>All floors</option>
                    {Array.from({ length: v.floors }, (_, i) => (
                      <option key={i} value={i + 1}>
                        Floor {i + 1} · {(i * 3.2).toFixed(1)}–
                        {((i + 1) * 3.2).toFixed(1)} m
                      </option>
                    ))}
                  </select>
                </label>
                {v.units.length ? (
                  <div className="unit-grid">
                    {v.units
                      .filter((u) => u.floor === (floor || 1))
                      .map((u) => (
                        <button
                          key={u.id}
                          className={unit?.id === u.id ? "selected" : ""}
                          onClick={() => {
                            setUnit(u);
                            setFloor(u.floor);
                          }}
                        >
                          <Box size={17} />
                          <strong>
                            Unit {u.floor}
                            {String(u.number).padStart(2, "0")}
                          </strong>
                          <small>{u.area} m²</small>
                          {u.review && <i />}
                        </button>
                      ))}
                  </div>
                ) : (
                  <p className="empty-inline">
                    No building volumes in this snapshot. The land parcel
                    remains in the register.
                  </p>
                )}
                {unit && (
                  <div className="unit-detail">
                    <div>
                      <strong>
                        Unit {unit.floor}
                        {String(unit.number).padStart(2, "0")}
                      </strong>
                      <button
                        aria-label="Close unit"
                        onClick={() => setUnit(null)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <code>{unit.id}</code>
                    <p>
                      {unit.holder} · {unit.right}
                      <br />
                      {unit.volume.toFixed(1)} m³ ·{" "}
                      {unit.review
                        ? "Rights mapping under review"
                        : "Synthetic registered relationship"}
                    </p>
                  </div>
                )}
                <div className="continuity">
                  <ShieldCheck size={19} />
                  <div>
                    <strong>Rights continuity preserved</strong>
                    <p>
                      {p.versions[0].units.length} original relationships
                      retained across {p.versions.length} snapshots.
                    </p>
                  </div>
                </div>
                <button className="primary" onClick={validate}>
                  <FileCheck2 size={16} />
                  Validate parcel
                  <ArrowRight size={16} />
                </button>
                <button
                  className="secondary"
                  onClick={() => {
                    setError("");
                    setModal(token ? "review" : "login");
                  }}
                >
                  <ClipboardCheck size={15} />
                  Raise a review
                </button>
              </aside>
              <div className="parcel-strip">
                <div>
                  <span className="eyebrow">DISTRICT PARCELS</span>
                  <small>Select a site to inspect its record</small>
                </div>
                <div className="parcel-chips">
                  {parcels.map((item) => (
                    <button
                      className={selected === item.id ? "active" : ""}
                      key={item.id}
                      onClick={() => select(item.id)}
                    >
                      <i style={{ background: useColors[item.use] }} />
                      {item.id}
                    </button>
                  ))}
                  {!parcels.length && (
                    <p>
                      No matching parcels. Try another identifier or clear the
                      filter.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          {page === "Parcel registry" && (
            <section className="table-card">
              <div className="table-title">
                <h2>Land & spatial property register</h2>
                <span>{year} snapshot</span>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Property / parcel</th>
                      <th>2D parcel anchor</th>
                      <th>Land use</th>
                      <th>3D units</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {parcels.map((item) => {
                      const snapshot = atYear(item, year);
                      return (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.name}</strong>
                            <small>
                              {item.id} · {item.ward}
                            </small>
                          </td>
                          <td>
                            <code>{item.ulpin}</code>
                          </td>
                          <td>{item.use}</td>
                          <td>{snapshot.units.length}</td>
                          <td>
                            <span className="status">{snapshot.status}</span>
                          </td>
                          <td>
                            <button
                              className="text-button"
                              onClick={() => {
                                select(item.id);
                                setPage("City explorer");
                              }}
                            >
                              Inspect <ArrowRight size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!parcels.length && (
                <p className="empty-inline">No matching records.</p>
              )}
            </section>
          )}
          {page === "Review queue" && (
            <section className="table-card">
              <div className="table-title">
                <h2>Administrative reviews</h2>
                <button
                  className="button"
                  onClick={() => {
                    setError("");
                    setModal(token ? "review" : "login");
                  }}
                >
                  New review
                </button>
              </div>
              {reviews.length ? (
                reviews.map((r) => (
                  <article className="review-row" key={r.id}>
                    <span className="review-icon">
                      <ClipboardCheck />
                    </span>
                    <div>
                      <strong>
                        {r.parcelId} <span className="status">{r.status}</span>
                      </strong>
                      <p>{r.note}</p>
                      <small>
                        {new Date(r.createdAt).toLocaleString()} ·{" "}
                        {r.id.slice(0, 8)}
                      </small>
                    </div>
                    {r.status === "Pending" && (
                      <button
                        disabled={busy}
                        className="button"
                        onClick={() =>
                          token ? resolveReview(r.id) : setModal("login")
                        }
                      >
                        {token ? "Resolve review" : "Officer sign-in"}
                      </button>
                    )}
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  <ClipboardCheck size={38} />
                  <h3>Your review queue is clear</h3>
                  <p>
                    Open a parcel and raise an observation to begin a tracked
                    review.
                  </p>
                  <button
                    className="button"
                    onClick={() => setPage("City explorer")}
                  >
                    Explore parcels
                  </button>
                </div>
              )}
            </section>
          )}
          {page === "Audit trail" && (
            <section className="table-card">
              <div className="table-title">
                <h2>Registry change history</h2>
                <span className="status">
                  <ShieldCheck size={14} />
                  {audit?.integrity.valid
                    ? "Hash chain verified"
                    : "Integrity check failed"}
                </span>
              </div>
              <p className="audit-intro">
                Each review action commits with its audit event in one
                transaction. Hashes link each event to the previous record.
              </p>
              {audit?.events
                .slice()
                .reverse()
                .map((e) => (
                  <article className="audit-row" key={e.sequence}>
                    <span className="sequence">
                      {String(e.sequence).padStart(2, "0")}
                    </span>
                    <div>
                      <strong>{e.action.replaceAll("_", " ")}</strong>
                      <small>{new Date(e.createdAt).toLocaleString()}</small>
                      <code>{e.hash}</code>
                      <details>
                        <summary>Inspect event payload</summary>
                        <pre>
                          {JSON.stringify(JSON.parse(e.payload), null, 2)}
                        </pre>
                      </details>
                    </div>
                    <Check size={17} />
                  </article>
                ))}
            </section>
          )}
          <footer>
            <span>
              <i />
              All district records are synthetic · proposed 3D identity
              extension
            </span>
            <span>
              BhuDrishti 4D <b> / </b> Beta workspace 02
            </span>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <Check size={18} />
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="dialog-close"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <X size={19} />
            </button>
            <span className="eyebrow">BHUDRISHTI WORKSPACE</span>
            <h2 id="dialog-title">
              {modal === "validation"
                ? "Parcel validation"
                : modal === "login"
                  ? "Officer access"
                  : modal === "review"
                    ? "Raise a parcel review"
                    : "Explore a city through time"}
            </h2>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {modal === "validation" &&
              (busy ? (
                <p className="empty-inline">
                  Checking spatial volumes and relationships…
                </p>
              ) : (
                validation && (
                  <>
                    <div className="validation-score">
                      <strong>
                        {validation.score}
                        <small>%</small>
                      </strong>
                      <span>
                        checks passed
                        <br />
                        <small>
                          {validation.parcelId} · {validation.year}
                        </small>
                      </span>
                    </div>
                    {validation.checks.map((c) => (
                      <div className="check-row" key={c.id}>
                        {c.status === "pass" ? (
                          <Check className="pass" />
                        ) : (
                          <CircleAlert className="review" />
                        )}
                        <div>
                          <strong>{c.label}</strong>
                          <p>{c.detail}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )
              ))}
            {modal === "login" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
              >
                <p>
                  Enter the officer credential configured by the deployment
                  administrator. Guest access is read-only.
                </p>
                <label>
                  Officer access token
                  <input
                    type="password"
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </label>
                <button className="primary" disabled={busy || !credential}>
                  {busy ? "Verifying…" : "Enable officer access"}
                </button>
              </form>
            )}
            {modal === "review" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
              >
                <p>
                  Attach an observation to {p.id} · {p.name}. Resolving a review
                  does not alter legal rights.
                </p>
                <label>
                  Observation
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    minLength={10}
                    maxLength={2000}
                    required
                    placeholder="Describe the boundary, geometry or rights record that requires review…"
                  />
                </label>
                <button className="primary" disabled={busy}>
                  {busy ? "Saving…" : "Submit review"}
                </button>
              </form>
            )}
            {modal === "guide" && (
              <>
                <p>
                  Follow Aranya Heights from an occupied tower to a new
                  development, while its land identity and historical rights
                  remain accessible.
                </p>
                <ol className="guide-steps">
                  <li>
                    <strong>Start with the land</strong>
                    <span>Switch to 2D or Split and select a parcel.</span>
                  </li>
                  <li>
                    <strong>Inspect a vertical property</strong>
                    <span>
                      Select a floor and unit to see the proposed 3D identifier.
                    </span>
                  </li>
                  <li>
                    <strong>Move through time</strong>
                    <span>Compare 2026, 2028, 2029 and 2031 on P-9471.</span>
                  </li>
                  <li>
                    <strong>Verify and review</strong>
                    <span>
                      Validate the replacement structure; inspect the unresolved
                      relationships.
                    </span>
                  </li>
                </ol>
                <button
                  className="primary"
                  onClick={() => {
                    setModal(null);
                    setPage("City explorer");
                    select("P-9471");
                    setYear(2026);
                    setMode("Split");
                  }}
                >
                  Start guided exploration <ArrowRight size={16} />
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
