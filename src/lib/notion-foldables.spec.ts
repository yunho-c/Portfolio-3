import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { describe, expect, it } from 'vitest';
import { normalizeNotionFoldables, type NotionMarkdownBlock } from './notion-foldables';
import { renderProjectMarkdown } from './project-markdown';

function paragraph(blockId: string, parent: string): NotionMarkdownBlock {
	return { type: 'paragraph', blockId, parent, children: [] };
}

describe('normalizeNotionFoldables', () => {
	it.each([
		['heading_1', '# Overview'],
		['heading_2', '## Details'],
		['heading_3', '### Background']
	])('converts a toggleable %s while preserving its heading Markdown', (type, parent) => {
		const [normalized] = normalizeNotionFoldables([
			{
				type,
				blockId: 'foldable',
				parent,
				children: [paragraph('child', 'Hidden context.')]
			}
		]);

		expect(normalized.type).toBe('toggle');
		expect(normalized.parent).toBe(`\n\n${parent}\n\n`);
		expect(normalized.children).toHaveLength(1);
	});

	it('leaves ordinary headings and native toggles unchanged', () => {
		const blocks: NotionMarkdownBlock[] = [
			{ type: 'heading_3', blockId: 'heading', parent: '### Always visible', children: [] },
			{
				type: 'toggle',
				blockId: 'toggle',
				parent: 'Existing toggle',
				children: [paragraph('toggle-child', 'Existing content.')]
			}
		];

		const normalized = normalizeNotionFoldables(blocks);

		expect(normalized[0]).toEqual(blocks[0]);
		expect(normalized[1].type).toBe('toggle');
		expect(normalized[1].parent).toBe('Existing toggle');
	});

	it('normalizes nested toggleable headings recursively', () => {
		const [normalized] = normalizeNotionFoldables([
			{
				type: 'toggle',
				blockId: 'outer',
				parent: 'Outer toggle',
				children: [
					{
						type: 'heading_3',
						blockId: 'inner',
						parent: '### Inner heading',
						children: [paragraph('inner-child', 'Nested context.')]
					}
				]
			}
		]);

		expect(normalized.children[0].type).toBe('toggle');
		expect(normalized.children[0].parent).toBe('\n\n### Inner heading\n\n');
	});

	it('renders the OIMG block shape as a disclosure instead of a code block', () => {
		const n2m = new NotionToMarkdown({ notionClient: new Client() });
		const normalized = normalizeNotionFoldables([
			{
				type: 'heading_3',
				blockId: 'background',
				parent: '### **Background**',
				children: [
					paragraph('first', 'First hidden paragraph.'),
					paragraph('second', 'Second hidden paragraph.')
				]
			}
		]);

		const markdown = n2m.toMarkdownString(normalized).parent;
		const html = renderProjectMarkdown(markdown);

		expect(html).toContain('<details>');
		expect(html).toContain('<summary><h3 id="background"><strong>Background</strong></h3>');
		expect(html).toContain('<p>First hidden paragraph.</p>');
		expect(html).toContain('<p>Second hidden paragraph.</p>');
		expect(html).not.toContain('<pre><code>');
	});
});
