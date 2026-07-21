import { describe, expect, it } from 'vitest';
import { createHeroGridCells } from './hero-grid';

const image = (src: string) => ({ kind: 'image' as const, src });

describe('createHeroGridCells', () => {
	it('fills empty cells from their resolved left neighbor', () => {
		const cells = createHeroGridCells({
			cellMedia: {
				'0:0': image('/collage/A1.jpg'),
				'0:2': image('/collage/C1.jpg')
			}
		});

		expect(cells[0][0].media).toEqual(image('/collage/A1.jpg'));
		expect(cells[0][1].media).toEqual(image('/collage/A1.jpg'));
		expect(cells[0][2].media).toEqual(image('/collage/C1.jpg'));
		expect(cells[0][3].media).toEqual(image('/collage/C1.jpg'));
	});

	it('fills the first cell in a row from the cell above', () => {
		const cells = createHeroGridCells({
			cellMedia: { '0:0': image('/collage/A1.jpg') }
		});

		expect(cells[1][0].media).toEqual(image('/collage/A1.jpg'));
		expect(cells[1][1].media).toEqual(image('/collage/A1.jpg'));
	});

	it('inherits video media without losing its poster', () => {
		const video = {
			kind: 'video' as const,
			src: 'https://media.example.com/hero/A4.mp4',
			poster: 'https://media.example.com/hero/A4.jpg'
		};
		const cells = createHeroGridCells({ cellMedia: { '3:0': video } });

		expect(cells[3][0].media).toEqual(video);
		expect(cells[3][1].media).toEqual(video);
	});

	it('leaves cells blank when neither neighbor has content', () => {
		const cells = createHeroGridCells({ cellMedia: {} });

		expect(cells[0][0].media).toBeNull();
		expect(cells[5][11].media).toBeNull();
	});
});
