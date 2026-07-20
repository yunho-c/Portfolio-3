<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import {
		createUiPreferences,
		provideUiPreferences
	} from '$lib/ui-preferences.svelte.js';
	import { provideUiSession } from '$lib/ui-session';

	let { children } = $props();

	provideUiSession();
	const uiPreferences = createUiPreferences();
	provideUiPreferences(uiPreferences);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<svelte:body class:experimental-fonts={uiPreferences.experimentalFonts} />

<Header />

{@render children?.()}
