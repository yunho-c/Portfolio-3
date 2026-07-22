<script lang="ts">
	import CourseworkGraph from '$lib/components/CourseworkGraph.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Coursework - Yunho Cho</title>
	<meta
		name="description"
		content="An interactive map of Yunho Cho's coursework across engineering, computing, neuroscience, and design."
	/>
</svelte:head>

<main class="min-h-screen bg-background">
	<article class="mx-auto w-full max-w-[1280px] px-4 pt-12 pb-10 sm:px-6 sm:pt-16 lg:px-8">
		<header class="mx-auto max-w-2xl text-center">
			<h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Coursework</h1>
		</header>

		<section class="mt-6 sm:mt-8" aria-labelledby="coursework-graph-title">
			<h2 id="coursework-graph-title" class="sr-only">Interactive course relationship graph</h2>
			<CourseworkGraph
				courses={data.courses}
				relations={data.relations}
				categories={data.categories}
			/>
		</section>
	</article>
</main>
