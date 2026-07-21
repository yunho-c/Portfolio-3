import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadHeroCollageMedia } from './hero-collage';

const temporaryDirectories: string[] = [];

async function collageDirectory() {
	const directory = await mkdtemp(join(tmpdir(), 'hero-collage-'));
	temporaryDirectories.push(directory);
	return directory;
}

afterEach(async () => {
	vi.restoreAllMocks();
	await Promise.all(
		temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true }))
	);
});

describe('loadHeroCollageMedia', () => {
	it('loads local images and public video objects by grid coordinate', async () => {
		const directory = await collageDirectory();
		await Promise.all([
			writeFile(join(directory, 'A1.webp'), 'image'),
			writeFile(join(directory, 'A4.txt'), 'https://www.youtube.com/watch?v=example')
		]);

		const media = await loadHeroCollageMedia({
			directory,
			videoBaseUrl: 'https://media.example.com/hero/'
		});

		expect(media['0:0']).toEqual({ kind: 'image', src: '/collage/A1.webp' });
		expect(media['3:0']).toEqual({
			kind: 'video',
			src: 'https://media.example.com/hero/A4.mp4',
			poster: 'https://media.example.com/hero/A4.jpg'
		});
	});

	it('uses a matching local image as the video poster', async () => {
		const directory = await collageDirectory();
		await Promise.all([
			writeFile(join(directory, 'F2.txt'), 'https://www.youtube.com/watch?v=example'),
			writeFile(join(directory, 'F2.jpg'), 'poster')
		]);

		const media = await loadHeroCollageMedia({
			directory,
			videoBaseUrl: 'https://media.example.com/hero'
		});

		expect(media['1:5']).toEqual({
			kind: 'video',
			src: 'https://media.example.com/hero/F2.mp4',
			poster: '/collage/F2.jpg'
		});
	});

	it('skips video declarations when no public base URL is configured', async () => {
		const directory = await collageDirectory();
		await writeFile(join(directory, 'K3.txt'), 'https://www.youtube.com/watch?v=example');
		const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

		const media = await loadHeroCollageMedia({ directory, videoBaseUrl: '  ' });

		expect(media['2:10']).toBeUndefined();
		expect(warning).toHaveBeenCalledWith(
			'Skipping hero collage video "K3.txt" because HERO_R2_PUBLIC_BASE_URL is not configured.'
		);
	});
});
