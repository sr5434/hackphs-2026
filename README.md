# ForestLens

A React and MapLibre app for exploring deforestation near Porto Velho, Brazil, in the Amazon Rainforest. Made by Samir Rangwalla, Gary Goodson, Jaideep Mandava, Dravya Pandya.

## Features

- Satellite and street basemaps
- Patches for each detected deforested area
- Before vs after view to see the scale of deforestation
- Measurements for how large each patch is (in hectares)
- You can mark a patch as needs investigation, visually supported, or uncertain, add your own notes, and filter patches by status.
- You can export individual patches as standalone HTML, making it easy to share/print things you found.

## Review workflow

Select a candidate patch, open **View before & after**, and record a review status and notes. Reviews save automatically in this browser's local storage. Use **Export all reviews** to download a JSON backup, then **Import reviews** in another browser (or incognito mode if you are testing) to restore all notes and statuses for the same dataset. Imports merge with existing reviews and keep the newer edit for each patch. Use **Export patch report** to keep or share a printable report. Reports embed both imagery crops at the same geographic extent. Missing imagery is labeled rather than replaced with a basemap.

The dataset compares July and August 2025 against 2024, and July and August 2026 against 2025. Six monthly RGB images for those comparisons are bundled with the site. External basemap tiles require network access. The before/after viewer uses the exported Sentinel-2 monthly RGB composites for the selected dates.

To regenerate the browser images, install Rasterio into `.tools/python` and run `scripts/prepare_imagery.py` with the path to the Earth Engine export ZIP. This produces PNGs and a geographic manifest in `public/imagery` without changing the original exports.

This project used the Dynamic World dataset, so we'd like to thank Google, National Geographic Society, World Resources Institute and Copernicus Sentinel data. Basemap attribution appears on the map.
