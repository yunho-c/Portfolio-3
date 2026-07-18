import { describe, expect, it } from 'vitest';
import { getProjectDescription, isProjectPublished } from './notion';

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

describe('getProjectDescription', () => {
	it('joins all rich-text fragments in the One-Liner field', () => {
		expect(
			getProjectDescription({
				properties: {
					'One-Liner': {
						rich_text: [{ plain_text: 'A concise ' }, { plain_text: 'project description.' }]
					}
				}
			})
		).toBe('A concise project description.');
	});

	it('returns an empty description when One-Liner is missing', () => {
		expect(getProjectDescription({ properties: {} })).toBe('');
	});
});
