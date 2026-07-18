import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render h1', async () => {
		render(Page, { data: { projects: [], heroCollageMedia: {} } });

		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
	});

	it('settles the intro after primary pointer input', async () => {
		render(Page, {
			data: {
				projects: [
					{
						id: 'test',
						slug: 'test',
						name: 'Test project',
						featured: true,
						thumbnail: '/favicon.svg',
						tags: []
					}
				],
				heroCollageMedia: {}
			}
		});
		const main = document.querySelector('main');

		expect(main?.dataset.introActive).toBe('true');
		window.dispatchEvent(
			new PointerEvent('pointerdown', {
				bubbles: true,
				button: 0,
				isPrimary: true,
				pointerType: 'mouse'
			})
		);
		await new Promise((resolve) => setTimeout(resolve, 400));

		expect(main?.dataset.introActive).toBe('false');
		expect(document.querySelector('.play-home-intro')).toBeNull();
		expect(document.querySelector('.play-skip-sequence')).not.toBeNull();
		const projectHeading = document.querySelector('.play-skip-projects');
		const firstProject = document.querySelector('.project-skip-reveal');
		expect(projectHeading).not.toBeNull();
		expect(firstProject).not.toBeNull();
		expect(getComputedStyle(projectHeading as Element).animationDelay).toBe('0.54s');
		expect(getComputedStyle(firstProject as Element).animationDelay).toBe('1.08s');
	});
});
