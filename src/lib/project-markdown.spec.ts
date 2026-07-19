import { describe, expect, it } from 'vitest';
import { renderProjectMarkdown } from './project-markdown';

describe('renderProjectMarkdown', () => {
	it('renders hover notes alongside ordinary Markdown', () => {
		const markdown = `There are great [image codecs]{hover: like AVIF and JPEG-XL} out there.

- JPEG-XL easily reduces file size.

[Read more](https://example.com)`;
		const html = renderProjectMarkdown(markdown);

		expect(html).toContain('class="project-hover-note"');
		expect(html).toContain('data-project-hover-note-content="like AVIF and JPEG-XL"');
		expect(html).toContain('>image codecs</button>');
		expect(html).toContain('<li>JPEG-XL easily reduces file size.</li>');
		expect(html).toContain('<a href="https://example.com">Read more</a>');
	});

	it('escapes the label and tooltip before rendering raw HTML', () => {
		const html = renderProjectMarkdown('[<em>codec</em>]{hover: <img src=x onerror="alert(1)">}');

		expect(html).toContain('&lt;em&gt;codec&lt;/em&gt;');
		expect(html).toContain(
			'data-project-hover-note-content="&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"'
		);
		expect(html).not.toContain('<img');
	});

	it('leaves incomplete hover syntax as text', () => {
		const html = renderProjectMarkdown('[empty]{hover: } and [unfinished]{hover: note');

		expect(html).toContain('[empty]{hover: }');
		expect(html).toContain('[unfinished]{hover: note');
		expect(html).not.toContain('class="project-hover-note"');
	});
});
