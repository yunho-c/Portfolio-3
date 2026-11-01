import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import type { ComponentProps } from 'svelte';
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

function renderHero(props: Partial<ComponentProps<typeof InteractiveHero>> = {}) {
	const children = createRawSnippet(() => ({
		render: () => '<div style="height: 12rem; width: 24rem">Intro</div>'
	}));
	const { container, rerender } = render(InteractiveHero, {
		cells: [[createCell('0:0', 0), createCell('0:1', 1)]],
		activationDelay: 0,
		hoverIntentDelay: 300,
		children,
		...props
	});
	const hero = container.querySelector<HTMLElement>('.interactive-hero');

	expect(hero).not.toBeNull();
	return { hero: hero!, rerender };
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
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('InteractiveHero hover intent', () => {
	it.each([undefined, false])(
		'disables collage interaction when interactive is %s',
		async (interactive) => {
			stubFinePointer();
			const preloadImage = vi.fn(() => document.createElement('img'));
			vi.stubGlobal('Image', preloadImage);
			const { hero } = renderHero({ interactive });
			const bounds = hero.getBoundingClientRect();
			const measureHero = vi.spyOn(hero, 'getBoundingClientRect');
			const x = bounds.left + bounds.width / 2;
			const y = bounds.top + bounds.height / 2;

			hero.dispatchEvent(pointerEvent('pointerenter', x, y));
			hero.dispatchEvent(pointerEvent('pointermove', x, y));
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v' }));
			await new Promise((resolve) => setTimeout(resolve, 400));

			expect(hero.classList.contains('collage-active')).toBe(false);
			expect(hero.querySelector('.grid-lines.visible')).toBeNull();
			expect(hero.querySelector('video')).toBeNull();
			expect(hero.textContent).toContain('Intro');
			expect(preloadImage).not.toHaveBeenCalled();
			expect(measureHero).not.toHaveBeenCalled();
		}
	);

	it('waits for continuous hero presence without restarting across cells', async () => {
		stubFinePointer();
		const { hero } = renderHero({ interactive: true });
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
		const { hero } = renderHero({ interactive: true });
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

	it('cancels pending hover intent when disabled and can be enabled again', async () => {
		stubFinePointer();
		const { hero, rerender } = renderHero({ interactive: true });
		await new Promise((resolve) => setTimeout(resolve, 20));
		const bounds = hero.getBoundingClientRect();
		const x = bounds.left + bounds.width / 2;
		const y = bounds.top + bounds.height / 2;

		hero.dispatchEvent(pointerEvent('pointerenter', x, y));
		await new Promise((resolve) => setTimeout(resolve, 120));
		await rerender({ interactive: false });
		await new Promise((resolve) => setTimeout(resolve, 220));
		expect(hero.classList.contains('collage-active')).toBe(false);

		await rerender({ interactive: true });
		hero.dispatchEvent(pointerEvent('pointerenter', x, y));
		await expect.poll(() => hero.classList.contains('collage-active')).toBe(true);
	});

	it('clears active video, grid, and queued transitions when disabled', async () => {
		stubFinePointer();
		const videoCell: HeroGridCell = {
			...createCell('0:0', 0),
			media: { kind: 'video', src: 'data:video/mp4;base64,', poster: pixel },
			transitionMs: 200
		};
		const { hero, rerender } = renderHero({
			interactive: true,
			hoverIntentDelay: 0,
			cells: [[videoCell, createCell('0:1', 1)]]
		});
		const bounds = hero.getBoundingClientRect();
		const y = bounds.top + bounds.height / 2;

		hero.dispatchEvent(pointerEvent('pointerenter', bounds.left + bounds.width * 0.25, y));
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v' }));
		await expect.poll(() => hero.querySelector('video')).not.toBeNull();
		expect(hero.querySelector('.grid-lines.visible')).not.toBeNull();
		hero.dispatchEvent(pointerEvent('pointermove', bounds.left + bounds.width * 0.75, y));
		await new Promise((resolve) => setTimeout(resolve, 20));

		await rerender({ interactive: false });
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v' }));
		await new Promise((resolve) => setTimeout(resolve, 300));

		expect(hero.classList.contains('collage-active')).toBe(false);
		expect(hero.querySelector('video')).toBeNull();
		expect(hero.querySelector('.grid-lines.visible')).toBeNull();
		expect(hero.querySelector('.background-layer.active')).toBeNull();
		expect(hero.querySelector('.background-layer.incoming')).toBeNull();
		expect(hero.querySelector('.background-layer.outgoing')).toBeNull();
	});

	it.each(['reduced motion', 'coarse pointer'])(
		'respects %s even when opted in',
		async (reason) => {
			stubFinePointer(reason === 'reduced motion', reason !== 'coarse pointer');
			const preloadImage = vi.fn(() => document.createElement('img'));
			vi.stubGlobal('Image', preloadImage);
			const { hero } = renderHero({ interactive: true, hoverIntentDelay: 0 });
			const bounds = hero.getBoundingClientRect();
			hero.dispatchEvent(pointerEvent('pointerenter', bounds.left + 1, bounds.top + 1));
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v' }));
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(hero.classList.contains('collage-active')).toBe(false);
			expect(hero.querySelector('.grid-lines.visible')).toBeNull();
			expect(preloadImage).not.toHaveBeenCalled();
		}
	);
});

function stubFinePointer(reducedMotion = false, finePointer = true) {
	vi.stubGlobal(
		'matchMedia',
		vi.fn((query: string) => ({
			matches: query.includes('(hover: hover)') ? finePointer : reducedMotion,
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
