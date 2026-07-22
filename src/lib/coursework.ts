import { csvParse } from 'd3-dsv';

export type Course = {
	id: string;
	number: string;
	name: string;
	categories: string[];
	description: string;
	coreContent: string[];
	iconId: string;
	prerequisites: string[];
	featured: boolean;
};

export type CourseRelation = {
	id: string;
	source: string;
	target: string;
};

export type CourseworkGraph = {
	courses: Course[];
	relations: CourseRelation[];
	categories: string[];
};

type CsvCourse = Record<string, string>;

function splitList(value: string): string[] {
	return value
		.split(/\r?\n|;/)
		.map((item) => item.trim().replace(/^[-*\u2022]\s*/, '').trim())
		.filter(Boolean);
}

function splitCommaList(value: string): string[] {
	return value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
}

function relationNames(value: string): string[] {
	const names: string[] = [];
	const relationPattern = /(?:^|,\s*)(.*?)\s*\(https?:\/\/[^)]+\)/g;
	let match: RegExpExecArray | null;

	while ((match = relationPattern.exec(value)) !== null) {
		if (match[1].trim()) names.push(match[1].trim());
	}

	return names;
}

function relationId(source: string, target: string): string {
	return [source, target].sort().join('--');
}

export function parseCourseworkCsv(source: string): CourseworkGraph {
	const rows = csvParse(source.replace(/^\uFEFF/, '')) as CsvCourse[];
	const courseRows = rows.filter((row) => row['Course Number']?.trim());

	const courses = courseRows.map((row) => ({
		id: row['Course Number'].trim(),
		number: row['Course Number'].trim(),
		name: row['Name']?.trim() ?? '',
		categories: splitCommaList(row['Category'] ?? ''),
		description: row['Description']?.trim() ?? '',
		coreContent: splitList(row['Core Course Content (bullet points)'] ?? ''),
		iconId: row['Icon ID']?.trim() ?? '',
		prerequisites: splitCommaList(row['Prerequisites (Course Number)'] ?? ''),
		featured: row['Featured']?.trim().toLowerCase() === 'yes'
	}));

	const idByName = new Map(courses.map((course) => [course.name, course.id]));
	const relationById = new Map<string, CourseRelation>();

	for (const row of courseRows) {
		const sourceId = row['Course Number'].trim();

		for (const relatedName of relationNames(row['Manual Relation'] ?? '')) {
			const targetId = idByName.get(relatedName);
			if (!targetId || targetId === sourceId) continue;

			const [source, target] = [sourceId, targetId].sort();
			const id = relationId(source, target);
			relationById.set(id, { id, source, target });
		}
	}

	return {
		courses,
		relations: [...relationById.values()],
		categories: [...new Set(courses.flatMap((course) => course.categories))]
	};
}
