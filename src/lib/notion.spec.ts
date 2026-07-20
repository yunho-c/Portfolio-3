import { describe, expect, it, vi } from 'vitest';
import {
	getProjectDescription,
	isGalleryThumbnail,
	isProjectPublished,
	resolveProjectGalleryThumbnail,
	type Project
} from './notion';

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

describe('gallery thumbnails', () => {
	const project: Project = {
		id: 'gallery-project',
		slug: 'gallery-project',
		name: 'Gallery Project',
		featured: true,
		thumbnail: 'https://placehold.co/600x400',
		description: '',
		tags: []
	};

	it.each(['gallery', ' Gallery ', 'GALLERY'])('recognizes the reserved %s value', (value) => {
		expect(isGalleryThumbnail(value)).toBe(true);
	});

	it.each(['https://example.com/gallery.jpg', '', null])(
		'does not treat %s as the gallery sentinel',
		(value) => {
			expect(isGalleryThumbnail(value)).toBe(false);
		}
	);

	it('resolves the first gallery to ordered image and video preview media', () => {
		const resolved = resolveProjectGalleryThumbnail(project, [
			{
				id: 'first',
				items: [
					{
						kind: 'video',
						src: 'https://example.com/demo.mp4',
						label: 'Demo'
					},
					{
						kind: 'iframe',
						src: 'https://example.com/embed',
						label: 'Embed',
						host: 'example.com'
					},
					{
						kind: 'image',
						src: 'https://example.com/result.jpg',
						label: 'Result'
					}
				]
			},
			{
				id: 'second',
				items: [
					{
						kind: 'image',
						src: 'https://example.com/ignored.jpg',
						label: 'Ignored'
					}
				]
			}
		]);

		expect(resolved.thumbnail).toBe('https://example.com/demo.mp4');
		expect(resolved.thumbnailGallery?.map((item) => item.kind)).toEqual(['video', 'image']);
	});

	it('keeps the placeholder and warns when no supported preview media exists', () => {
		const warn = vi.fn();
		const resolved = resolveProjectGalleryThumbnail(
			project,
			[
				{
					id: 'embed-only',
					items: [
						{
							kind: 'iframe',
							src: 'https://example.com/embed',
							label: 'Embed',
							host: 'example.com'
						}
					]
				}
			],
			warn
		);

		expect(resolved).toEqual(project);
		expect(warn).toHaveBeenCalledOnce();
	});
});
