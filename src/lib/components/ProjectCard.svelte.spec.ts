import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ProjectCard from './ProjectCard.svelte';

describe('ProjectCard', () => {
	it('renders the project one-liner in the hover content', async () => {
		render(ProjectCard, {
			project: {
				id: 'test',
				slug: 'test-project',
				name: 'Test Project',
				featured: true,
				thumbnail: '/favicon.svg',
				description: 'A concise explanation of the project.',
				tags: [{ name: 'Svelte', icon: 'logos:svelte-icon' }]
			}
		});

		await expect.element(page.getByText('A concise explanation of the project.')).toBeInTheDocument();
		await expect.element(page.getByText('Svelte')).toBeInTheDocument();
	});
});
