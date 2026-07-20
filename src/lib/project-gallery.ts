import type { NotionMarkdownBlock } from './notion-foldables';

export type ProjectGalleryItem =
	| {
			kind: 'image';
			src: string;
			label: string;
			caption?: string;
	  }
	| {
			kind: 'video';
			src: string;
			label: string;
			caption?: string;
	  }
	| {
			kind: 'iframe';
			src: string;
			label: string;
			caption?: string;
			host: string;
	  };

export interface ProjectGallery {
	id: string;
	title?: string;
	items: ProjectGalleryItem[];
}

export const PROJECT_GALLERY_SENTINEL_PREFIX = 'PROJECT_GALLERY:';

const GALLERY_MARKER = '[GALLERY]';
const BLOCK_PREFIX = /^(?:#{1,6}[ \t]+|>[ \t]*|(?:[-+*]|\d+[.)])[ \t]+|\[[ xX]\][ \t]+)/;
const INLINE_PREFIX = /^(?:\*\*|__|~~|\*|_|`|<u>)/;

function getVisibleStart(markdown: string): string {
	let visibleStart = markdown.trimStart();

	while (BLOCK_PREFIX.test(visibleStart)) {
		visibleStart = visibleStart.replace(BLOCK_PREFIX, '');
	}

	while (INLINE_PREFIX.test(visibleStart)) {
		visibleStart = visibleStart.replace(INLINE_PREFIX, '');
	}

	return visibleStart;
}

function getGalleryTitle(markdown: string): string | null {
	const visibleStart = getVisibleStart(markdown);
	if (!visibleStart.startsWith(GALLERY_MARKER)) return null;

	const title = visibleStart
		.slice(GALLERY_MARKER.length)
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
		.replace(/<[^>]+>/g, '')
		.replace(/[\\*_~`]/g, '')
		.replace(/\s+/g, ' ')
		.trim();

	return title;
}

export function createProjectGallerySentinel(id: string): string {
	return `<!--${PROJECT_GALLERY_SENTINEL_PREFIX}${encodeURIComponent(id)}-->`;
}

export function extractNotionGalleries(
	blocks: NotionMarkdownBlock[],
	mediaByBlockId: ReadonlyMap<string, ProjectGalleryItem>,
	warn: (message: string) => void = console.warn
): { blocks: NotionMarkdownBlock[]; galleries: ProjectGallery[] } {
	const galleries: ProjectGallery[] = [];

	const transformed = blocks.map((block) => {
		const title = getGalleryTitle(block.parent);
		if (title === null) return block;
		if (block.type !== 'toggle') {
			warn(
				`[GALLERY] block ${block.blockId} must be a top-level foldable; rendering it as ordinary content.`
			);
			return block;
		}

		const items = block.children.map((child) => mediaByBlockId.get(child.blockId));
		const isValid =
			block.children.length > 0 &&
			items.every((item): item is ProjectGalleryItem => Boolean(item)) &&
			block.children.every((child) => child.children.length === 0);

		if (!isValid) {
			warn(
				`[GALLERY] block ${block.blockId} must contain only direct image, video, or embed children; rendering it as an ordinary foldable.`
			);
			return block;
		}

		galleries.push({
			id: block.blockId,
			title: title || undefined,
			items
		});

		return {
			...block,
			type: 'paragraph',
			parent: createProjectGallerySentinel(block.blockId),
			children: []
		};
	});

	return { blocks: transformed, galleries };
}
