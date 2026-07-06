<script lang="ts">
	import ProjectGrid from '$lib/components/ProjectGrid.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Projects - Yunho Cho</title>
</svelte:head>

<main class="min-h-screen bg-background">
	<article class="container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
		<header class="mb-16 text-center md:mb-20">
			<h1 class="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Projects</h1>
			<p class="mt-4 text-lg text-muted-foreground">Some side projects and explorations.</p>
		</header>
		
		<ProjectGrid projects={data.projects} />
	</article>
</main>
