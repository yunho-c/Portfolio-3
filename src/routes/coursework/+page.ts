import { error } from '@sveltejs/kit';
import { parseCourseworkCsv } from '$lib/coursework';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const response = await fetch('/data/courses.csv');

	if (!response.ok) {
		throw error(500, 'Coursework data could not be loaded.');
	}

	return parseCourseworkCsv(await response.text());
};
