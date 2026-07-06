import { getProjects } from '$lib/notion';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = async () => {
	const projects = await getProjects();
	return { projects };
};
