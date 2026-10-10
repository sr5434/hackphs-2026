import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { X } from "lucide-react";
import { bounds, dateLabel } from "../lib/forest";

export default function PatchComparison({ feature, imagery, onClose }) {
  const beforeContainer = useRef(null);
  const afterContainer = useRef(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const periods = [
      feature.properties.baseline_period,
      feature.properties.comparison_period,
    ];
    const maps = [];
    let synchronizing = false;
    const initialBounds = bounds([feature]);
    const center = initialBounds.getCenter();
    const paddedBounds = new maplibregl.LngLatBounds(
      [
        Math.min(initialBounds.getWest(), center.lng - 0.002),
        Math.min(initialBounds.getSouth(), center.lat - 0.002),
      ],
      [
        Math.max(initialBounds.getEast(), center.lng + 0.002),
        Math.max(initialBounds.getNorth(), center.lat + 0.002),
      ],
    );
    periods.forEach((period, index) => {
      const raster = imagery[period];
      const map = new maplibregl.Map({
        container: index ? afterContainer.current : beforeContainer.current,
        bounds: paddedBounds,
        fitBoundsOptions: { padding: 35, maxZoom: 16 },
        style: {
          version: 8,
          sources: {
            photo: {
              type: "image",
              url: raster.url,
              coordinates: raster.coordinates,
            },
            patch: { type: "geojson", data: feature },
          },
          layers: [
            {
              id: "background",
              type: "background",
              paint: { "background-color": "#e5e7eb" },
            },
            {
              id: "photo",
              type: "raster",
              source: "photo",
              paint: { "raster-fade-duration": 0 },
            },
            {
              id: "outline",
              type: "line",
              source: "patch",
              paint: { "line-color": "#ffb96f", "line-width": 2 },
            },
          ],
        },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
      map.on("error", () =>
        setError("An image could not load. Close this view and try again."),
      );
      maps.push(map);
      map.on("move", () => {
        if (synchronizing || maps.length !== 2) return;
        synchronizing = true;
        maps[1 - index].jumpTo({
          center: map.getCenter(),
          zoom: map.getZoom(),
          bearing: map.getBearing(),
          pitch: map.getPitch(),
        });
        synchronizing = false;
      });
    });
    const escape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", escape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      maps.forEach((map) => map.remove());
      document.removeEventListener("keydown", escape);
      document.body.style.overflow = previousOverflow;
    };
  }, [feature, imagery]);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const closeButton = document.getElementById("close-comparison");
    closeButton?.focus();
    return () => previousFocus?.focus();
  }, []);
  return (
    <div className="comparison-backdrop" onClick={onClose}>
      <section
        className="image-comparison"
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-comparison-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const focusable = [
            ...event.currentTarget.querySelectorAll(
              'button, [tabindex="0"], a[href]',
            ),
          ];
          const first = focusable[0],
            last = focusable.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className="image-comparison-heading">
          <div>
            <h2 id="image-comparison-title">
              Patch {String(feature.properties.patch_number).padStart(2, "0")} |
              Before & after
            </h2>
            <p>Pan or zoom either image to explore the same location.</p>
          </div>
          <button
            id="close-comparison"
            className="icon-button"
            aria-label="Close before and after"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="image-pair">
          <div>
            <div className="image-period">
              <strong>Before</strong>
              <span>{dateLabel(feature.properties.baseline_period)}</span>
            </div>
            <div
              ref={beforeContainer}
              className="comparison-map"
              aria-label="Before satellite image"
            />
          </div>
          <div>
            <div className="image-period">
              <strong>After</strong>
              <span>{dateLabel(feature.properties.comparison_period)}</span>
            </div>
            <div
              ref={afterContainer}
              className="comparison-map"
              aria-label="After satellite image"
            />
          </div>
        </div>
        <p className="image-caption">
          <span />
          Orange outlines the detected patch.{/* Orange outlines the detected patch. Sentinel-2 | 10 m monthly
          composites. Gray areas have no valid imagery. */}
        </p>
      </section>
    </div>
  );
}
