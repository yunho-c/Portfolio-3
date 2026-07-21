import { page } from '@vitest/browser/context';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ProjectCard from './ProjectCard.svelte';
import type { Project } from '$lib/notion';

const project: Project = {
	id: 'test',
	slug: 'test-project',
	name: 'Test Project',
	featured: true,
	thumbnail: '/favicon.svg',
	description: 'A concise explanation of the project.',
	tags: [{ name: 'Svelte', icon: 'logos:svelte-icon' }]
};

function stubPointerPreferences({ fine = true, reduced = false } = {}) {
	vi.stubGlobal(
		'matchMedia',
		vi.fn((query: string) => ({
			matches: query.includes('prefers-reduced-motion') ? reduced : fine,
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

function pointerEvent(type: 'pointerenter' | 'pointermove' | 'pointerleave', x: number) {
	return new PointerEvent(type, {
		bubbles: true,
		clientX: x,
		clientY: 50,
		pointerType: 'mouse'
	});
}

function galleryProject(): Project {
	return {
		...project,
		thumbnailGallery: [
			{ kind: 'image', src: '/favicon.svg?frame=1', label: 'First frame' },
			{ kind: 'image', src: '/favicon.svg?frame=2', label: 'Second frame' },
			{ kind: 'image', src: '/favicon.svg?frame=3', label: 'Third frame' }
		]
	};
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('ProjectCard', () => {
	it('renders the project one-liner in the hover content', async () => {
		const { container } = render(ProjectCard, { project });

		await expect
			.element(page.getByText('A concise explanation of the project.'))
			.toBeInTheDocument();
		await expect.element(page.getByText('Svelte')).toBeInTheDocument();
		expect(container.querySelector('.project-card-media--single')).not.toBeNull();
		expect(getComputedStyle(container.querySelector('img')!).objectFit).toBe('cover');
	});

	it('preloads crossfade layers, waits for hover intent, and resets on leave', async () => {
		stubPointerPreferences();
		const { container } = render(ProjectCard, { project: galleryProject() });
		const card = container.querySelector<HTMLAnchorElement>('a');
		expect(card).not.toBeNull();
		card!.getBoundingClientRect = () =>
			({
				left: 0,
				right: 300,
				top: 0,
				bottom: 100,
				width: 300,
				height: 100,
				x: 0,
				y: 0
			}) as DOMRect;
		await new Promise((resolve) => setTimeout(resolve, 20));

		card!.dispatchEvent(pointerEvent('pointerenter', 250));
		await new Promise((resolve) => setTimeout(resolve, 240));
		const layers = [...container.querySelectorAll<HTMLElement>('.project-card-media-layer')];
		expect(layers).toHaveLength(3);
		expect(getComputedStyle(layers[0]).transitionDuration).toBe('0.18s');
		expect(container.querySelector('.project-card-media--gallery')).not.toBeNull();
		expect(getComputedStyle(layers[0].querySelector('img')!).objectFit).toBe('cover');
		expect(card?.dataset.activeGalleryIndex).toBe('0');
		expect(card?.dataset.galleryScrubActive).toBeUndefined();

		await new Promise((resolve) => setTimeout(resolve, 90));
		expect(card?.dataset.activeGalleryIndex).toBe('2');
		expect(card?.dataset.galleryScrubActive).toBe('true');
		expect(
			container.querySelector('[data-card-media-active="true"] img')?.getAttribute('src')
		).toBe('/favicon.svg?frame=3');

		card!.dispatchEvent(pointerEvent('pointermove', 120));
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(card?.dataset.activeGalleryIndex).toBe('1');

		card!.dispatchEvent(pointerEvent('pointerleave', 301));
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(card?.dataset.activeGalleryIndex).toBe('0');
		expect(
			container.querySelector('[data-card-media-active="true"] img')?.getAttribute('src')
		).toBe('/favicon.svg?frame=1');
	});

	it('contains only gallery media that is wider than its card frame', async () => {
		let triggerResize: (() => void) | undefined;
		vi.stubGlobal(
			'ResizeObserver',
			class {
				constructor(callback: ResizeObserverCallback) {
					triggerResize = () => callback([], this as unknown as ResizeObserver);
				}

				observe() {}
				unobserve() {}
				disconnect() {}
			}
		);

		const { container } = render(ProjectCard, { project: galleryProject() });
		const mediaContainer = container.querySelector<HTMLElement>('.project-card-media')!;
		const firstImage = container.querySelector<HTMLImageElement>('.project-card-media-layer img')!;
		const firstLayer = firstImage.closest<HTMLElement>('.project-card-media-layer')!;

		mediaContainer.getBoundingClientRect = () => ({ width: 300, height: 200 }) as DOMRect;
		triggerResize?.();
		Object.defineProperties(firstImage, {
			naturalWidth: { configurable: true, value: 600 },
			naturalHeight: { configurable: true, value: 200 }
		});
		firstImage.dispatchEvent(new Event('load'));
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(firstLayer.dataset.cardMediaFit).toBe('contain');
		expect(getComputedStyle(firstImage).objectFit).toBe('contain');

		Object.defineProperties(firstImage, {
			naturalWidth: { configurable: true, value: 200 },
			naturalHeight: { configurable: true, value: 600 }
		});
		firstImage.dispatchEvent(new Event('load'));
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(firstLayer.dataset.cardMediaFit).toBe('cover');
		expect(getComputedStyle(firstImage).objectFit).toBe('cover');
	});

	it('cancels gallery activation when the pointer leaves during the intent delay', async () => {
		stubPointerPreferences();
		const { container } = render(ProjectCard, { project: galleryProject() });
		const card = container.querySelector<HTMLAnchorElement>('a')!;
		card.getBoundingClientRect = () =>
			({
				left: 0,
				right: 300,
				top: 0,
				bottom: 100,
				width: 300,
				height: 100,
				x: 0,
				y: 0
			}) as DOMRect;
		await new Promise((resolve) => setTimeout(resolve, 20));

		card.dispatchEvent(pointerEvent('pointerenter', 250));
		await new Promise((resolve) => setTimeout(resolve, 150));
		card.dispatchEvent(pointerEvent('pointerleave', 301));
		await new Promise((resolve) => setTimeout(resolve, 180));

		expect(card.dataset.activeGalleryIndex).toBe('0');
		expect(card.dataset.galleryScrubActive).toBeUndefined();
	});

	it('keeps the first gallery item on coarse pointers', async () => {
		stubPointerPreferences({ fine: false });
		const { container } = render(ProjectCard, { project: galleryProject() });
		const card = container.querySelector<HTMLAnchorElement>('a')!;
		card.getBoundingClientRect = () =>
			({
				left: 0,
				right: 300,
				top: 0,
				bottom: 100,
				width: 300,
				height: 100,
				x: 0,
				y: 0
			}) as DOMRect;
		await new Promise((resolve) => setTimeout(resolve, 20));

		card.dispatchEvent(pointerEvent('pointerenter', 250));
		await new Promise((resolve) => setTimeout(resolve, 330));

		expect(card.dataset.activeGalleryIndex).toBe('0');
		expect(container.querySelectorAll('.project-card-media-layer')).toHaveLength(1);
		expect(
			container.querySelector('[data-card-media-active="true"] img')?.getAttribute('src')
		).toBe('/favicon.svg?frame=1');
	});

	it('plays only the active video while crossfading mixed gallery media', async () => {
		stubPointerPreferences();
		const playing = new WeakSet<HTMLMediaElement>();
		vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(function (
			this: HTMLMediaElement
		) {
			return !playing.has(this);
		});
		vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
			this: HTMLMediaElement
		) {
			playing.add(this);
			return Promise.resolve();
		});
		vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
			this: HTMLMediaElement
		) {
			playing.delete(this);
		});

		const { container } = render(ProjectCard, {
			project: {
				...project,
				thumbnail: '/first.mp4',
				thumbnailGallery: [
					{ kind: 'video', src: '/first.mp4', label: 'First video' },
					{ kind: 'video', src: '/second.mp4', label: 'Second video' },
					{ kind: 'image', src: '/favicon.svg', label: 'Still preview' }
				]
			}
		});
		const card = container.querySelector<HTMLAnchorElement>('a')!;
		card.getBoundingClientRect = () =>
			({
				left: 0,
				right: 300,
				top: 0,
				bottom: 100,
				width: 300,
				height: 100,
				x: 0,
				y: 0
			}) as DOMRect;
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(playing.has(container.querySelectorAll('video')[0])).toBe(true);

		card.dispatchEvent(pointerEvent('pointerenter', 150));
		await new Promise((resolve) => setTimeout(resolve, 330));
		const videos = container.querySelectorAll('video');
		expect(videos).toHaveLength(2);
		expect(playing.has(videos[0])).toBe(false);
		expect(playing.has(videos[1])).toBe(true);

		card.dispatchEvent(pointerEvent('pointerleave', 301));
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(playing.has(videos[0])).toBe(true);
		expect(playing.has(videos[1])).toBe(false);
	});

	it('does not autoplay the first gallery video when reduced motion is requested', async () => {
		stubPointerPreferences({ reduced: true });
		const { container } = render(ProjectCard, {
			project: {
				...project,
				thumbnail: '/preview.mp4',
				thumbnailGallery: [
					{ kind: 'video', src: '/preview.mp4', label: 'Video preview' },
					{ kind: 'image', src: '/favicon.svg', label: 'Still preview' }
				]
			}
		});
		await new Promise((resolve) => setTimeout(resolve, 20));

		const video = container.querySelector<HTMLVideoElement>('video');
		expect(video).not.toBeNull();
		expect(video?.autoplay).toBe(false);
	});
});
