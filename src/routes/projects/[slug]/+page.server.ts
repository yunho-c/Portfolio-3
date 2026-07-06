import { getProjectBySlug, getProjects } from '$lib/notion';
import { error } from '@sveltejs/kit';
import type { PageServerLoad, EntryGenerator } from './$types';

// Tell SvelteKit to prerender these dynamic routes as static HTML pages
export const prerender = true;

// Pre-generate all valid slugs for the crawler at build time
export const entries: EntryGenerator = async () => {
	const projects = await getProjects();
	return projects.map((p) => ({ slug: p.slug }));
};

export const load: PageServerLoad = async ({ params }) => {
	const result = await getProjectBySlug(params.slug);
	if (!result) {
		throw error(404, 'Project not found');
	}
	return { project: result.project, content: result.content };
};
