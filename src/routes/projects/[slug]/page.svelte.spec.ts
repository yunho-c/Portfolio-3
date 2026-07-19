import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { renderNotionMediaBlock } from '$lib/notion-embeds';
import Page from './+page.svelte';

const project = {
	id: 'hover-note-test',
	slug: 'hover-note-test',
	name: 'Hover Note Test',
	featured: false,
	thumbnail: '',
	description: '',
	tags: []
};

describe('/projects/[slug]/+page.svelte', () => {
	it('shows hover-note content when its inline trigger is hovered', async () => {
		render(Page, {
			data: {
				project,
				content: 'Try an [image codec]{hover: like AVIF and JPEG-XL}.'
			}
		});

		const trigger = page.getByRole('button', { name: 'image codec' });
		await trigger.hover();

		const tooltip = page.getByRole('tooltip');
		await expect.element(tooltip).toHaveTextContent('like AVIF and JPEG-XL');
		await expect.element(tooltip).toBeVisible();
	});

	it('dismisses an open hover note with Escape', async () => {
		render(Page, {
			data: {
				project,
				content: 'Try an [image codec]{hover: like AVIF and JPEG-XL}.'
			}
		});

		const trigger = page.getByRole('button', { name: 'image codec' });
		await trigger.click();
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

		await expect.element(page.getByRole('tooltip')).not.toBeInTheDocument();
	});

	it('renders responsive video and iframe figures from Notion blocks', async () => {
		const video = renderNotionMediaBlock({
			type: 'embed',
			embed: {
				url: 'https://example.com/demo.mov',
				caption: [{ plain_text: 'Video demo' }]
			}
		});
		const iframe = renderNotionMediaBlock({
			type: 'embed',
			embed: {
				url: 'https://example.com/demo/',
				caption: [{ plain_text: 'Interactive demo' }]
			}
		});

		render(Page, {
			data: {
				project,
				content: `${video}\n\n${iframe}`
			}
		});

		const videoElement = document.querySelector<HTMLVideoElement>('.project-embed__video');
		const iframeElement = document.querySelector<HTMLIFrameElement>('.project-embed__iframe');
		const frameShell = document.querySelector<HTMLElement>('.project-embed__frame-shell');

		expect(videoElement?.controls).toBe(true);
		expect(videoElement?.preload).toBe('metadata');
		expect(iframeElement?.title).toBe('Interactive demo');
		expect(iframeElement?.loading).toBe('lazy');
		expect(frameShell?.getBoundingClientRect().height).toBeGreaterThanOrEqual(352);
		await expect.element(page.getByText('Video demo', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('Interactive demo', { exact: true })).toBeInTheDocument();
	});
});
