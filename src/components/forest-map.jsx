import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { empty, bounds, basemap } from "../lib/forest";

export default function ForestMap({
  features,
  selected,
  onSelect,
  satellite,
  showPatches,
  fitSignal,
}) {
  const container = useRef(null);
  const instance = useRef(null);
  const latest = useRef({ features, selected, onSelect });
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState("");
  latest.current = { features, selected, onSelect };
  useEffect(() => {
    let map;
    try {
      map = new maplibregl.Map({
        container: container.current,
        style: basemap(satellite),
        center: [-63.9, -8.8],
        zoom: 12,
        maxZoom: 17,
        attributionControl: true,
      });
      instance.current = map;
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "bottom-right",
      );
      map.on("error", () =>
        setMapError(
          "Some map tiles could not load. Check your connection or switch to the street map.",
        ),
      );
      map.on("load", () => {
        map.addSource("patches", { type: "geojson", data: empty });
        map.addLayer({
          id: "patch-fill",
          type: "fill",
          source: "patches",
          paint: { "fill-color": "#f59b42", "fill-opacity": 0.45 },
        });
        map.addLayer({
          id: "patch-line",
          type: "line",
          source: "patches",
          paint: { "line-color": "#ffb96f", "line-width": 1.6 },
        });
        map.addLayer({
          id: "selected",
          type: "line",
          source: "patches",
          filter: ["==", ["id"], -1],
          paint: { "line-color": "#fff2a8", "line-width": 3 },
        });
        map.on("click", "patch-fill", (event) => {
          const id = event.features?.[0]?.id;
          latest.current.onSelect(
            latest.current.features.find((f) => f.id === id) ?? null,
          );
        });
        map.on("mouseenter", "patch-fill", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "patch-fill", () => {
          map.getCanvas().style.cursor = "";
        });
        setReady(true);
      });
    } catch {
      setMapError(
        "The map needs WebGL. Enable hardware acceleration or try another browser.",
      );
    }
    return () => {
      setReady(false);
      map?.remove();
      instance.current = null;
    };
  }, []);
  useEffect(() => {
    const map = instance.current;
    if (!ready || !map) return;
    map.getSource("patches").setData({ type: "FeatureCollection", features });
  }, [ready, features]);
  useEffect(() => {
    if (ready && instance.current && features.length)
      instance.current.fitBounds(bounds(features), {
        padding: 65,
        maxZoom: 15,
        duration: 800,
      });
  }, [ready, fitSignal]);
  useEffect(() => {
    const map = instance.current;
    if (!ready || !map) return;
    map.setFilter("selected", ["==", ["id"], selected?.id ?? -1]);
    if (selected)
      map.fitBounds(bounds([selected]), {
        padding: 100,
        maxZoom: 17,
        duration: 700,
      });
  }, [ready, selected]);
  useEffect(() => {
    const map = instance.current;
    if (!ready || !map) return;
    map.getSource("base").setTiles(basemap(satellite).sources.base.tiles);
    setMapError("");
  }, [ready, satellite]);
  useEffect(() => {
    if (ready)
      ["patch-fill", "patch-line", "selected"].forEach((id) =>
        instance.current.setLayoutProperty(
          id,
          "visibility",
          showPatches ? "visible" : "none",
        ),
      );
  }, [ready, showPatches]);
  return (
    <>
      <div
        ref={container}
        className="map-canvas"
        aria-label="Interactive forest loss map"
      />
      {mapError && (
        <div className="map-error" role="status">
          {mapError}
        </div>
      )}
    </>
  );
}
