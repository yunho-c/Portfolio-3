import type { NotionMarkdownBlock } from './notion-foldables';

const HIDE_MARKER = '[HIDE]';
const BLOCK_PREFIX = /^(?:#{1,6}[ \t]+|>[ \t]*|(?:[-+*]|\d+[.)])[ \t]+|\[[ xX]\][ \t]+)/;
const INLINE_PREFIX = /^(?:\*\*|__|~~|\*|_|`|<u>)/;

function startsWithHideMarker(markdown: string): boolean {
	let visibleStart = markdown.trimStart();

	while (BLOCK_PREFIX.test(visibleStart)) {
		visibleStart = visibleStart.replace(BLOCK_PREFIX, '');
	}

	while (INLINE_PREFIX.test(visibleStart)) {
		visibleStart = visibleStart.replace(INLINE_PREFIX, '');
	}

	return visibleStart.startsWith(HIDE_MARKER);
}

/** Remove `[HIDE]` blocks and their complete descendant trees before Markdown serialization. */
export function filterNotionHiddenBlocks(blocks: NotionMarkdownBlock[]): NotionMarkdownBlock[] {
	return blocks.flatMap((block) => {
		if (startsWithHideMarker(block.parent)) return [];

		return [
			{
				...block,
				children: filterNotionHiddenBlocks(block.children)
			}
		];
	});
}
