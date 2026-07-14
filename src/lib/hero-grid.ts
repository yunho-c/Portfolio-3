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

const FALLBACK_IMAGES = ['/images/mpcnc_lowrider2_part_collage.jpg'];
const ROW_POSITIONS = ['18%', '31%', '43%', '57%', '70%', '83%'];

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
	'2:5': {
		image: '/images/mpcnc_lowrider2_part_collage.jpg',
		position: '54% 48%',
		opacity: 0.28,
		filter: 'grayscale(18%) saturate(0.82) contrast(0.96)'
	},
	'5:11': {
		position: '82% 83%',
		leaveBehavior: 'hold',
		transitionMs: 700
	}
};

export function createHeroGridCells(
	images: string[],
	{ cellImages = {}, overrides = heroGridCellOverrides }: HeroGridOptions = {}
): HeroGridCell[][] {
	const imagePool = images.filter(Boolean);
	const availableImages = imagePool.length > 0 ? imagePool : FALLBACK_IMAGES;

	return Array.from({ length: HERO_GRID_ROWS }, (_, row) =>
		Array.from({ length: HERO_GRID_COLUMNS }, (_, column) => {
			const horizontalPosition = 18 + (column / (HERO_GRID_COLUMNS - 1)) * 64;
			const id = `${row}:${column}` as const;
			const baseCell: HeroGridCell = {
				id,
				row,
				column,
				label: `Hero cell ${row + 1}, ${column + 1}`,
				image: availableImages[column % availableImages.length],
				backgroundColor: 'transparent',
				position: `${horizontalPosition}% ${ROW_POSITIONS[row]}`,
				size: 'cover',
				opacity: 0.22 + row * 0.008,
				filter: `grayscale(${20 + row * 6}%) saturate(${0.86 - row * 0.035}) contrast(0.96)`,
				scale: 1.025 + row * 0.006,
				blendMode: 'normal',
				dwellMs: 125,
				transitionMs: 480,
				leaveBehavior: 'clear'
			};

			return {
				...baseCell,
				...overrides[id],
				...(cellImages[id] ? { image: cellImages[id] } : {})
			};
		})
	);
}
