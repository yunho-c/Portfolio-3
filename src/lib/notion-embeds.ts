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

function renderCaption(caption: string, className = 'project-embed__caption'): string {
	return caption ? `\n<figcaption class="${className}">${escapeHtml(caption)}</figcaption>` : '';
}

function renderImage(url: URL, caption: string): string {
	const href = escapeHtml(url.href);
	const label = escapeHtml(getMediaLabel(url, caption, 'Project image'));

	return `<figure class="project-image">
<img class="project-image__media" src="${href}" alt="${label}" loading="lazy" decoding="async">${renderCaption(caption, 'project-image__caption')}
</figure>`;
}

function renderVideo(url: URL, caption: string): string {
	const href = escapeHtml(url.href);
	const label = escapeHtml(getMediaLabel(url, caption, 'Embedded video'));

	return `<figure class="project-embed project-embed--video">
<video class="project-embed__video" src="${href}" controls playsinline preload="metadata" aria-label="${label}">
<a href="${href}" target="_blank" rel="noopener noreferrer">Open ${label}</a>
</video>${renderCaption(caption)}
</figure>`;
}

function renderIframe(url: URL, caption: string): string {
	const href = escapeHtml(url.href);
	const title = escapeHtml(caption || `Embedded content from ${url.hostname}`);
	const hostname = escapeHtml(url.hostname);

	return `<figure class="project-embed project-embed--iframe" data-embed-host="${hostname}">
<div class="project-embed__frame-shell">
<iframe class="project-embed__iframe" src="${href}" title="${title}" loading="lazy" sandbox="allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts" allow="accelerometer; autoplay; clipboard-read; clipboard-write; encrypted-media; fullscreen; gamepad; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin"></iframe>
</div>${renderCaption(caption)}
</figure>`;
}

/** Convert Notion image, video, and embed blocks into safe, responsive HTML. */
export function renderNotionMediaBlock(block: unknown): string {
	const mediaBlock = block as NotionMediaBlock;

	if (mediaBlock.type === 'image') {
		const image = mediaBlock.image;
		const source = image?.type === 'file' ? image.file?.url : image?.external?.url;
		const url = getHttpsUrl(source);
		return url ? renderImage(url, getCaption(image?.caption)) : '';
	}

	if (mediaBlock.type === 'video') {
		const video = mediaBlock.video;
		const source = video?.type === 'file' ? video.file?.url : video?.external?.url;
		const url = getHttpsUrl(source);
		return url ? renderVideo(url, getCaption(video?.caption)) : '';
	}

	if (mediaBlock.type === 'embed') {
		const embed = mediaBlock.embed;
		const url = getHttpsUrl(embed?.url);
		if (!url) return '';

		const caption = getCaption(embed?.caption);
		return isVideoUrl(url) ? renderVideo(url, caption) : renderIframe(url, caption);
	}

	return '';
}
