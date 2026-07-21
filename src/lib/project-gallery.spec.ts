import { describe, expect, it, vi } from 'vitest';
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import {
	createProjectGallerySentinel,
	extractNotionGalleries,
	getProjectGalleryPreviewItems,
	type ProjectGalleryItem
} from './project-gallery';
import type { NotionMarkdownBlock } from './notion-foldables';

function block(
	blockId: string,
	type: string,
	parent: string,
	children: NotionMarkdownBlock[] = []
): NotionMarkdownBlock {
	return { blockId, type, parent, children };
}

const image: ProjectGalleryItem = {
	kind: 'image',
	src: 'https://example.com/image.png',
	label: 'Architecture diagram'
};
const video: ProjectGalleryItem = {
	kind: 'video',
	src: 'https://example.com/demo.mp4',
	label: 'System demo',
	caption: 'System demo'
};

describe('extractNotionGalleries', () => {
	it('replaces a valid top-level gallery foldable with a stable sentinel', () => {
		const media = new Map<string, ProjectGalleryItem>([
			['image', image],
			['video', video]
		]);
		const result = extractNotionGalleries(
			[
				block('gallery', 'toggle', '\n\n### **[GALLERY] System demo**\n\n', [
					block('image', 'image', '<figure>image</figure>'),
					block('video', 'video', '<figure>video</figure>')
				])
			],
			media
		);

		expect(result.galleries).toEqual([
			{ id: 'gallery', title: 'System demo', items: [image, video] }
		]);
		expect(result.blocks).toEqual([
			expect.objectContaining({
				blockId: 'gallery',
				type: 'paragraph',
				parent: createProjectGallerySentinel('gallery'),
				children: []
			})
		]);

		const n2m = new NotionToMarkdown({ notionClient: new Client() });
		expect(n2m.toMarkdownString(result.blocks).parent).toContain(
			createProjectGallerySentinel('gallery')
		);
	});

	it('supports an untitled native toggle', () => {
		const result = extractNotionGalleries(
			[block('gallery', 'toggle', '[GALLERY]', [block('image', 'image', 'image')])],
			new Map([['image', image]])
		);

		expect(result.galleries[0].title).toBeUndefined();
	});

	it('ignores empty paragraph separators between gallery media', () => {
		const result = extractNotionGalleries(
			[
				block('gallery', 'toggle', '[GALLERY]', [
					block('image', 'image', 'image'),
					block('separator', 'paragraph', '  \n'),
					block('video', 'video', 'video')
				])
			],
			new Map<string, ProjectGalleryItem>([
				['image', image],
				['video', video]
			])
		);

		expect(result.galleries[0].items).toEqual([image, video]);
	});

	it('preserves an invalid gallery as an ordinary foldable and warns', () => {
		const warn = vi.fn();
		const gallery = block('invalid-gallery', 'toggle', '[GALLERY] Mixed children', [
			block('image', 'image', 'image'),
			block('paragraph', 'paragraph', 'This is not media.')
		]);
		const result = extractNotionGalleries([gallery], new Map([['image', image]]), warn);

		expect(result.blocks).toEqual([gallery]);
		expect(result.galleries).toEqual([]);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('invalid-gallery'));
	});

	it('preserves and warns about markers outside foldables', () => {
		const warn = vi.fn();
		const marker = block('plain-marker', 'paragraph', '[GALLERY] Not foldable');
		const result = extractNotionGalleries([marker], new Map(), warn);

		expect(result.blocks).toEqual([marker]);
		expect(result.galleries).toEqual([]);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('top-level foldable'));
	});

	it('does not convert nested gallery markers', () => {
		const nested = block('nested', 'toggle', '[GALLERY] Nested', [
			block('image', 'image', 'image')
		]);
		const outer = block('outer', 'toggle', 'Ordinary foldable', [nested]);
		const result = extractNotionGalleries([outer], new Map([['image', image]]));

		expect(result.blocks).toEqual([outer]);
		expect(result.galleries).toEqual([]);
	});
});

describe('getProjectGalleryPreviewItems', () => {
	it('preserves image and video order while excluding iframes', () => {
		expect(
			getProjectGalleryPreviewItems({
				id: 'mixed-gallery',
				items: [
					video,
					{
						kind: 'iframe',
						src: 'https://example.com/demo',
						label: 'Interactive demo',
						host: 'example.com'
					},
					image
				]
			})
		).toEqual([video, image]);
	});
});
