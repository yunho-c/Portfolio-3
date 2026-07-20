import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { env } from '$env/dynamic/private';
import { renderNotionMediaBlock } from '$lib/notion-embeds';
import { normalizeNotionFoldables } from '$lib/notion-foldables';
import { filterNotionHiddenBlocks } from '$lib/notion-hidden-blocks';

// Initialize the Notion client with a fallback empty string for dev environments without keys
const notion = new Client({ auth: env.NOTION_API_KEY || '' });
const n2m = new NotionToMarkdown({ notionClient: notion });
n2m.setCustomTransformer('image', renderNotionMediaBlock);
n2m.setCustomTransformer('embed', renderNotionMediaBlock);
n2m.setCustomTransformer('video', renderNotionMediaBlock);

const ICON_MAP: Record<string, string> = {
	'React': 'logos:react',
	'Node.js': 'logos:nodejs-icon',
	'MongoDB': 'logos:mongodb-icon',
	'Vue.js': 'logos:vue',
	'TypeScript': 'logos:typescript-icon',
	'Svelte': 'logos:svelte-icon',
	'SvelteKit': 'logos:svelte-icon',
	'JavaScript': 'logos:javascript',
	'Next.js': 'logos:nextjs-icon',
	'PostgreSQL': 'logos:postgresql',
	'Python': 'logos:python',
	'PyTorch': 'logos:pytorch-icon',
	'C++': 'logos:c-plusplus',
	'ROS': 'logos:ros',
	'Docker': 'logos:docker-icon',
	'AWS': 'logos:aws',
	'GCP': 'logos:google-cloud',
	'Tailwind': 'logos:tailwindcss-icon',
	'Stripe': 'logos:stripe',
	'Supabase': 'logos:supabase-icon',
	'Unity': 'logos:unity',
	'WebRTC': 'logos:webrtc',
	'Flutter': 'logos:flutter',
	'Rust': 'logos:rust'
};

const THUMBNAIL_COLORS = ['9333ea', 'f59e0b', '10b981', 'ef4444', '3b82f6'];
const NOT_PUBLISHED_STATUS = 'Not published';

interface NotionProjectStatusPage {
	properties?: {
		Status?: {
			status?: {
				name?: string;
			} | null;
		};
	};
}

interface NotionProjectDescriptionPage {
	properties?: {
		'One-Liner'?: {
			rich_text?: Array<{
				plain_text?: string;
			}>;
		};
	};
}

export interface Project {
	id: string;
	slug: string;
	name: string;
	featured: boolean;
	thumbnail: string;
	description: string;
	tags: { name: string; icon: string }[];
}

// Utility to create clean URLs out of the Notion Project Names
function slugify(text: string) {
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export function isProjectPublished(page: unknown): boolean {
	const projectPage = page as NotionProjectStatusPage;
	return projectPage.properties?.Status?.status?.name !== NOT_PUBLISHED_STATUS;
}

export function getProjectDescription(page: unknown): string {
	const projectPage = page as NotionProjectDescriptionPage;
	return (
		projectPage.properties?.['One-Liner']?.rich_text
			?.map((part) => part.plain_text ?? '')
			.join('')
			.trim() ?? ''
	);
}

export async function getProjects(): Promise<Project[]> {
	if (!env.NOTION_API_KEY || !env.NOTION_DATABASE_ID) {
		console.warn('Missing Notion API keys. Returning mock projects.');
		return getMockProjects();
	}

	try {
		const response = await notion.databases.query({
			database_id: env.NOTION_DATABASE_ID
		});

		return response.results.filter(isProjectPublished).map((page: any) => {
			const name = page.properties.Name?.title[0]?.plain_text || 'Untitled';
			const color = THUMBNAIL_COLORS[name.length % THUMBNAIL_COLORS.length];
			const placeholder = `https://placehold.co/600x400/${color}/white?text=${encodeURIComponent(name)}`;
			
			return {
				id: page.id,
				slug: slugify(name),
				name,
				featured: page.properties.Featured?.checkbox || false,
				thumbnail: page.properties.Thumbnail?.url || placeholder,
				description: getProjectDescription(page),
				tags: (page.properties['Tech Stack']?.multi_select || []).map((tag: any) => ({
					name: tag.name,
					icon: ICON_MAP[tag.name] || ''
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

	// Fetch all projects to find the matching slug
	const response = await notion.databases.query({
		database_id: env.NOTION_DATABASE_ID
	});

	// Find the specific page that matches our slugified URL
	const page = response.results.find((p: any) => {
		const pName = p.properties.Name?.title[0]?.plain_text || '';
		return isProjectPublished(p) && slugify(pName) === slug;
	}) as any;

	if (!page) return null;

	const name = page.properties.Name?.title[0]?.plain_text || 'Untitled';
	const color = THUMBNAIL_COLORS[name.length % THUMBNAIL_COLORS.length];
	const placeholder = `https://placehold.co/600x400/${color}/white?text=${encodeURIComponent(name)}`;
	
	const project: Project = {
		id: page.id,
		slug,
		name,
		featured: page.properties.Featured?.checkbox || false,
		thumbnail: page.properties.Thumbnail?.url || placeholder,
		description: getProjectDescription(page),
		tags: (page.properties['Tech Stack']?.multi_select || []).map((tag: any) => ({ 
			name: tag.name, 
			icon: ICON_MAP[tag.name] || '' 
		}))
	};

	// Convert the Notion Block AST into raw Markdown!
	const mdblocks = normalizeNotionFoldables(
		filterNotionHiddenBlocks(await n2m.pageToMarkdown(page.id))
	);
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
			featured: true,
			thumbnail: 'https://placehold.co/400x400/9333ea/white?text=E-Commerce',
			description: 'A mock storefront demonstrating the project-card layout.',
			tags: [
				{ name: 'React', icon: 'logos:react' },
				{ name: 'Node.js', icon: 'logos:nodejs-icon' }
			]
		}
	];
}
