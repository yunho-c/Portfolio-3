<script lang="ts">
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { Button } from '$lib/components/ui/button/index.js';
	import SearchResultsGrid from '$lib/components/SearchResultsGrid.svelte';
	import type { PageData } from './$types';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog/index.js';

	export let data: PageData;

	let selectedObject: PageData['objects'][number] | null = null;
</script>

<header class="border-b px-4 py-2 lg:px-6">
	<div class="flex items-center gap-4">
		<h1 class="text-lg font-semibold">Objects</h1>
		<form class="flex w-full max-w-sm items-center space-x-2">
			<!-- <Input name="q" placeholder="Search for objects..." /> -->
			<Button type="submit">Search</Button>
			<Button variant="secondary" size="icon" class="size-8">
				<ChevronRightIcon />
			</Button>
		</form>
	</div>
</header>

<main class="container mx-auto p-4">
	<SearchResultsGrid
		objects={data.objects}
		on:select={(e) => (selectedObject = e.detail)}
	/>
</main>

{#if selectedObject}
	<Dialog open={!!selectedObject} onOpenChange={(open) => !open && (selectedObject = null)}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>{selectedObject.name}</DialogTitle>
			</DialogHeader>
			<img src={selectedObject.thumbnail} alt={selectedObject.name} class="mx-auto rounded-lg" />
		</DialogContent>
	</Dialog>
{/if}
