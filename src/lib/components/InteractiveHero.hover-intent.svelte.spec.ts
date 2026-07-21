import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { render } from 'vitest-browser-svelte';
import InteractiveHero from './InteractiveHero.svelte';
import type { HeroGridCell } from '$lib/hero-grid';

const pixel = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

function createCell(id: string, column: number): HeroGridCell {
	return {
		id,
		row: 0,
		column,
		label: `Test cell ${column + 1}`,
		media: { kind: 'image', src: pixel },
		backgroundColor: 'transparent',
		position: 'center',
		size: 'cover',
		opacity: 1,
		filter: 'none',
		scale: 1,
		blendMode: 'normal',
		dwellMs: 0,
		transitionMs: 0,
		leaveBehavior: 'clear'
	};
}

function renderHero() {
	const children = createRawSnippet(() => ({
		render: () => '<div style="height: 12rem; width: 24rem">Intro</div>'
	}));
	const { container } = render(InteractiveHero, {
		cells: [[createCell('0:0', 0), createCell('0:1', 1)]],
		activationDelay: 0,
		hoverIntentDelay: 300,
		children
	});
	const hero = container.querySelector<HTMLElement>('.interactive-hero');

	expect(hero).not.toBeNull();
	return hero!;
}

function pointerEvent(type: 'pointerenter' | 'pointermove' | 'pointerleave', x: number, y: number) {
	return new PointerEvent(type, {
		bubbles: true,
		clientX: x,
		clientY: y,
		pointerType: 'mouse'
	});
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('InteractiveHero hover intent', () => {
	it('waits for continuous hero presence without restarting across cells', async () => {
		stubFinePointer();
		const hero = renderHero();
		await new Promise((resolve) => setTimeout(resolve, 20));
		const bounds = hero.getBoundingClientRect();
		const y = bounds.top + bounds.height / 2;

		hero.dispatchEvent(pointerEvent('pointerenter', bounds.left + bounds.width * 0.25, y));
		await new Promise((resolve) => setTimeout(resolve, 240));
		expect(hero.classList.contains('collage-active')).toBe(false);

		hero.dispatchEvent(pointerEvent('pointermove', bounds.left + bounds.width * 0.75, y));
		await new Promise((resolve) => setTimeout(resolve, 160));
		expect(hero.classList.contains('collage-active')).toBe(true);
	});

	it('cancels activation when the pointer leaves before the delay', async () => {
		stubFinePointer();
		const hero = renderHero();
		await new Promise((resolve) => setTimeout(resolve, 20));
		const bounds = hero.getBoundingClientRect();

		hero.dispatchEvent(
			pointerEvent('pointerenter', bounds.left + bounds.width / 2, bounds.top + bounds.height / 2)
		);
		await new Promise((resolve) => setTimeout(resolve, 120));
		hero.dispatchEvent(pointerEvent('pointerleave', bounds.right + 1, bounds.bottom + 1));
		await new Promise((resolve) => setTimeout(resolve, 220));

		expect(hero.classList.contains('collage-active')).toBe(false);
	});
});

function stubFinePointer() {
	vi.stubGlobal(
		'matchMedia',
		vi.fn((query: string) => ({
			matches: query.includes('(hover: hover)'),
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: vi.fn()
		}))
	);
}
