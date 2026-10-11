import React, { useId, useState } from "react";
import { Download } from "lucide-react";
import { reviewStatuses } from "../lib/reviews";
import { exportPatchReport } from "../lib/patch-report";

export default function PatchReview({ feature, imagery, review, onReview, storageError }) {
  const id = useId();
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const status = review?.status || "unreviewed";
  const notes = review?.notes || "";
  async function exportReport() {
    setExporting(true);
    setMessage("");
    try {
      const missing = await exportPatchReport(feature, imagery, review);
      setMessage(missing
        ? "Report downloaded with unavailable imagery labeled. Open it to print or save as PDF."
        : "Report downloaded. Open it to print or save as PDF.");
    } catch {
      setMessage("Report could not be exported. Please try again.");
    } finally {
      setExporting(false);
    }
  }
  return (
    <section className="patch-review" aria-label="Patch review">
      <label htmlFor={`${id}-status`}>Review status</label>
      <select id={`${id}-status`} value={status}
        onChange={(event) => onReview(feature, { status: event.target.value, notes })}>
        {Object.entries(reviewStatuses).map(([value, label]) =>
          <option key={value} value={value}>{label}</option>)}
      </select>
      <label htmlFor={`${id}-notes`}>Review notes</label>
      <textarea id={`${id}-notes`} rows={2} maxLength={2000}
        placeholder="What changed? What needs checking?"
        value={notes} onChange={(event) => onReview(feature, { status, notes: event.target.value })} />
      <p className="review-help">Visual assessment of candidate tree loss; not confirmation of deforestation.</p>
      <p className="review-save" role="status">{storageError || (review ? "Saved in this browser" : "Reviews are saved in this browser")}</p>
      <button className="export-report" disabled={exporting} onClick={exportReport}>
        <Download size={16} /> {exporting ? "Preparing report…" : "Export patch report"}
      </button>
      {message && <p className="review-help" role="status">{message}</p>}
    </section>
  );
}
