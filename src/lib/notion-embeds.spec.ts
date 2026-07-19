import { describe, expect, it } from 'vitest';
import { renderNotionMediaBlock } from './notion-embeds';

describe('renderNotionMediaBlock', () => {
	it('renders video-like embed URLs as native video figures', () => {
		const html = renderNotionMediaBlock({
			type: 'embed',
			embed: {
				url: 'https://assets.yunhocho.com/videos/OIMG_macOS_Finder.mov',
				caption: [{ plain_text: 'OIMG Finder integration' }]
			}
		});

		expect(html).toContain('class="project-embed project-embed--video"');
		expect(html).toContain('src="https://assets.yunhocho.com/videos/OIMG_macOS_Finder.mov"');
		expect(html).toContain('controls playsinline preload="metadata"');
		expect(html).toContain('>OIMG Finder integration</figcaption>');
		expect(html).not.toContain('<iframe');
	});

	it('renders webpage embeds as lazy, sandboxed iframes', () => {
		const html = renderNotionMediaBlock({
			type: 'embed',
			embed: {
				url: 'https://embeds.yunhocho.com/tiplets/concept-demo/',
				caption: [{ plain_text: 'TipLets concept demo' }]
			}
		});

		expect(html).toContain('class="project-embed project-embed--iframe"');
		expect(html).toContain('src="https://embeds.yunhocho.com/tiplets/concept-demo/"');
		expect(html).toContain('title="TipLets concept demo"');
		expect(html).toContain('loading="lazy"');
		expect(html).toContain('sandbox="allow-downloads');
		expect(html).toContain('fullscreen; gamepad');
	});

	it('supports native Notion video blocks with external URLs', () => {
		const html = renderNotionMediaBlock({
			type: 'video',
			video: {
				type: 'external',
				external: { url: 'https://assets.yunhocho.com/demo.webm' },
				caption: []
			}
		});

		expect(html).toContain('<video');
		expect(html).toContain('aria-label="demo.webm"');
	});

	it('escapes captions and rejects non-HTTPS media URLs', () => {
		const escaped = renderNotionMediaBlock({
			type: 'embed',
			embed: {
				url: 'https://example.com/demo',
				caption: [{ plain_text: 'Demo <script>alert("x")</script>' }]
			}
		});
		const rejected = renderNotionMediaBlock({
			type: 'embed',
			embed: { url: 'javascript:alert(1)', caption: [] }
		});

		expect(escaped).toContain('Demo &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
		expect(escaped).not.toContain('<script>');
		expect(rejected).toBe('');
	});
});
