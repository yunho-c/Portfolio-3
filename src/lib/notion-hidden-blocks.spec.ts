import { describe, expect, it } from 'vitest';
import type { NotionMarkdownBlock } from './notion-foldables';
import { filterNotionHiddenBlocks } from './notion-hidden-blocks';

function block(
	blockId: string,
	parent: string,
	children: NotionMarkdownBlock[] = []
): NotionMarkdownBlock {
	return { type: 'paragraph', blockId, parent, children };
}

describe('filterNotionHiddenBlocks', () => {
	it('removes a marked block together with its descendants', () => {
		const filtered = filterNotionHiddenBlocks([
			block('visible', 'Visible introduction.'),
			block('hidden', '[HIDE] Draft section', [
				block('hidden-child', 'Secret child.'),
				block('hidden-grandparent', 'Nested container.', [
					block('hidden-grandchild', 'Secret grandchild.')
				])
			]),
			block('ending', 'Visible conclusion.')
		]);

		expect(filtered.map(({ blockId }) => blockId)).toEqual(['visible', 'ending']);
	});

	it('filters marked descendants while preserving their visible parent and siblings', () => {
		const [filtered] = filterNotionHiddenBlocks([
			block('parent', 'Visible parent.', [
				block('first', 'Visible child.'),
				block('hidden', '[HIDE] Private child.'),
				block('last', 'Another visible child.')
			])
		]);

		expect(filtered.blockId).toBe('parent');
		expect(filtered.children.map(({ blockId }) => blockId)).toEqual(['first', 'last']);
	});

	it.each([
		'- [HIDE] *Extra*: private note',
		'1. [HIDE] Numbered draft',
		'- [ ] [HIDE] Unpublished task',
		'> [HIDE] Private quote',
		'### **[HIDE]** Draft heading',
		'_[HIDE]_ Private emphasis',
		'   [HIDE] Indented marker'
	])('recognizes a marker after generated Markdown prefixes: %s', (parent) => {
		expect(filterNotionHiddenBlocks([block('hidden', parent)])).toEqual([]);
	});

	it.each([
		'[hide] Lowercase marker',
		'Introduction [HIDE] later in the block',
		'`code` [HIDE] after visible content',
		'Hidden without the marker'
	])('preserves blocks that do not begin with the exact marker: %s', (parent) => {
		expect(filterNotionHiddenBlocks([block('visible', parent)])).toHaveLength(1);
	});
});
