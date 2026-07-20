import { describe, expect, it } from 'vitest';
import { renderProjectDocument, renderProjectMarkdown } from './project-markdown';

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

	it('collects h2-h4 headings with stable, deduplicated anchor IDs', () => {
		const document = renderProjectDocument(`# Project title

## Background & Motivation

### **Details**

## Background & Motivation

##### Not in the TOC`);

		expect(document.headings).toEqual([
			{ depth: 2, slug: 'background-motivation', text: 'Background & Motivation' },
			{ depth: 3, slug: 'details', text: 'Details' },
			{ depth: 2, slug: 'background-motivation-1', text: 'Background & Motivation' }
		]);
		expect(document.html).toContain('<h1 id="project-title">Project title</h1>');
		expect(document.html).toContain(
			'<h2 id="background-motivation-1">Background &amp; Motivation</h2>'
		);
		expect(document.html).toContain('<h5 id="not-in-the-toc">Not in the TOC</h5>');
	});

	it('adds a TOC anchor to a semantic heading inside a foldable summary', () => {
		const document = renderProjectDocument(`<details>
<summary>

### Background

</summary>

Hidden context.

</details>`);

		expect(document.headings).toEqual([{ depth: 3, slug: 'background', text: 'Background' }]);
		expect(document.html).toContain('<summary><h3 id="background">Background</h3>');
	});
});
