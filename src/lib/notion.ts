import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { env } from '$env/dynamic/private';

// Initialize the Notion client with a fallback empty string for dev environments without keys
const notion = new Client({ auth: env.NOTION_API_KEY || '' });
const n2m = new NotionToMarkdown({ notionClient: notion });

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
	'Supabase': 'logos:supabase-icon'
};

const THUMBNAIL_COLORS = ['9333ea', 'f59e0b', '10b981', 'ef4444', '3b82f6'];

export interface Project {
	id: string;
	slug: string;
	name: string;
	featured: boolean;
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
			database_id: env.NOTION_DATABASE_ID
		});

		return response.results.map((page: any) => {
			const name = page.properties.Name?.title[0]?.plain_text || 'Untitled';
			const color = THUMBNAIL_COLORS[name.length % THUMBNAIL_COLORS.length];
			const placeholder = `https://placehold.co/600x400/${color}/white?text=${encodeURIComponent(name)}`;
			
			return {
				id: page.id,
				slug: slugify(name),
				name,
				featured: page.properties.Featured?.checkbox || false,
				thumbnail: page.properties.Thumbnail?.url || placeholder,
				tags: (page.properties.Category?.multi_select || []).map((tag: any) => ({
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
		return slugify(pName) === slug;
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
		tags: (page.properties.Category?.multi_select || []).map((tag: any) => ({ 
			name: tag.name, 
			icon: ICON_MAP[tag.name] || '' 
		}))
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
			featured: true,
			thumbnail: 'https://placehold.co/400x400/9333ea/white?text=E-Commerce',
			tags: [
				{ name: 'React', icon: 'logos:react' },
				{ name: 'Node.js', icon: 'logos:nodejs-icon' }
			]
		}
	];
}
