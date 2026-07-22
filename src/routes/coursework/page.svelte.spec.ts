import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';
import type { Course, CourseRelation } from '$lib/coursework';

const courses: Course[] = [
	{
		id: 'CS 1000',
		number: 'CS 1000',
		name: 'Foundations',
		categories: ['Computing'],
		description: '',
		coreContent: [],
		iconId: '',
		prerequisites: [],
		featured: false
	},
	{
		id: 'CS 2000',
		number: 'CS 2000',
		name: 'Systems',
		categories: ['Computing'],
		description: 'Systems course details.',
		coreContent: [],
		iconId: '',
		prerequisites: [],
		featured: false
	}
];

const relations: CourseRelation[] = [
	{ id: 'CS 1000--CS 2000', source: 'CS 1000', target: 'CS 2000' }
];

describe('/coursework/+page.svelte', () => {
	it('renders the graph and exposes course details through pointer and keyboard interaction', async () => {
		window.localStorage.removeItem('coursework-graph-preferences');
		render(Page, { data: { courses, relations, categories: ['Computing'] }, params: {} });

		await expect.element(page.getByRole('heading', { level: 1, name: 'Coursework' })).toBeVisible();
		await expect.element(page.getByRole('img', { name: 'Course relationship map' })).toBeVisible();
		expect(document.querySelector('svg title')).toBeNull();
		expect(document.querySelectorAll('[data-course-node]')).toHaveLength(2);
		expect(document.querySelectorAll('[data-course-relation]')).toHaveLength(1);
		expect(document.querySelector('[aria-label="Course categories"]')).toBeNull();
		await expect
			.element(page.getByText('Drag to rearrange', { exact: false }))
			.not.toBeInTheDocument();

		const foundations = page.getByRole('button', { name: 'CS 1000, Foundations' });
		await foundations.hover();
		await expect.element(page.getByRole('region', { name: 'CS 1000 details' })).toBeVisible();
		await expect.element(page.getByText('CS 1000 · Computing')).toBeVisible();

		(foundations.element() as SVGGElement).focus();
		foundations
			.element()
			.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		await expect.element(foundations).toHaveAttribute('aria-pressed', 'true');

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		await expect.element(foundations).toHaveAttribute('aria-pressed', 'false');

		await page.getByRole('button', { name: 'Graph settings' }).click();
		await expect.element(page.getByRole('heading', { name: 'Graph settings' })).toBeVisible();
		await page.getByRole('button', { name: 'Course title' }).click();
		expect(document.querySelector('[data-course-node="CS 1000"] text')?.textContent?.trim()).toBe(
			'Foundations'
		);
		await expect.element(page.getByRole('button', { name: 'Course title' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await page.getByRole('button', { name: 'Explosion' }).click();
		await expect.element(page.getByRole('button', { name: 'Explosion' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		expect(document.querySelector('.graph-surface')?.getAttribute('data-entrance-mode')).toBe(
			'explosion'
		);
	});
});
