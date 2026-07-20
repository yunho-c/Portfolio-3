import { Marked } from 'marked';

export interface ProjectHeading {
	depth: number;
	slug: string;
	text: string;
}

export interface ProjectDocument {
	html: string;
	headings: ProjectHeading[];
}

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

/** Render project Markdown and collect its h2-h4 table-of-contents entries. */
export function renderProjectDocument(markdown: string): ProjectDocument {
	const headings: ProjectHeading[] = [];
	const renderer = createProjectMarkdown(headings);
	const html = renderer.parse(markdown, { async: false });
	return { html, headings };
}

/** Render project Markdown with one-line `[label]{hover: note}` annotations. */
export function renderProjectMarkdown(markdown: string): string {
	return renderProjectDocument(markdown).html;
}
