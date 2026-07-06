<script lang="ts">
	import ProjectGrid from '$lib/components/ProjectGrid.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
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

<div class="container mx-auto px-4 pb-20 sm:px-6 lg:px-8">
	<div class="mb-8 flex items-center justify-between">
		<h3 class="text-2xl font-bold tracking-tight text-foreground">Featured Projects</h3>
		<a href="/projects" class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
			View all projects &rarr;
		</a>
	</div>
	<ProjectGrid projects={data.projects.slice(0, 4)} />
</div>
