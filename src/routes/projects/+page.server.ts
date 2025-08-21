import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const query = url.searchParams.get('q');

	// In a real application, you would fetch data from a database or an API.
	// For this example, we'll use some mock data.
	const allObjects = [
		{ id: 1, name: 'Mystical Orb', thumbnail: 'https://placehold.co/400x400/9333ea/white?text=Orb' },
		{
			id: 2,
			name: 'Ancient Scroll',
			thumbnail: 'https://placehold.co/400x400/f59e0b/white?text=Scroll'
		},
		{
			id: 3,
			name: 'Dragon Scale',
			thumbnail: 'https://placehold.co/400x400/10b981/white?text=Scale'
		},
		{
			id: 4,
			name: 'Phoenix Feather',
			thumbnail: 'https://placehold.co/400x400/ef4444/white?text=Feather'
		},
		{
			id: 5,
			name: 'Golem Heart',
			thumbnail: 'https://placehold.co/400x400/78716c/white?text=Heart'
		},
		{
			id: 6,
			name: 'Shadow Crystal',
			thumbnail: 'https://placehold.co/400x400/4f46e5/white?text=Crystal'
		}
	];

	const filteredObjects = query
		? allObjects.filter((obj) => obj.name.toLowerCase().includes(query.toLowerCase()))
		: allObjects;

	return {
		objects: filteredObjects
	};
};
