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
});

describe('ProjectCard', () => {
	it('renders the project one-liner in the hover content', async () => {
		render(ProjectCard, { project });

		await expect
			.element(page.getByText('A concise explanation of the project.'))
			.toBeInTheDocument();
		await expect.element(page.getByText('Svelte')).toBeInTheDocument();
	});

	it('waits for hover intent, maps pointer x to gallery items, and resets on leave', async () => {
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
		expect(card?.dataset.activeGalleryIndex).toBe('0');
		expect(card?.dataset.galleryScrubActive).toBeUndefined();

		await new Promise((resolve) => setTimeout(resolve, 90));
		expect(card?.dataset.activeGalleryIndex).toBe('2');
		expect(card?.dataset.galleryScrubActive).toBe('true');
		expect(container.querySelector('img')?.getAttribute('src')).toBe('/favicon.svg?frame=3');

		card!.dispatchEvent(pointerEvent('pointermove', 120));
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(card?.dataset.activeGalleryIndex).toBe('1');

		card!.dispatchEvent(pointerEvent('pointerleave', 301));
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(card?.dataset.activeGalleryIndex).toBe('0');
		expect(container.querySelector('img')?.getAttribute('src')).toBe('/favicon.svg?frame=1');
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
		expect(container.querySelector('img')?.getAttribute('src')).toBe('/favicon.svg?frame=1');
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
