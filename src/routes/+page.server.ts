import { getProjects } from '$lib/notion';
import { loadHeroCollageImages } from '$lib/server/hero-collage';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = async () => {
	const allProjects = await getProjects();
	const projects = allProjects.filter((p) => p.featured);
	const heroCollageImages = await loadHeroCollageImages();
	return { projects, heroCollageImages };
};
