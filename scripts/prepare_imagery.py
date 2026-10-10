"""Convert Earth Engine RGB exports to aligned browser images."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / '.tools/python'))
import json
import zipfile
import numpy as np
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling, transform_bounds
from PIL import Image

root = Path(__file__).resolve().parents[1]
output = root / 'public/imagery'
output.mkdir(parents=True, exist_ok=True)
manifest = {}
with zipfile.ZipFile(sys.argv[1]) as archive:
    for entry in archive.infolist():
        if not entry.filename.endswith('.tif'):
            continue
        with rasterio.MemoryFile(archive.read(entry)) as memory, memory.open() as source:
            if source.count != 3 or source.crs is None:
                raise ValueError(f'Expected georeferenced RGB: {entry.filename}')
            projection, width, height = calculate_default_transform(source.crs, 'EPSG:3857', source.width, source.height, *source.bounds)
            rgb = np.zeros((3, height, width), dtype=np.uint8)
            for band in range(3):
                reproject(source=rasterio.band(source, band + 1), destination=rgb[band], src_transform=source.transform, src_crs=source.crs, src_nodata=source.nodata, dst_transform=projection, dst_crs='EPSG:3857', dst_nodata=0, resampling=Resampling.nearest)
            mask = np.zeros((height, width), dtype=np.uint8)
            reproject(source=source.dataset_mask(), destination=mask, src_transform=source.transform, src_crs=source.crs, dst_transform=projection, dst_crs='EPSG:3857', resampling=Resampling.nearest)
            image = np.dstack([rgb.transpose(1, 2, 0), mask])
            period = Path(entry.filename).stem.replace('forest_rgb_', '')
            Image.fromarray(image).save(output / f'{period}.png', optimize=True)
            west, south, east, north = transform_bounds('EPSG:3857', 'EPSG:4326', projection.c, projection.f + projection.e * height, projection.c + projection.a * width, projection.f)
            manifest[period] = {'url': f'/imagery/{period}.png', 'coordinates': [[west, north], [east, north], [east, south], [west, south]], 'width': width, 'height': height, 'validPercent': round(float(np.count_nonzero(mask)) / mask.size * 100, 1)}
            print(period, source.crs, source.nodata, width, height, manifest[period]['validPercent'])
(output / 'manifest.json').write_text(json.dumps(manifest, indent=2))
