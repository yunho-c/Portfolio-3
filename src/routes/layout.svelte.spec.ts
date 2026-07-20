import { afterEach, describe, expect, it } from 'vitest';
import { tick } from 'svelte';
import { render } from 'vitest-browser-svelte';
import Layout from './+layout.svelte';

afterEach(() => {
	document.body.classList.remove('experimental-fonts');
});

describe('/+layout.svelte experimental font shortcut', () => {
	it('toggles experimental fonts with the f key', async () => {
		render(Layout);
		await tick();

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', bubbles: true }));
		await tick();
		expect(document.body.classList.contains('experimental-fonts')).toBe(true);

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F', bubbles: true }));
		await tick();
		expect(document.body.classList.contains('experimental-fonts')).toBe(false);
	});

	it('ignores modified and repeated f key presses', async () => {
		render(Layout);
		await tick();

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true }));
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', repeat: true, bubbles: true }));

		expect(document.body.classList.contains('experimental-fonts')).toBe(false);
	});

	it('ignores f key presses while typing', async () => {
		render(Layout);
		await tick();
		const input = document.createElement('input');
		document.body.append(input);

		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', bubbles: true }));

		expect(document.body.classList.contains('experimental-fonts')).toBe(false);
		input.remove();
	});
});
