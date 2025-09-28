import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const query = url.searchParams.get('q');

	// In a real application, you would fetch data from a database or an API.
	// For this example, we'll use some mock project data.
	const allProjects = [
		{
			id: 1,
			name: 'E-Commerce Platform',
			thumbnail: 'https://placehold.co/400x400/9333ea/white?text=E-Commerce',
			tags: [
				{ name: 'React', icon: 'logos:react' },
				{ name: 'Node.js', icon: 'logos:nodejs-icon' },
				{ name: 'MongoDB', icon: 'logos:mongodb-icon' },
				{ name: 'Stripe', icon: 'logos:stripe' }
			]
		},
		{
			id: 2,
			name: 'Task Management App',
			thumbnail: 'https://placehold.co/400x400/f59e0b/white?text=Tasks',
			tags: [
				{ name: 'Vue.js', icon: 'logos:vue' },
				{ name: 'TypeScript', icon: 'logos:typescript-icon' },
				{ name: 'Supabase', icon: 'logos:supabase-icon' },
				{ name: 'Tailwind', icon: 'logos:tailwindcss-icon' }
			]
		},
		{
			id: 3,
			name: 'Weather Dashboard',
			thumbnail: 'https://placehold.co/400x400/10b981/white?text=Weather',
			tags: [
				{ name: 'Svelte', icon: 'logos:svelte-icon' },
				{ name: 'JavaScript', icon: 'logos:javascript' },
				{ name: 'Chart.js', icon: 'logos:chartjs' },
				{ name: 'OpenWeather', icon: 'mdi:weather-cloudy' }
			]
		},
		{
			id: 4,
			name: 'Chat Application',
			thumbnail: 'https://placehold.co/400x400/ef4444/white?text=Chat',
			tags: [
				{ name: 'Next.js', icon: 'logos:nextjs-icon' },
				{ name: 'Socket.io', icon: 'logos:socket-io' },
				{ name: 'Redis', icon: 'logos:redis' },
				{ name: 'PostgreSQL', icon: 'logos:postgresql' }
			]
		},
		{
			id: 5,
			name: 'Portfolio Website',
			thumbnail: 'https://placehold.co/400x400/78716c/white?text=Portfolio',
			tags: [
				{ name: 'SvelteKit', icon: 'logos:svelte-kit' },
				{ name: 'TypeScript', icon: 'logos:typescript-icon' },
				{ name: 'Tailwind', icon: 'logos:tailwindcss-icon' },
				{ name: 'Vercel', icon: 'logos:vercel-icon' }
			]
		},
		{
			id: 6,
			name: 'Blog Platform',
			thumbnail: 'https://placehold.co/400x400/4f46e5/white?text=Blog',
			tags: [
				{ name: 'Astro', icon: 'logos:astro-icon' },
				{ name: 'MDX', icon: 'logos:mdx' },
				{ name: 'Prisma', icon: 'logos:prisma' },
				{ name: 'tRPC', icon: 'logos:trpc' }
			]
		}
	];

	const filteredProjects = query
		? allProjects.filter((project) => project.name.toLowerCase().includes(query.toLowerCase()))
		: allProjects;

	return {
		projects: filteredProjects
	};
};
