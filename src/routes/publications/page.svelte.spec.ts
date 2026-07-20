import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/publications/+page.svelte', () => {
	it('renders the publication and its source links', async () => {
		render(Page);

		await expect
			.element(page.getByRole('heading', { level: 1, name: 'Publications' }))
			.toBeVisible();
		await expect
			.element(
				page.getByRole('heading', {
					level: 2,
					name: 'A Closed-Form Geometric Retargeting Solver for Upper Body Humanoid Robot Teleoperation'
				})
			)
			.toBeVisible();
		await expect
			.element(page.getByRole('link', { name: 'Project page' }))
			.toHaveAttribute('href', 'https://sew-mimic.com');
		await expect
			.element(page.getByRole('link', { name: 'Read paper' }))
			.toHaveAttribute('href', 'https://arxiv.org/abs/2602.01632');
	});
});
