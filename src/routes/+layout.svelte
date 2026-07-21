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
	const uiPreferences = $state(createUiPreferences());
	provideUiPreferences(uiPreferences);

	$effect(() => {
		document.body.classList.toggle('experimental-fonts', uiPreferences.experimentalFonts);

		return () => document.body.classList.remove('experimental-fonts');
	});

	function handlePreferencesKeydown(event: KeyboardEvent) {
		if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;

		const target = event.target;
		if (
			target instanceof HTMLElement &&
			(target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
		) {
			return;
		}

		if (event.key.toLowerCase() === 'f') {
			uiPreferences.experimentalFonts = !uiPreferences.experimentalFonts;
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<svelte:window onkeydown={handlePreferencesKeydown} />

<Header />

{@render children?.()}
