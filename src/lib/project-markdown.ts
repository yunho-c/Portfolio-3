import { Marked } from 'marked';

interface HoverNoteToken {
	type: 'projectHoverNote';
	raw: string;
	label: string;
	content: string;
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

const projectMarkdown = new Marked({
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

/** Render project Markdown with one-line `[label]{hover: note}` annotations. */
export function renderProjectMarkdown(markdown: string): string {
	return projectMarkdown.parse(markdown, { async: false });
}
