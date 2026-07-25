import JSZip from 'jszip';

const DB_NAME = 'PlacesAppOfflineTiles';
const DB_VERSION = 1;
const STORE_NAME = 'tiles';

export interface UnpackProgress {
	total: number;
	current: number;
	percent: number;
}

/**
 * Initializing/opening IndexedDB for tiles
 */
const openTileDb = (): Promise<IDBDatabase> => {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				// Use the string 'z_x_y' as the key (e.g., '14_9341_5120')
				db.createObjectStore(STORE_NAME);
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
};

/**
 * Get a tile Blob from IndexedDB based on coordinates
 */
export const getOfflineTile = async (
	z: number,
	x: number,
	y: number,
): Promise<Blob | null> => {
	try {
		const db = await openTileDb();
		const key = `${z}_${x}_${y}`;

		return new Promise((resolve) => {
			const tx = db.transaction(STORE_NAME, 'readonly');
			const store = tx.objectStore(STORE_NAME);
			const request = store.get(key);

			request.onsuccess = () => {
				const result = request.result;
				if (result instanceof Blob) {
					resolve(result);
				} else if (result instanceof ArrayBuffer) {
					resolve(new Blob([result], { type: 'image/png' }));
				} else {
					resolve(null);
				}
			};

			request.onerror = () => resolve(null);
		});
	} catch (error) {
		console.error('Failed to read tile from IndexedDB:', error);
		return null;
	}
};

/**
 * Unpacking a ZIP archive containing tiles into IndexedDB
 * Supported paths within the ZIP: 'z/x/y.png', 'z/x/y.jpg', 'z/x/y'
 * @param zipFile - ZIP file from <input type='file'>
 * @param onProgress - callback to update the progress bar in the UI
 */
export const unpackTilesZip = async (
	zipFile: File,
	onProgress?: (progress: UnpackProgress) => void,
): Promise<{ count: number }> => {
	const zip = new JSZip();
	const contents = await zip.loadAsync(zipFile);

	// Filter for map files only (ignoring folders and system files like .DS_Store)
	const tileEntries: { key: string; entry: JSZip.JSZipObject }[] = [];

	contents.forEach((relativePath, entry) => {
		if (entry.dir) return;

		// Normalize the path (it could be '14/9341/5120.png' or 'tiles/14/9341/5120.png')
		const cleanPath = relativePath.replace(
			/^.*?[\\/]?(\d+[\\/]\d+[\\/]\d+)(\.\w+)?$/,
			'$1',
		);
		const parts = cleanPath.split(/[\\/]/);

		if (parts.length === 3) {
			const [z, x, y] = parts.map(Number);
			if (!isNaN(z) && !isNaN(x) && !isNaN(y)) {
				tileEntries.push({
					key: `${z}_${x}_${y}`,
					entry,
				});
			}
		}
	});

	const total = tileEntries.length;
	if (total === 0) {
		throw new Error('В ZIP-архиве не найдено тайлов структуры z/x/y');
	}

	const db = await openTileDb();

	// Batching IndexedDB writes to prevent UI freezing
	const BATCH_SIZE = 100;
	let processed = 0;

	for (let i = 0; i < total; i += BATCH_SIZE) {
		const chunk = tileEntries.slice(i, i + BATCH_SIZE);

		// Read blobs in parallel within a batch
		const loadedChunk = await Promise.all(
			chunk.map(async (item) => {
				const blob = await item.entry.async('blob');
				return { key: item.key, blob };
			}),
		);

		// Write the batch in a single transaction
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readwrite');
			const store = tx.objectStore(STORE_NAME);

			loadedChunk.forEach(({ key, blob }) => {
				store.put(blob, key);
			});

			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});

		processed += chunk.length;
		if (onProgress) {
			onProgress({
				total,
				current: processed,
				percent: Math.round((processed / total) * 100),
			});
		}
	}

	return { count: total };
};

/**
 * Complete clearing of offline tiles (for testing and resetting)
 */
export const clearOfflineTiles = async (): Promise<void> => {
	const db = await openTileDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);
		store.clear();

		tx.oncomplete = () => {
			console.log('🧹 Offline tiles cleared completely!');
			resolve();
		};
		tx.onerror = () => reject(tx.error);
	});
};
