<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { provideUiSession } from '$lib/ui-session';

	let { children } = $props();

	provideUiSession();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Header />

{@render children?.()}
