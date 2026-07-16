export const HERO_GRID_COLUMNS = 12;
export const HERO_GRID_ROWS = 6;

export type HeroGridLeaveBehavior = 'clear' | 'hold';
export type HeroGridBlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';

export interface HeroGridCell {
	id: string;
	row: number;
	column: number;
	label: string;
	image: string;
	backgroundColor: string;
	position: string;
	size: string;
	opacity: number;
	filter: string;
	scale: number;
	blendMode: HeroGridBlendMode;
	dwellMs: number;
	transitionMs: number;
	leaveBehavior: HeroGridLeaveBehavior;
}

export type HeroGridCellOverride = Partial<Omit<HeroGridCell, 'id' | 'row' | 'column'>>;
export type HeroGridCellOverrides = Record<`${number}:${number}`, HeroGridCellOverride>;
export type HeroGridCellImages = Partial<Record<`${number}:${number}`, string>>;

export interface HeroGridOptions {
	cellImages?: HeroGridCellImages;
	overrides?: HeroGridCellOverrides;
}

/**
 * Define one-off content or behavior with a `row:column` key (both are zero-based).
 * Every field in HeroGridCell can be overridden independently, including `image`,
 * so rows do not have to share the column's default image.
 */
export const heroGridCellOverrides: HeroGridCellOverrides = {
	'0:0': {
		position: '18% 18%',
		transitionMs: 600
	},
	'5:11': {
		position: '82% 83%',
		leaveBehavior: 'hold',
		transitionMs: 700
	}
};

export function createHeroGridCells({
	cellImages = {},
	overrides = heroGridCellOverrides
}: HeroGridOptions = {}): HeroGridCell[][] {
	const cells: HeroGridCell[][] = [];

	for (let row = 0; row < HERO_GRID_ROWS; row += 1) {
		const rowCells: HeroGridCell[] = [];

		for (let column = 0; column < HERO_GRID_COLUMNS; column += 1) {
			const id = `${row}:${column}` as const;
			const explicitImage = cellImages[id] || overrides[id]?.image;
			const image =
				explicitImage || rowCells[column - 1]?.image || cells[row - 1]?.[column]?.image || '';
			const baseCell: HeroGridCell = {
				id,
				row,
				column,
				label: `Hero cell ${row + 1}, ${column + 1}`,
				image,
				backgroundColor: 'transparent',
				position: 'center center',
				size: 'cover',
				opacity: 1,
				filter: `grayscale(${6 + row * 4}%) saturate(${1 - row * 0.02}) contrast(1.03)`,
				scale: 1.025 + row * 0.006,
				blendMode: 'normal',
				dwellMs: 125,
				transitionMs: 480,
				leaveBehavior: 'clear'
			};

			rowCells.push({
				...baseCell,
				...overrides[id],
				image
			});
		}

		cells.push(rowCells);
	}

	return cells;
}
