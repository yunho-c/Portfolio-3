import { readdir } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { resolve } from 'node:path';
import type { HeroGridCellImages } from '$lib/hero-grid';

const COLLAGE_DIRECTORY = resolve(process.cwd(), 'static', 'collage');
const SUPPORTED_IMAGE = /^([A-L])([1-6])\.(avif|jpe?g|png|webp)$/i;
const GRID_FILENAME = /^([A-L])([1-6])\./i;

export async function loadHeroCollageImages(): Promise<HeroGridCellImages> {
	let entries: Dirent[];

	try {
		entries = await readdir(COLLAGE_DIRECTORY, { withFileTypes: true });
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
		throw error;
	}

	const images: HeroGridCellImages = {};

	for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
		if (!entry.isFile()) continue;

		const match = entry.name.match(SUPPORTED_IMAGE);
		if (!match) {
			if (GRID_FILENAME.test(entry.name)) {
				console.warn(
					`Skipping unsupported hero collage image "${entry.name}". Use AVIF, JPG, JPEG, PNG, or WebP.`
				);
			}
			continue;
		}

		const column = match[1].toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
		const row = Number(match[2]) - 1;
		const id = `${row}:${column}` as const;

		if (images[id]) {
			console.warn(`Ignoring duplicate hero collage cell ${match[1].toUpperCase()}${match[2]}: "${entry.name}".`);
			continue;
		}

		images[id] = `/collage/${encodeURIComponent(entry.name)}`;
	}

	return images;
}
