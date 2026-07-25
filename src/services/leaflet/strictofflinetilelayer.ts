import L from 'leaflet';
import { getOfflineTile } from '@/services/tilestorage';

const BLANK_TILE =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
;

export class StrictOfflineTileLayer extends L.TileLayer {
	constructor(options?: L.TileLayerOptions) {
		super('', {
			maxZoom: 18,
			maxNativeZoom: 15,
			...options,
		});
	}
	override createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
		const tile = document.createElement('img');

		L.DomEvent.on(tile, 'load', L.Util.bind(done, null, null, tile));
		L.DomEvent.on(tile, 'error', L.Util.bind(done, null, null, tile));

		if (this.options.crossOrigin) tile.crossOrigin = '';
		tile.alt = '';
		tile.setAttribute('role', 'presentation');

		getOfflineTile(coords.z, coords.x, coords.y)
			.then((blob) => {
				if (blob) {
					const tileUrl = URL.createObjectURL(blob);

					tile.onload = () => {
						URL.revokeObjectURL(tileUrl);
					};

					tile.src = tileUrl;
				} else {
					tile.src = BLANK_TILE;
				}
			})
			.catch((err) => {
				console.error(
					`[OfflineMap] Error fetching tile ${coords.z}/${coords.x}/${coords.y}:`,
					err,
				);
				tile.src = BLANK_TILE;
			})
		;
		return tile;
	}
}

export const createStrictOfflineLayer = (options?: L.TileLayerOptions) => {
	return new StrictOfflineTileLayer(options);
};
