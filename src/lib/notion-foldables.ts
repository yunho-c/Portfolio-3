export interface NotionMarkdownBlock {
	type?: string;
	blockId: string;
	parent: string;
	children: NotionMarkdownBlock[];
}

const HEADING_TYPES = new Set(['heading_1', 'heading_2', 'heading_3']);

function prepareSummaryHeading(markdown: string): string {
	return `\n\n${markdown.trim()}\n\n`;
}

/**
 * Convert Notion's toggleable headings into the toggle shape expected by notion-to-md.
 *
 * Notion exposes toggleable headings as heading blocks with children. Without this
 * normalization, notion-to-md indents those children and Markdown renders them as code.
 */
export function normalizeNotionFoldables(blocks: NotionMarkdownBlock[]): NotionMarkdownBlock[] {
	return blocks.map((block) => {
		const children = normalizeNotionFoldables(block.children);

		if (block.type && HEADING_TYPES.has(block.type) && children.length > 0) {
			return {
				...block,
				type: 'toggle',
				parent: prepareSummaryHeading(block.parent),
				children
			};
		}

		return { ...block, children };
	});
}
