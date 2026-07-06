import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { env } from '$env/dynamic/private';

// Initialize the Notion client with a fallback empty string for dev environments without keys
const notion = new Client({ auth: env.NOTION_API_KEY || '' });
const n2m = new NotionToMarkdown({ notionClient: notion });

export interface Project {
	id: string;
	slug: string;
	name: string;
	thumbnail: string;
	tags: { name: string; icon: string }[];
}

// Utility to create clean URLs out of the Notion Project Names
function slugify(text: string) {
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export async function getProjects(): Promise<Project[]> {
	if (!env.NOTION_API_KEY || !env.NOTION_DATABASE_ID) {
		console.warn('Missing Notion API keys. Returning mock projects.');
		return getMockProjects();
	}

	try {
		const response = await notion.databases.query({
			database_id: env.NOTION_DATABASE_ID,
			filter: {
				property: 'Featured',
				checkbox: {
					equals: true
				}
			}
		});

		return response.results.map((page: any) => {
			const name = page.properties.Name?.title[0]?.plain_text || 'Untitled';
			return {
				id: page.id,
				slug: slugify(name),
				name,
				// Fallback to a placeholder if the URL is empty
				thumbnail: page.properties.Thumbnail?.url || 'https://placehold.co/600x400/9333ea/white?text=No+Thumbnail',
				tags: (page.properties.Category?.multi_select || []).map((tag: any) => ({
					name: tag.name,
					icon: '' // You can map exact string names to Lucide icons later if you want!
				}))
			};
		});
	} catch (error) {
		console.error('Failed to fetch from Notion:', error);
		return getMockProjects();
	}
}

export async function getProjectBySlug(slug: string): Promise<{ project: Project; content: string } | null> {
    if (!env.NOTION_API_KEY || !env.NOTION_DATABASE_ID) {
        return { project: getMockProjects()[0], content: '# Mock Project\n\nPlease add Notion API keys to your `.env` file to fetch real data.' };
    }

	// Fetch all featured projects to find the matching slug
	const response = await notion.databases.query({
		database_id: env.NOTION_DATABASE_ID,
		filter: {
			property: 'Featured',
			checkbox: {
				equals: true
			}
		}
	});

	// Find the specific page that matches our slugified URL
	const page = response.results.find((p: any) => {
		const pName = p.properties.Name?.title[0]?.plain_text || '';
		return slugify(pName) === slug;
	}) as any;

	if (!page) return null;

	const name = page.properties.Name?.title[0]?.plain_text || 'Untitled';
	const project: Project = {
		id: page.id,
		slug,
		name,
		thumbnail: page.properties.Thumbnail?.url || 'https://placehold.co/600x400/9333ea/white?text=No+Thumbnail',
		tags: (page.properties.Category?.multi_select || []).map((tag: any) => ({ name: tag.name, icon: '' }))
	};

	// Convert the Notion Block AST into raw Markdown!
	const mdblocks = await n2m.pageToMarkdown(page.id);
	const content = n2m.toMarkdownString(mdblocks);

	return {
		project,
		content: content.parent || ''
	};
}

function getMockProjects(): Project[] {
	return [
		{
			id: '1',
			slug: 'e-commerce-platform',
			name: 'E-Commerce Platform (Mock)',
			thumbnail: 'https://placehold.co/400x400/9333ea/white?text=E-Commerce',
			tags: [
				{ name: 'React', icon: 'logos:react' },
				{ name: 'Node.js', icon: 'logos:nodejs-icon' }
			]
		}
	];
}
