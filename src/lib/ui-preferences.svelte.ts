import { createContext } from 'svelte';

export interface UiPreferences {
	experimentalFonts: boolean;
}

export function createUiPreferences(initial: Partial<UiPreferences> = {}): UiPreferences {
	return {
		experimentalFonts: initial.experimentalFonts ?? false
	};
}

export const [useUiPreferences, provideUiPreferences] = createContext<UiPreferences>();
