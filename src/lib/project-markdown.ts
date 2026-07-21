import { Marked } from 'marked';
import { PROJECT_GALLERY_SENTINEL_PREFIX, type ProjectGallery } from './project-gallery';

export interface ProjectHeading {
	depth: number;
	slug: string;
	text: string;
}

export interface ProjectDocument {
	html: string;
	headings: ProjectHeading[];
	segments: ProjectDocumentSegment[];
}

export type ProjectDocumentSegment =
	{ kind: 'html'; html: string } | { kind: 'gallery'; gallery: ProjectGallery };

interface HoverNoteToken {
	type: 'projectHoverNote';
	raw: string;
	label: string;
	content: string;
}

interface TextBearingToken {
	type?: string;
	text?: string;
	tokens?: TextBearingToken[];
}

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

function getTokenText(tokens: TextBearingToken[]): string {
	return tokens
		.map((token) => {
			if (token.tokens?.length) return getTokenText(token.tokens);
			if (token.type === 'html') return token.text?.replace(/<[^>]*>/g, '') ?? '';
			return token.text ?? '';
		})
		.join('');
}

function createHeadingSlug(text: string, occurrences: Map<string, number>): string {
	const base =
		text
			.normalize('NFKD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
			.trim()
			.replace(/[\s-]+/g, '-') || 'section';
	const occurrence = occurrences.get(base) ?? 0;
	occurrences.set(base, occurrence + 1);
	return occurrence === 0 ? base : `${base}-${occurrence}`;
}

function createProjectMarkdown(headings: ProjectHeading[]): Marked {
	const headingOccurrences = new Map<string, number>();

	return new Marked({
		renderer: {
			heading({ tokens, depth }) {
				const text = getTokenText(tokens as TextBearingToken[]).trim();
				const slug = createHeadingSlug(text, headingOccurrences);
				const label = this.parser.parseInline(tokens);

				if (depth >= 2 && depth <= 4) headings.push({ depth, slug, text });

				return `<h${depth} id="${escapeHtml(slug)}">${label}</h${depth}>\n`;
			}
		},
		extensions: [
			{
				name: 'projectHoverNote',
				level: 'inline',
				start(source) {
					const start = source.indexOf('[');
					return start === -1 ? undefined : start;
				},
				tokenizer(source) {
					const match = /^\[([^\]\n]+)\]\{hover:([^}\n]*)\}/.exec(source);
					if (!match) return undefined;

					const label = match[1].trim();
					const content = match[2].trim();
					if (!label || !content) return undefined;

					return {
						type: 'projectHoverNote',
						raw: match[0],
						label,
						content
					} satisfies HoverNoteToken;
				},
				renderer(token) {
					const hoverNote = token as unknown as HoverNoteToken;
					const label = escapeHtml(hoverNote.label);
					const content = escapeHtml(hoverNote.content);

					return `<button type="button" class="project-hover-note" data-project-hover-note data-project-hover-note-content="${content}">${label}</button>`;
				}
			}
		]
	});
}

const GALLERY_SENTINEL = new RegExp(`<!--${PROJECT_GALLERY_SENTINEL_PREFIX}([^>]+)-->`, 'g');

/** Render project Markdown and collect its h2-h4 table-of-contents entries. */
export function renderProjectDocument(
	markdown: string,
	galleries: ProjectGallery[] = []
): ProjectDocument {
	const headings: ProjectHeading[] = [];
	const renderer = createProjectMarkdown(headings);
	const galleryById = new Map(galleries.map((gallery) => [gallery.id, gallery]));
	const segments: ProjectDocumentSegment[] = [];
	let cursor = 0;

	for (const match of markdown.matchAll(GALLERY_SENTINEL)) {
		const index = match.index ?? 0;
		const before = markdown.slice(cursor, index);
		if (before.trim()) {
			segments.push({ kind: 'html', html: renderer.parse(before, { async: false }) });
		}

		const encodedId = match[1];
		let id = encodedId;
		try {
			id = decodeURIComponent(encodedId);
		} catch {
			// Keep a malformed marker inert instead of failing the whole project page.
		}

		const gallery = galleryById.get(id);
		if (gallery) {
			segments.push({ kind: 'gallery', gallery });
		} else {
			segments.push({ kind: 'html', html: renderer.parse(match[0], { async: false }) });
		}

		cursor = index + match[0].length;
	}

	const after = markdown.slice(cursor);
	if (after.trim() || segments.length === 0) {
		segments.push({ kind: 'html', html: renderer.parse(after, { async: false }) });
	}

	const html = segments
		.map((segment) =>
			segment.kind === 'html'
				? segment.html
				: `<!--${PROJECT_GALLERY_SENTINEL_PREFIX}${encodeURIComponent(segment.gallery.id)}-->`
		)
		.join('');

	return { html, headings, segments };
}

/** Render project Markdown with one-line `[label]{hover: note}` annotations. */
export function renderProjectMarkdown(markdown: string): string {
	return renderProjectDocument(markdown).html;
}
