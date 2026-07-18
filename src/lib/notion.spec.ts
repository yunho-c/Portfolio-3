import { describe, expect, it } from 'vitest';
import { isProjectPublished } from './notion';

describe('isProjectPublished', () => {
	it('hides projects whose Status is Not published', () => {
		expect(
			isProjectPublished({
				properties: { Status: { status: { name: 'Not published' } } }
			})
		).toBe(false);
	});

	it.each(['In progress', 'Done'])('keeps projects with the %s status', (status) => {
		expect(
			isProjectPublished({
				properties: { Status: { status: { name: status } } }
			})
		).toBe(true);
	});

	it('keeps projects without a status', () => {
		expect(isProjectPublished({ properties: {} })).toBe(true);
	});
});
