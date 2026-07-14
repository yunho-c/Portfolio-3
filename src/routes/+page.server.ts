import { getProjects } from '$lib/notion';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = async () => {
	const allProjects = await getProjects();
	const projects = allProjects.filter((p) => p.featured);
	const heroImages = allProjects.map((project) => project.thumbnail).filter(Boolean);
	return { projects, heroImages };
};
