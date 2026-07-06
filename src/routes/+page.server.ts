import { getProjects } from '$lib/notion';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = async () => {
	const allProjects = await getProjects();
	const projects = allProjects.filter((p) => p.featured);
	return { projects };
};
