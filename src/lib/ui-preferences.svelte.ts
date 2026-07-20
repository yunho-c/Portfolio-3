import { createContext } from 'svelte';

export interface UiPreferences {
	experimentalFonts: boolean;
}

export function createUiPreferences(
	initial: Partial<UiPreferences> = {}
): UiPreferences {
	const preferences = $state({
		experimentalFonts: initial.experimentalFonts ?? false
	});

	return preferences;
}

export const [useUiPreferences, provideUiPreferences] = createContext<UiPreferences>();
