<script lang="ts">
	import ProjectGrid from '$lib/components/ProjectGrid.svelte';

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

<main class="mx-auto max-w-[840px] px-5 pt-24 pb-20 sm:px-6 md:pt-40 md:pb-32">
	<!-- Primary Anchor (Huge, Bold) -->
	<h1 class="text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl">
		Hi, nice to meet you, my name is Yunho 
		<span class="font-normal italic text-muted-foreground">('you-know')</span>.
	</h1>
	
	<!-- Secondary Thesis (Large, Muted with Highlighted Keywords) -->
	<p class="mt-8 text-2xl font-medium leading-snug text-muted-foreground sm:text-3xl">
		I am a machine learning engineer interested in foundational 
		<span class="text-foreground">language</span>, 
		<span class="text-foreground">vision</span>, and 
		<span class="text-foreground">human-computer interaction</span> technologies.
	</p>

	<!-- Tertiary Context (Smaller, Playful) -->
	<p class="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground/80 sm:text-xl">
		I am generally interested about everything and quite 
		<span class="cursor-help transition-all duration-300 hover:blur-[3px] text-foreground">distracted</span>, 
		which naturally leads me to work on many side projects... some of which you can check out below :)
	</p>
</main>

<div class="container mx-auto p-4 mt-8">
	<h3 class="text-xl font-semibold mb-6">Featured Projects</h3>
	<ProjectGrid {projects} on:select={(e) => console.log('Selected project:', e.detail)} />
</div>
