import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCourseworkCsv } from './coursework';

const csv = `\uFEFFCourse Number,Name,Category,Description,Core Course Content (bullet points),Icon ID,Prerequisites (Course Number),Manual Relation,Featured
CS 1000,Foundations,"Computing, HCI",Intro,"- Models; - Interfaces",,MATH 1000,"Systems (https://example.com/systems)",Yes
CS 2000,Systems,Computing,,,,,"Foundations (https://example.com/foundations)",No
HIST 1000,History,Communication,,,,,,No
,,,,,,,,No`;

describe('parseCourseworkCsv', () => {
	it('normalizes course rows and ignores trailing empty records', () => {
		const graph = parseCourseworkCsv(csv);

		expect(graph.courses).toHaveLength(3);
		expect(graph.courses[0]).toMatchObject({
			id: 'CS 1000',
			categories: ['Computing', 'HCI'],
			prerequisites: ['MATH 1000'],
			featured: true
		});
		expect(graph.courses[0].coreContent).toEqual(['Models', 'Interfaces']);
		expect(graph.categories).toEqual(['Computing', 'HCI', 'Communication']);
	});

	it('resolves manual relations by name and deduplicates reciprocal links', () => {
		const graph = parseCourseworkCsv(csv);

		expect(graph.relations).toEqual([
			{ id: 'CS 1000--CS 2000', source: 'CS 1000', target: 'CS 2000' }
		]);
	});

	it('builds the expected graph from the portfolio coursework data', () => {
		const portfolioCsv = readFileSync(
			new URL('../../static/data/courses.csv', import.meta.url),
			'utf8'
		);
		const graph = parseCourseworkCsv(portfolioCsv);

		expect(graph.courses).toHaveLength(25);
		expect(graph.relations).toHaveLength(14);
		expect(graph.categories).toHaveLength(9);
	});
});
