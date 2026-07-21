import type { ProjectGalleryItem } from './project-gallery';

interface NotionRichTextFragment {
	plain_text?: string;
}

interface NotionEmbedContent {
	url?: string;
	caption?: NotionRichTextFragment[];
}

interface NotionFileContent {
	type?: 'external' | 'file';
	external?: { url?: string };
	file?: { url?: string };
	caption?: NotionRichTextFragment[];
}

interface NotionMediaBlock {
	id?: string;
	type?: string;
	embed?: NotionEmbedContent;
	video?: NotionFileContent;
	image?: NotionFileContent;
}

const VIDEO_EXTENSIONS = new Set(['.m4v', '.mov', '.mp4', '.ogg', '.ogv', '.webm']);

function escapeHtml(value: string): string {
	return value.replace(
		/[&<>"']/g,
		(character) =>
			({
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;'
			})[character] ?? character
	);
}

function getCaption(fragments?: NotionRichTextFragment[]): string {
	return (
		fragments
			?.map((fragment) => fragment.plain_text ?? '')
			.join('')
			.trim() ?? ''
	);
}

function getHttpsUrl(value?: string): URL | null {
	if (!value) return null;

	try {
		const url = new URL(value);
		return url.protocol === 'https:' ? url : null;
	} catch {
		return null;
	}
}

function isVideoUrl(url: URL): boolean {
	const pathname = url.pathname.toLowerCase();
	return [...VIDEO_EXTENSIONS].some((extension) => pathname.endsWith(extension));
}

function getMediaLabel(url: URL, caption: string, fallback: string): string {
	if (caption) return caption;

	const filename = url.pathname.split('/').filter(Boolean).at(-1);
	if (!filename) return fallback;

	try {
		return decodeURIComponent(filename);
	} catch {
		return filename;
	}
}

/** Normalize a Notion media block for use in either standalone figures or project galleries. */
export function getNotionMediaItem(block: unknown): ProjectGalleryItem | null {
	const mediaBlock = block as NotionMediaBlock;

	if (mediaBlock.type === 'image') {
		const image = mediaBlock.image;
		const source = image?.type === 'file' ? image.file?.url : image?.external?.url;
		const url = getHttpsUrl(source);
		if (!url) return null;

		const caption = getCaption(image?.caption);
		return {
			kind: 'image',
			src: url.href,
			label: getMediaLabel(url, caption, 'Project image'),
			caption: caption || undefined
		};
	}

	if (mediaBlock.type === 'video') {
		const video = mediaBlock.video;
		const source = video?.type === 'file' ? video.file?.url : video?.external?.url;
		const url = getHttpsUrl(source);
		if (!url) return null;

		const caption = getCaption(video?.caption);
		return {
			kind: 'video',
			src: url.href,
			label: getMediaLabel(url, caption, 'Embedded video'),
			caption: caption || undefined
		};
	}

	if (mediaBlock.type === 'embed') {
		const embed = mediaBlock.embed;
		const url = getHttpsUrl(embed?.url);
		if (!url) return null;

		const caption = getCaption(embed?.caption);
		if (isVideoUrl(url)) {
			return {
				kind: 'video',
				src: url.href,
				label: getMediaLabel(url, caption, 'Embedded video'),
				caption: caption || undefined
			};
		}

		return {
			kind: 'iframe',
			src: url.href,
			label: caption || `Embedded content from ${url.hostname}`,
			caption: caption || undefined,
			host: url.hostname
		};
	}

	return null;
}

function renderCaption(caption: string, className = 'project-embed__caption'): string {
	return caption ? `\n<figcaption class="${className}">${escapeHtml(caption)}</figcaption>` : '';
}

function renderImage(item: Extract<ProjectGalleryItem, { kind: 'image' }>): string {
	const href = escapeHtml(item.src);
	const label = escapeHtml(item.label);

	return `<figure class="project-image">
<img class="project-image__media" src="${href}" alt="${label}" loading="lazy" decoding="async">${renderCaption(item.caption ?? '', 'project-image__caption')}
</figure>`;
}

function renderVideo(item: Extract<ProjectGalleryItem, { kind: 'video' }>): string {
	const href = escapeHtml(item.src);
	const label = escapeHtml(item.label);

	return `<figure class="project-embed project-embed--video">
<video class="project-embed__video" src="${href}" controls playsinline preload="metadata" aria-label="${label}">
<a href="${href}" target="_blank" rel="noopener noreferrer">Open ${label}</a>
</video>${renderCaption(item.caption ?? '')}
</figure>`;
}

function renderIframe(item: Extract<ProjectGalleryItem, { kind: 'iframe' }>): string {
	const href = escapeHtml(item.src);
	const title = escapeHtml(item.label);
	const hostname = escapeHtml(item.host);

	return `<figure class="project-embed project-embed--iframe" data-embed-host="${hostname}">
<div class="project-embed__frame-shell">
<iframe class="project-embed__iframe" src="${href}" title="${title}" loading="lazy" sandbox="allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts" allow="accelerometer; autoplay; clipboard-read; clipboard-write; encrypted-media; fullscreen; gamepad; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin"></iframe>
</div>${renderCaption(item.caption ?? '')}
</figure>`;
}

export function renderProjectMediaItem(item: ProjectGalleryItem | null): string {
	if (!item) return '';
	if (item.kind === 'image') return renderImage(item);
	if (item.kind === 'video') return renderVideo(item);
	return renderIframe(item);
}

/** Convert Notion image, video, and embed blocks into safe, responsive HTML. */
export function renderNotionMediaBlock(block: unknown): string {
	return renderProjectMediaItem(getNotionMediaItem(block));
}
