import React, { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { parseReviewBackup, serializeReviews } from "../lib/reviews";

export default function ReviewTransfer({ reviews, onImport }) {
  const input = useRef(null);
  const [message, setMessage] = useState("");
  const [importing, setImporting] = useState(false);
  const count = Object.keys(reviews).length;
  function exportReviews() {
    const url = URL.createObjectURL(new Blob([serializeReviews(reviews)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `forestlens-reviews-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(`Exported ${count} saved reviews, including notes and statuses.`);
  }
  async function importReviews(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error("Choose a backup smaller than 25 MB.");
      const imported = parseReviewBackup(await file.text());
      onImport(imported);
      setMessage(`Imported backup with ${Object.keys(imported).length} reviews. Existing reviews are merged; the newer edit is kept for each patch.`);
    } catch (error) {
      setMessage(error instanceof SyntaxError ? "This file is not a valid reviews backup. No reviews were imported." : error.message);
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }
  return (
    <div className="review-transfer">
      <div className="review-transfer-actions">
        <button disabled={!count} onClick={exportReviews}><Download size={15} /> Export all reviews</button>
        <button disabled={importing} onClick={() => input.current?.click()}><Upload size={15} /> {importing ? "Importing…" : "Import reviews"}</button>
        <input ref={input} type="file" accept=".json,application/json" aria-label="Reviews backup file" hidden onChange={importReviews} />
      </div>
      <p>Transfer notes and statuses between browsers using a JSON backup.</p>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
