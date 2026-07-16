import { describe, expect, it } from 'vitest';
import { consumeHomeIntro, createUiSession } from './ui-session';

describe('consumeHomeIntro', () => {
	it('plays once during a layout session', () => {
		const session = createUiSession();

		expect(consumeHomeIntro(session)).toBe(true);
		expect(consumeHomeIntro(session)).toBe(false);
	});

	it('plays again in a new layout session', () => {
		const firstSession = createUiSession();
		const nextSession = createUiSession();

		expect(consumeHomeIntro(firstSession)).toBe(true);
		expect(consumeHomeIntro(nextSession)).toBe(true);
	});
});
