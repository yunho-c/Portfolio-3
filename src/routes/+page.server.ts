import { getProjects } from '$lib/notion';
import { loadHeroCollageMedia } from '$lib/server/hero-collage';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = async () => {
	const allProjects = await getProjects();
	const projects = allProjects.filter((p) => p.featured);
	const heroCollageMedia = await loadHeroCollageMedia();
	return { projects, heroCollageMedia };
};
