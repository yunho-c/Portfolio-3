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

	it('opens a semantic foldable heading without rendering its content as code', async () => {
		render(Page, {
			data: {
				project,
				content: `<details>
<summary>

### Background

</summary>

Hidden project context.

</details>`
			}
		});

		const details = document.querySelector<HTMLDetailsElement>('details');
		const summary = document.querySelector<HTMLElement>('summary');

		expect(details?.open).toBe(false);
		expect(summary?.tabIndex).toBe(0);
		expect(summary?.querySelector('h3')?.textContent).toBe('Background');
		expect(document.querySelector('pre code')).toBeNull();
		await expect.element(page.getByText('Hidden project context.')).not.toBeVisible();

		await page.getByRole('heading', { name: 'Background' }).click();

		expect(details?.open).toBe(true);
		await expect.element(page.getByText('Hidden project context.')).toBeVisible();

		await page.getByRole('heading', { name: 'Background' }).click();
		expect(details?.open).toBe(false);

		await page.getByRole('link', { name: 'Background' }).click();
		expect(details?.open).toBe(true);
	});

	it('builds a nested-depth TOC and marks visible sections as current', async () => {
		render(Page, {
			data: {
				project,
				content: `Preamble.

## First section

First body.

### First detail

Detail body.

## Second section

Second body.`
			}
		});

		const navigation = page.getByRole('navigation', { name: 'Table of contents' });
		const firstLink = page.getByRole('link', { name: 'First section' });
		const detailLink = page.getByRole('link', { name: 'First detail' });

		await expect.element(navigation).toBeInTheDocument();
		await expect.element(firstLink).toHaveAttribute('href', '#first-section');
		await expect.element(detailLink).toHaveAttribute('href', '#first-detail');
		expect(detailLink.element().closest('li')?.getAttribute('aria-level')).toBe('2');
		expect(document.querySelector('h2#first-section')?.textContent).toBe('First section');
		await expect.element(firstLink).toHaveAttribute('aria-current', 'true');
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
