import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const query = url.searchParams.get('q');

	// In a real application, you would fetch data from a database or an API.
	// For this example, we'll use some mock project data.
	const allProjects = [
		{ id: 1, name: 'E-Commerce Platform', thumbnail: 'https://placehold.co/400x400/9333ea/white?text=E-Commerce' },
		{
			id: 2,
			name: 'Task Management App',
			thumbnail: 'https://placehold.co/400x400/f59e0b/white?text=Tasks'
		},
		{
			id: 3,
			name: 'Weather Dashboard',
			thumbnail: 'https://placehold.co/400x400/10b981/white?text=Weather'
		},
		{
			id: 4,
			name: 'Chat Application',
			thumbnail: 'https://placehold.co/400x400/ef4444/white?text=Chat'
		},
		{
			id: 5,
			name: 'Portfolio Website',
			thumbnail: 'https://placehold.co/400x400/78716c/white?text=Portfolio'
		},
		{
			id: 6,
			name: 'Blog Platform',
			thumbnail: 'https://placehold.co/400x400/4f46e5/white?text=Blog'
		}
	];

	const filteredProjects = query
		? allProjects.filter((project) => project.name.toLowerCase().includes(query.toLowerCase()))
		: allProjects;

	return {
		projects: filteredProjects
	};
};
