import { describe, expect, it } from 'vitest';
import { createUiPreferences } from './ui-preferences.svelte.js';

describe('createUiPreferences', () => {
	it('disables experimental fonts by default', () => {
		const preferences = createUiPreferences();

		expect(preferences.experimentalFonts).toBe(false);
	});

	it('keeps preferences isolated between layout sessions', () => {
		const firstSession = createUiPreferences();
		const nextSession = createUiPreferences();

		firstSession.experimentalFonts = true;

		expect(firstSession.experimentalFonts).toBe(true);
		expect(nextSession.experimentalFonts).toBe(false);
	});

	it('accepts an initial experimental-font setting', () => {
		const preferences = createUiPreferences({ experimentalFonts: true });

		expect(preferences.experimentalFonts).toBe(true);
	});
});
