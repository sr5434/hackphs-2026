# Forest Monitor

A React and MapLibre app for exploring deforestation near Porto Velho, Brazil, in the Amazon Rainforest. Made by Samir Rangwalla, Gary Goodson, Jaideep Mandava, Dravya Pandya.

## Features

- Satellite and street basemaps
- Patches for each detected deforested area
- Before vs after view to see the scale of deforestation
- Measurements for how large each patch is (in hectares)

The dataset and eight monthly RGB images are bundled with the site. External basemap tiles and the font require network access. The main satellite basemap is context imagery. The before/after viewer uses the exported Sentinel-2 monthly RGB composites for the selected dates, reprojected from EPSG:32720 to Web Mercator with nodata preserved as transparency. Confidence scores are not supplied. Area is taken from `area_hectares` where available, otherwise calculated from geometry.

To regenerate the browser images, install Rasterio into `.tools/python` and run `scripts/prepare_imagery.py` with the path to the Earth Engine export ZIP. This produces PNGs and a geographic manifest in `public/imagery` without changing the original exports.

This project used the Dynamic World dataset, so we'd like to thank Google, National Geographic Society, World Resources Institute and Copernicus Sentinel data. Basemap attribution appears on the map.

