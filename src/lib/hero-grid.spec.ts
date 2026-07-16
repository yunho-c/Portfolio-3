import { describe, expect, it } from 'vitest';
import { createHeroGridCells } from './hero-grid';

describe('createHeroGridCells', () => {
	it('fills empty cells from their resolved left neighbor', () => {
		const cells = createHeroGridCells({
			cellImages: {
				'0:0': '/collage/A1.jpg',
				'0:2': '/collage/C1.jpg'
			}
		});

		expect(cells[0][0].image).toBe('/collage/A1.jpg');
		expect(cells[0][1].image).toBe('/collage/A1.jpg');
		expect(cells[0][2].image).toBe('/collage/C1.jpg');
		expect(cells[0][3].image).toBe('/collage/C1.jpg');
	});

	it('fills the first cell in a row from the cell above', () => {
		const cells = createHeroGridCells({
			cellImages: { '0:0': '/collage/A1.jpg' }
		});

		expect(cells[1][0].image).toBe('/collage/A1.jpg');
		expect(cells[1][1].image).toBe('/collage/A1.jpg');
	});

	it('leaves cells blank when neither neighbor has content', () => {
		const cells = createHeroGridCells({ cellImages: {} });

		expect(cells[0][0].image).toBe('');
		expect(cells[5][11].image).toBe('');
	});
});
