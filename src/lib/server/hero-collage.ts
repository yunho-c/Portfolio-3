import { readdir } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { resolve } from 'node:path';
import { env } from '$env/dynamic/private';
import type { HeroGridCellMedia, HeroGridMedia } from '$lib/hero-grid';

const COLLAGE_DIRECTORY = resolve(process.cwd(), 'static', 'collage');
const SUPPORTED_IMAGE = /^([A-L])([1-6])\.(avif|jpe?g|png|webp)$/i;
const VIDEO_DECLARATION = /^([A-L])([1-6])\.txt$/i;
const GRID_FILENAME = /^([A-L])([1-6])\./i;

interface LoadHeroCollageMediaOptions {
	directory?: string;
	videoBaseUrl?: string;
}

function cellDetails(match: RegExpMatchArray) {
	const cell = `${match[1].toUpperCase()}${match[2]}`;
	const column = match[1].toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
	const row = Number(match[2]) - 1;
	return { cell, id: `${row}:${column}` as const };
}

function videoMedia(baseUrl: string, cell: string, poster?: string): HeroGridMedia {
	return {
		kind: 'video',
		src: `${baseUrl}/${cell}.mp4`,
		poster: poster ?? `${baseUrl}/${cell}.jpg`
	};
}

export async function loadHeroCollageMedia({
	directory = COLLAGE_DIRECTORY,
	videoBaseUrl = env.HERO_R2_PUBLIC_BASE_URL ?? ''
}: LoadHeroCollageMediaOptions = {}): Promise<HeroGridCellMedia> {
	let entries: Dirent[];

	try {
		entries = await readdir(directory, { withFileTypes: true });
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
		throw error;
	}

	const media: HeroGridCellMedia = {};
	const normalizedVideoBaseUrl = videoBaseUrl.trim().replace(/\/+$/, '');

	for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
		if (!entry.isFile()) continue;

		const imageMatch = entry.name.match(SUPPORTED_IMAGE);
		if (imageMatch) {
			const { cell, id } = cellDetails(imageMatch);
			const src = `/collage/${encodeURIComponent(entry.name)}`;
			const existing = media[id];

			if (existing?.kind === 'image') {
				console.warn(`Ignoring duplicate hero collage cell ${cell}: "${entry.name}".`);
				continue;
			}

			media[id] =
				existing?.kind === 'video' ? { ...existing, poster: src } : { kind: 'image', src };
			continue;
		}

		const videoMatch = entry.name.match(VIDEO_DECLARATION);
		if (videoMatch) {
			const { cell, id } = cellDetails(videoMatch);
			if (!normalizedVideoBaseUrl) {
				console.warn(
					`Skipping hero collage video "${entry.name}" because HERO_R2_PUBLIC_BASE_URL is not configured.`
				);
				continue;
			}

			const existing = media[id];
			if (existing?.kind === 'video') {
				console.warn(`Ignoring duplicate hero collage cell ${cell}: "${entry.name}".`);
				continue;
			}

			media[id] = videoMedia(normalizedVideoBaseUrl, cell, existing?.src);
			continue;
		}

		if (GRID_FILENAME.test(entry.name)) {
			console.warn(
				`Skipping unsupported hero collage media "${entry.name}". Use AVIF, JPG, JPEG, PNG, WebP, or TXT.`
			);
		}
	}

	return media;
}
