<script lang="ts">
	import ProjectGrid from '$lib/components/ProjectGrid.svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	// Sample projects data
	const projects = [
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
		}
	];
</script>

<div class="hero flex h-96 items-center justify-center bg-cover bg-center bg-no-repeat relative" style="background-image: url('/images/mpcnc_lowrider2_part_collage.jpg')">
	<div class="absolute inset-0 backdrop-blur-[2px]"></div>
	<div class="text-left w-full max-w-4xl mx-auto px-0 relative z-10">
		<h1 class="text-6xl font-bold text-white opacity-90 mb-4 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">
			Yunho Cho
		</h1>
		<p class="text-xl text-white opacity-90 mb-6 drop-shadow-[0_0_8px_rgba(0,0,0,0.7)]">
			M.S. Robotics at Georgia Tech
		</p>
		<Button variant="link" class="text-white">
			Resume
		</Button>
	</div>
</div>

<div class="container mx-auto p-4 mt-8">
	<h3 class="text-xl font-semibold mb-6">Featured Projects</h3>
	<ProjectGrid {projects} on:select={(e) => console.log('Selected project:', e.detail)} />
</div>
