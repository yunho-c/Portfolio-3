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
		await expect
			.element(
				page.getByRole('heading', {
					level: 2,
					name: 'Geometry Optimization of a Piezoresistive Thin Film Biopatch in a Wireless, Battery-Operated, Wearable Sensor with On-Device Machine Learning for Early Detection of Hypertrophic Scars'
				})
			)
			.toBeVisible();
		await expect.element(page.getByText('Biosensors 2023')).toBeVisible();
		await expect.element(page.getByText('Poster', { exact: true })).toBeVisible();

		const posterButton = page.getByRole('button', { name: 'View poster' });
		await posterButton.click();
		await expect
			.element(page.getByRole('dialog', { name: 'Biosensors 2023 poster' }))
			.toBeVisible();
		await expect
			.element(
				page.getByRole('img', {
					name: 'Biosensors 2023 poster for the piezoresistive thin-film biopatch project'
				})
			)
			.toBeVisible();

		const zoomOutButton = page.getByRole('button', { name: 'Zoom out' });
		const zoomInButton = page.getByRole('button', { name: 'Zoom in' });
		const resetZoomButton = page.getByRole('button', { name: 'Reset poster zoom to fit' });

		await expect.element(zoomOutButton).toBeDisabled();
		await expect.element(resetZoomButton).toHaveTextContent('100%');
		await zoomInButton.click();
		await expect.element(resetZoomButton).toHaveTextContent('125%');
		await expect.element(zoomOutButton).toBeEnabled();
		await resetZoomButton.click();
		await expect.element(resetZoomButton).toHaveTextContent('100%');
		await expect.element(zoomOutButton).toBeDisabled();

		await page.getByRole('button', { name: 'Close' }).click();
		await expect
			.element(page.getByRole('dialog', { name: 'Biosensors 2023 poster' }))
			.not.toBeInTheDocument();
	});
});
