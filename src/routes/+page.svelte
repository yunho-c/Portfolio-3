<script lang="ts">
	import ProjectGrid from '$lib/components/ProjectGrid.svelte';

	// Sample projects data
	const projects = [
		{
			id: 1,
			name: 'E-Commerce Platform',
			thumbnail: 'https://placehold.co/400x400/9333ea/white?text=E-Commerce'
		},
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
		}
	];
</script>

<div class="hero flex h-96 items-center justify-center">
	<div class="text-center">
		<h1 class="text-5xl font-bold">Yunho Cho</h1>
		<p class="py-6">
			Master's in Robotics at Georgia Tech
		</p>
	</div>
</div>

<div class="container mx-auto p-4">
	<h3 class="text-xl font-semibold mb-6">Featured Projects</h3>
	<ProjectGrid {projects} on:select={(e) => console.log('Selected project:', e.detail)} />
</div>
