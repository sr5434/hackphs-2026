import React, { useEffect, useState } from "react";
import {
  ChevronRight,
  Github,
  Layers,
  Leaf,
  LocateFixed,
  MapPin,
  Search,
  Trees,
  X,
} from "lucide-react";
import ForestMap from "./components/forest-map";
import PatchComparison from "./components/patch-comparison";
import PatchReview from "./components/patch-review";
import ReviewTransfer from "./components/review-transfer";
import { loadReviews, mergeReviews, reviewKey, reviewStatuses, reviewStorageKey } from "./lib/reviews";
import {
  empty,
  format,
  dateLabel,
  comparisonGroups,
  normalize,
} from "./lib/forest";

export default function App() {
  const [data, setData] = useState(empty);
  const [imagery, setImagery] = useState(null);
  const [comparisonFeature, setComparisonFeature] = useState(null);
  const [period, setPeriod] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [minimum, setMinimum] = useState("0");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("largest");
  const [satellite, setSatellite] = useState(true);
  const [showPatches, setShowPatches] = useState(true);
  const [fitSignal, setFitSignal] = useState(0);
  const [reviews, setReviews] = useState(loadReviews);
  const [storageError, setStorageError] = useState("");
  const [reviewFilter, setReviewFilter] = useState("all");

  useEffect(() => {
    try {
      localStorage.setItem(reviewStorageKey, JSON.stringify(reviews));
      setStorageError("");
    } catch {
      setStorageError("Browser storage unavailable. Export your review to keep a copy.");
    }
  }, [reviews]);

  function updateReview(feature, value) {
    setReviews((current) => ({ ...current, [reviewKey(feature)]: {
      ...value, updatedAt: new Date().toISOString(),
    } }));
  }

  useEffect(() => {
    let active = true;
    fetch("/imagery/manifest.json")
      .then((response) => {
        if (!response.ok) throw new Error("Imagery unavailable");
        return response.json();
      })
      .then((value) => {
        if (active) setImagery(value);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/forest-loss.geojson")
      .then((r) => {
        if (!r.ok)
          throw new Error(
            "Could not load the bundled GeoJSON. Please reload the page.",
          );
        return r.json();
      })
      .then(normalize)
      .then((value) => {
        if (active) {
          setData(value);
          setPeriod(comparisonGroups(value.features).at(-1)?.key || "");
          setFitSignal((x) => x + 1);
        }
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);
  const groups = comparisonGroups(data.features);
  const activeGroup = groups.find((group) => group.key === period);
  const all = activeGroup?.features || [];
  const visible = all
    .filter(
      (f) =>
        f.properties.area_hectares >= Number(minimum) &&
        (reviewFilter === "all" || (reviews[reviewKey(f)]?.status || "unreviewed") === reviewFilter) &&
        `patch ${String(f.properties.patch_number).padStart(2, "0")}`.includes(
          query.toLowerCase(),
        ),
    )
    .sort((a, b) =>
      sort === "largest"
        ? b.properties.area_hectares - a.properties.area_hectares
        : a.properties.area_hectares - b.properties.area_hectares,
    );
  const total = all.reduce((sum, f) => sum + f.properties.area_hectares, 0);
  function changePeriod(key) {
    setPeriod(key);
    setSelected(null);
    setQuery("");
    setReviewFilter("all");
    setFitSignal((x) => x + 1);
  }
  function changeMinimum(value) {
    setMinimum(value);
    setSelected(null);
  }
  return (
    <div className="app">
      <header>
        <a className="brand" href="/" aria-label="ForestLens home">
          <span className="brand-icon">
            <Leaf size={21} />
          </span>
          ForestLens
        </a>
        <div className="header-right">
          <a
            className="github-link"
            href="https://github.com/sr5434/hackphs-2026/tree/main"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View our repository on GitHub (opens in a new tab)"
          >
            <Github size={16} aria-hidden="true" />
            GitHub
          </a>
        </div>
      </header>
      <main>
        <div className="page-heading">
          <div>
            <h1>Amazon forest loss</h1>
            <p>Compare detected loss patches and monthly satellite imagery.</p>
          </div>
          <div className="location">
            <MapPin size={17} />
            <div>
              <strong>Porto Velho, Brazil</strong>
              <span>Rondônia | Brazilian Amazon</span>
            </div>
          </div>
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={16} />
            </button>
          </div>
        )}
        {groups.length > 0 && (
          <section className="comparisons" aria-label="Time comparisons">
            <div className="comparison-heading">
              <div>
                <h2>Time comparisons</h2>
              </div>
            </div>
            <div className="comparison-cards">
              {groups.map((group) => (
                <button
                  key={group.key}
                  aria-pressed={period === group.key}
                  className={`comparison-card ${period === group.key ? "selected" : ""}`}
                  onClick={() => changePeriod(group.key)}
                >
                  <span>
                    {dateLabel(group.baseline)} → {dateLabel(group.comparison)}
                  </span>
                  <strong>
                    {format(group.hectares)} <small>ha</small>
                  </strong>
                  <span className="comparison-count">
                    {group.features.length} patches
                    <ChevronRight size={14} />
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
        <section className="stats" aria-label="Dataset summary">
          <div className="stat">
            <div>
              <span className="stat-label">Detected tree loss</span>
              <strong>
                {loading ? "—" : format(total)} <small>hectares</small>
              </strong>
            </div>
          </div>
          <div className="stat">
            <div>
              <span className="stat-label">Loss patches</span>
              <strong>
                {loading ? "—" : all.length}
                <small> patches</small>
              </strong>
            </div>
          </div>
        </section>
        <div className="review-workflow">
          <strong>Manually inspect detected loss</strong>
          <p>Pick a patch, add your own thoughts, and export your assessment to share with others.</p>
          <span>{all.filter((f) => reviews[reviewKey(f)]?.status && reviews[reviewKey(f)].status !== "unreviewed").length} of {all.length} assessed in this comparison</span>
          <ReviewTransfer reviews={reviews} onImport={(incoming) => setReviews((current) => mergeReviews(current, incoming))} />
          {storageError && <p role="alert">{storageError}</p>}
        </div>
        <section className="explorer" aria-label="Forest loss explorer">
          <aside className="sidebar">
            <div className="sidebar-title">
              <h2>Detected patches</h2>
              <span className="count-badge">{visible.length}</span>
            </div>
            <label className="search">
              <Search size={16} />
              <input
                aria-label="Search patches"
                placeholder="Search patches…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelected(null);
                }}
              />
            </label>
            <div className="filters">
              <label>
                Minimum area
                <select
                  value={minimum}
                  onChange={(e) => changeMinimum(e.target.value)}
                >
                  <option value="0">All sizes</option>
                  <option value="0.1">0.1 ha</option>
                  <option value="0.5">0.5 ha</option>
                  <option value="1">1 ha</option>
                </select>
              </label>
              <label>
                Sort by
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="largest">Largest first</option>
                  <option value="smallest">Smallest first</option>
                </select>
              </label>
            </div>
            <label className="review-filter">
              Review status
              <select value={reviewFilter} onChange={(event) => {
                setReviewFilter(event.target.value);
                setSelected(null);
              }}>
                <option value="all">All statuses</option>
                {Object.entries(reviewStatuses).map(([value, label]) =>
                  <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <div className="list-caption">
              PATCH <span>AREA (HA)</span>
            </div>
            <div className="patch-list">
              {loading ? (
                <div className="empty-state">Loading your forest data…</div>
              ) : visible.length ? (
                visible.map((f) => (
                  <button
                    key={f.id}
                    className={`patch-row ${selected?.id === f.id ? "active" : ""}`}
                    onClick={() => setSelected(f)}
                  >
                    <span className="patch-name">
                      <strong>
                        Patch{" "}
                        {String(f.properties.patch_number).padStart(2, "0")}
                      </strong>
                      <span>{reviewStatuses[reviews[reviewKey(f)]?.status || "unreviewed"]}</span>
                    </span>
                    <span className="patch-area">
                      {format(f.properties.area_hectares)}
                      <ChevronRight size={15} />
                    </span>
                  </button>
                ))
              ) : (
                <div className="empty-state">
                  <Trees size={29} />
                  <strong>
                    {all.length
                      ? "No matching patches"
                      : "No patches in this export"}
                  </strong>
                  <p>
                    {all.length
                      ? "Try a smaller minimum area, another review status, or clear your search."
                      : "No detections are available for this comparison."}
                  </p>
                  {all.length > 0 && (
                    <button
                      onClick={() => {
                        setMinimum("0");
                        setQuery("");
                        setReviewFilter("all");
                      }}
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </aside>
          <div className="map-panel">
            <ForestMap
              features={visible}
              selected={selected}
              onSelect={setSelected}
              satellite={satellite}
              showPatches={showPatches}
              fitSignal={fitSignal}
            />
            <div className="map-top">
              {/* <span className="map-chip">
                Porto Velho{" "}
                <span className="chip-divider" />{" "}
                {satellite ? "Satellite" : "Street map"}
              </span> */}
              <button
                className="icon-button"
                title="Fit all visible patches"
                aria-label="Fit all visible patches"
                onClick={() => setFitSignal((x) => x + 1)}
              >
                <LocateFixed size={19} />
              </button>
            </div>
            <div className="map-bottom">
              <div className="layer-controls">
                <button
                  className={satellite ? "chosen" : ""}
                  onClick={() => setSatellite(true)}
                >
                  Satellite
                </button>
                <button
                  className={!satellite ? "chosen" : ""}
                  onClick={() => setSatellite(false)}
                >
                  Map
                </button>
              </div>
              <button
                className={`legend`}
                aria-pressed={showPatches}
                onClick={() => setShowPatches((x) => !x)}
              >
                <span /> {showPatches ? "Hide patches" : "Show patches"}
              </button>
            </div>
            {selected && (
              <div className="details">
                <div className="details-top">
                  <span className="eyebrow">PATCH DETAILS</span>
                  <button
                    aria-label="Close patch details"
                    onClick={() => setSelected(null)}
                  >
                    <X size={18} />
                  </button>
                </div>
                <h2>
                  Patch{" "}
                  {String(selected.properties.patch_number).padStart(2, "0")}
                </h2>
                <div className="detail-area">
                  {format(selected.properties.area_hectares)}{" "}
                  <span>hectares</span>
                </div>
                {imagery?.[selected.properties.baseline_period] &&
                imagery?.[selected.properties.comparison_period] ? (
                  <button
                    className="view-comparison"
                    onClick={() => setComparisonFeature(selected)}
                  >
                    <Layers size={17} /> View before &amp; after
                  </button>
                ) : (
                  <div className="imagery-note">
                    <Layers size={17} />
                    <p>Images for this comparison are unavailable.</p>
                  </div>
                )}
                <PatchReview key={reviewKey(selected)} feature={selected} imagery={imagery}
                  review={reviews[reviewKey(selected)]} onReview={updateReview} storageError={storageError} />
              </div>
            )}
          </div>
        </section>
      </main>
      {comparisonFeature && (
        <PatchComparison
          feature={comparisonFeature}
          imagery={imagery}
          review={reviews[reviewKey(comparisonFeature)]}
          onReview={updateReview}
          storageError={storageError}
          onClose={() => setComparisonFeature(null)}
        />
      )}
    </div>
  );
}
