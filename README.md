# Forest Monitor

A React and MapLibre app for exploring the supplied Dynamic World comparison export. The bundled file contains 411 candidate tree-loss patches across five independent comparisons near Porto Velho, Brazil. The latest comparison is selected initially.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` creates the production site in `dist`.

The CARTO street basemap requires `VITE_CARTO_BASEMAP_KEY` in `.env.local` (see `.env.example`). This local file is excluded from Git. Set the same variable in the deployment build environment. CARTO basemap keys are used in browser tile requests and therefore remain visible to browser users; this is not a server-side secret.

## Style references

The interface follows the shared patterns in [Study Buddy](https://github.com/sr5434/study-buddy), [Trial Buddy](https://github.com/sr5434/Trial-Buddy), and the hackathon template: Geist headings, neutral surfaces, rounded fields, blue gradient actions, and system light/dark themes. The React code uses separate state declarations, named function components, and multiline JSX. `src/App.jsx` contains the page; `src/components` contains the map and before/after viewer; `src/lib/forest.js` contains the dataset helpers.

## Features

- Satellite and street basemaps, selectable loss polygons, fit-to-patches control.
- Linked patch list, minimum-area filters, search, and size sorting.
- Comparison cards and a period selector keep the map, list, and totals scoped to one comparison. Areas are not summed across periods because polygons may overlap.
- Per-comparison totals, patch properties, and baseline/comparison scene counts from the export.
- Select a patch and open “View before & after” for synchronized satellite images with its boundary outlined.
- Bundled GeoJSON validation. Comparisons are grouped by baseline/comparison period.
- Empty, loading, and error states; responsive mobile layout.

The dataset and eight monthly RGB images are bundled with the site. External basemap tiles and the font require network access. The main satellite basemap is context imagery. The before/after viewer uses the exported Sentinel-2 monthly RGB composites for the selected dates, reprojected from EPSG:32720 to Web Mercator with nodata preserved as transparency. Confidence scores are not supplied. Area is taken from `area_hectares` where available, otherwise calculated from geometry.

To regenerate the browser images, install Rasterio into `.tools/python` and run `scripts/prepare_imagery.py` with the path to the Earth Engine export ZIP. This produces PNGs and a geographic manifest in `public/imagery` without changing the original exports.

Data: Dynamic World comparison export; credit Google, National Geographic Society, World Resources Institute and Copernicus Sentinel data. Basemap attribution appears on the map.

