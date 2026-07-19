import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
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
});
