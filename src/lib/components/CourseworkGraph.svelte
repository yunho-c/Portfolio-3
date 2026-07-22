<script lang="ts">
	import { onMount } from 'svelte';
	import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force';
	import XIcon from '@lucide/svelte/icons/x';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { Course, CourseRelation } from '$lib/coursework';
	import type { Simulation, SimulationLinkDatum, SimulationNodeDatum } from 'd3-force';

	type GraphNode = Course & SimulationNodeDatum;
	type GraphLink = SimulationLinkDatum<GraphNode> & {
		id: string;
		source: string | GraphNode;
		target: string | GraphNode;
	};

	type GraphTransform = { x: number; y: number; scale: number };
	type PointerInteraction = {
		type: 'pan' | 'node';
		pointerId: number;
		startX: number;
		startY: number;
		originX: number;
		originY: number;
		node?: GraphNode;
		moved: boolean;
	};

	let {
		courses,
		relations,
		categories
	}: { courses: Course[]; relations: CourseRelation[]; categories: string[] } = $props();

	let graphRoot = $state<HTMLDivElement>();
	let svgElement = $state<SVGSVGElement>();
	let width = $state(960);
	let height = $state(620);
	let nodes = $state<GraphNode[]>([]);
	let links = $state<GraphLink[]>([]);
	let simulation: Simulation<GraphNode, GraphLink> | undefined;
	let transform = $state<GraphTransform>({ x: 0, y: 0, scale: 1 });
	let hoverId = $state<string | null>(null);
	let focusId = $state<string | null>(null);
	let pinnedId = $state<string | null>(null);
	let interaction: PointerInteraction | null = null;
	let hoverCloseTimer: number | undefined;

	let activeId = $derived(pinnedId ?? focusId ?? hoverId);
	let activeCourse = $derived(courses.find((course) => course.id === activeId) ?? null);
	let activeNode = $derived(nodes.find((node) => node.id === activeId) ?? null);
	let cardStyle = $derived(getCardStyle(activeNode));

	const categoryPalette = [
		'#1f77b4',
		'#ff7f0e',
		'#2ca02c',
		'#d62728',
		'#9467bd',
		'#8c564b',
		'#e377c2',
		'#7f7f7f',
		'#bcbd22',
		'#17becf'
	];

	function colorFor(course: Course): string {
		const categoryIndex = Math.max(0, categories.indexOf(course.categories[0]));
		return categoryPalette[categoryIndex % categoryPalette.length];
	}

	function nodeId(node: string | GraphNode): string {
		return typeof node === 'string' ? node : node.id;
	}

	function isAdjacent(id: string): boolean {
		if (!activeId || id === activeId) return true;
		return relations.some(
			(relation) =>
				(relation.source === activeId && relation.target === id) ||
				(relation.target === activeId && relation.source === id)
		);
	}

	function isActiveLink(link: GraphLink): boolean {
		return Boolean(
			activeId && (nodeId(link.source) === activeId || nodeId(link.target) === activeId)
		);
	}

	function getCardStyle(node: GraphNode | null): string {
		if (!node || node.x === undefined || node.y === undefined) return '';
		const cardWidth = 260;
		const left = Math.min(
			Math.max(16, node.x * transform.scale + transform.x + 24),
			Math.max(16, width - cardWidth - 16)
		);
		const top = Math.min(
			Math.max(16, node.y * transform.scale + transform.y + 18),
			Math.max(16, height - 180)
		);
		return `left: ${left}px; top: ${top}px;`;
	}

	function categoryAnchor(category: string, index: number): { x: number; y: number } {
		const categoryIndex = Math.max(0, categories.indexOf(category));
		const angle = (categoryIndex / Math.max(categories.length, 1)) * Math.PI * 2 - Math.PI / 2;
		const radius = Math.min(width, height) * 0.29;
		const jitter = ((index * 37) % 29) - 14;
		return {
			x: width / 2 + Math.cos(angle) * radius + jitter,
			y: height / 2 + Math.sin(angle) * radius - jitter
		};
	}

	function clampNodesToCanvas(simulationNodes: GraphNode[]): void {
		for (const node of simulationNodes) {
			node.x = Math.max(30, Math.min(width - 30, node.x ?? width / 2));
			node.y = Math.max(28, Math.min(height - 20, node.y ?? height / 2));
		}
	}

	function createSimulation(reducedMotion: boolean): void {
		simulation?.stop();

		const simulationNodes = courses.map((course, index) => {
			const anchor = categoryAnchor(course.categories[0], index);
			return { ...course, x: anchor.x, y: anchor.y } satisfies GraphNode;
		});
		const simulationLinks = relations.map((relation) => ({ ...relation })) as GraphLink[];

		nodes = simulationNodes;
		links = simulationLinks;
		simulation = forceSimulation<GraphNode>(simulationNodes)
			.force(
				'link',
				forceLink<GraphNode, GraphLink>(simulationLinks)
					.id((node) => node.id)
					.distance(102)
					.strength(0.42)
			)
			.force('charge', forceManyBody<GraphNode>().strength(-300).distanceMax(380))
			.force('center', forceCenter(width / 2, height / 2).strength(0.7))
			.force('collision', forceCollide<GraphNode>().radius(24).strength(0.9))
			.force(
				'category-x',
				forceX<GraphNode>((node) => categoryAnchor(node.categories[0], courses.indexOf(node)).x).strength(
					0.055
				)
			)
			.force(
				'category-y',
				forceY<GraphNode>((node) => categoryAnchor(node.categories[0], courses.indexOf(node)).y).strength(
					0.055
				)
			)
			.on('tick', () => {
				clampNodesToCanvas(simulationNodes);
				nodes = [...simulationNodes];
				links = [...simulationLinks];
			});

		if (reducedMotion) {
			simulation.stop();
			for (let index = 0; index < 280; index += 1) simulation.tick();
			clampNodesToCanvas(simulationNodes);
			nodes = [...simulationNodes];
			links = [...simulationLinks];
		}
	}

	function updateSimulationBounds(): void {
		if (!simulation) return;
		(simulation.force('center') as ReturnType<typeof forceCenter>)
			.x(width / 2)
			.y(height / 2);
		simulation.alpha(0.35).restart();
	}

	function zoomTo(nextScale: number, originX = width / 2, originY = height / 2): void {
		const scale = Math.min(2.2, Math.max(0.55, nextScale));
		const ratio = scale / transform.scale;
		transform = {
			x: originX - (originX - transform.x) * ratio,
			y: originY - (originY - transform.y) * ratio,
			scale
		};
	}

	function handleWheel(event: WheelEvent): void {
		if (!svgElement) return;
		event.preventDefault();
		const bounds = svgElement.getBoundingClientRect();
		zoomTo(
			transform.scale * Math.exp(-event.deltaY * 0.0015),
			event.clientX - bounds.left,
			event.clientY - bounds.top
		);
	}

	function beginPan(event: PointerEvent): void {
		if (!svgElement) return;
		if (!(event.target instanceof Element) || !event.target.hasAttribute('data-graph-background')) return;
		pinnedId = null;
		interaction = {
			type: 'pan',
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			originX: transform.x,
			originY: transform.y,
			moved: false
		};
		svgElement.setPointerCapture(event.pointerId);
	}

	function beginNodeDrag(event: PointerEvent, node: GraphNode): void {
		if (!svgElement) return;
		event.stopPropagation();
		node.fx = node.x;
		node.fy = node.y;
		simulation?.alphaTarget(0.16).restart();
		interaction = {
			type: 'node',
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			originX: node.x ?? 0,
			originY: node.y ?? 0,
			node,
			moved: false
		};
		svgElement.setPointerCapture(event.pointerId);
	}

	function movePointer(event: PointerEvent): void {
		if (!interaction || interaction.pointerId !== event.pointerId) return;
		const deltaX = event.clientX - interaction.startX;
		const deltaY = event.clientY - interaction.startY;
		if (Math.hypot(deltaX, deltaY) > 4) interaction.moved = true;

		if (interaction.type === 'pan') {
			transform = {
				...transform,
				x: interaction.originX + deltaX,
				y: interaction.originY + deltaY
			};
		} else if (interaction.node) {
			interaction.node.fx = interaction.originX + deltaX / transform.scale;
			interaction.node.fy = interaction.originY + deltaY / transform.scale;
		}
	}

	function endPointer(event: PointerEvent): void {
		if (!svgElement) return;
		if (!interaction || interaction.pointerId !== event.pointerId) return;
		if (interaction.type === 'node' && interaction.node) {
			interaction.node.fx = null;
			interaction.node.fy = null;
			simulation?.alphaTarget(0);
			if (!interaction.moved) pinnedId = pinnedId === interaction.node.id ? null : interaction.node.id;
		}
		if (svgElement.hasPointerCapture(event.pointerId)) svgElement.releasePointerCapture(event.pointerId);
		interaction = null;
	}

	function showHover(id: string): void {
		if (hoverCloseTimer !== undefined) window.clearTimeout(hoverCloseTimer);
		hoverId = id;
	}

	function scheduleHoverClose(): void {
		if (hoverCloseTimer !== undefined) window.clearTimeout(hoverCloseTimer);
		hoverCloseTimer = window.setTimeout(() => {
			hoverId = null;
			hoverCloseTimer = undefined;
		}, 140);
	}

	function handleNodeKeydown(event: KeyboardEvent, id: string): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			pinnedId = pinnedId === id ? null : id;
		} else if (event.key === 'Escape') {
			pinnedId = null;
			hoverId = null;
			(event.currentTarget as SVGGElement).blur();
		}
	}

	onMount(() => {
		if (!graphRoot || !svgElement) return;
		const root = graphRoot;
		const svg = svgElement;
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		const resizeObserver = new ResizeObserver(([entry]) => {
			width = Math.max(320, entry.contentRect.width);
			height = Math.max(460, entry.contentRect.height);
			updateSimulationBounds();
		});
		resizeObserver.observe(root);
		createSimulation(mediaQuery.matches);
		svg.addEventListener('wheel', handleWheel, { passive: false });

		const handleWindowKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				pinnedId = null;
				hoverId = null;
			}
		};
		window.addEventListener('keydown', handleWindowKeydown);

		return () => {
			simulation?.stop();
			resizeObserver.disconnect();
			svg.removeEventListener('wheel', handleWheel);
			window.removeEventListener('keydown', handleWindowKeydown);
			if (hoverCloseTimer !== undefined) window.clearTimeout(hoverCloseTimer);
		};
	});
</script>

<Card.Root class="graph-frame gap-0 py-0 shadow-xl">
	<div class="graph-surface" bind:this={graphRoot}>
		<svg
			bind:this={svgElement}
			viewBox={`0 0 ${width} ${height}`}
			role="img"
			aria-labelledby="coursework-svg-title coursework-svg-description"
			onpointerdown={beginPan}
			onpointermove={movePointer}
			onpointerup={endPointer}
			onpointercancel={endPointer}
		>
			<title id="coursework-svg-title">Course relationship map</title>
			<desc id="coursework-svg-description">
				An interactive force-directed graph of {courses.length} courses. Each course can be
				focused or selected to reveal its details and related courses.
			</desc>
			<rect data-graph-background width="100%" height="100%" fill="transparent" />

			<g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
				<g class="graph-links" aria-hidden="true">
					{#each links as link (link.id)}
						<line
							data-course-relation={link.id}
							x1={(link.source as GraphNode).x ?? 0}
							y1={(link.source as GraphNode).y ?? 0}
							x2={(link.target as GraphNode).x ?? 0}
							y2={(link.target as GraphNode).y ?? 0}
							class:active={isActiveLink(link)}
							class:quiet={Boolean(activeId) && !isActiveLink(link)}
						></line>
					{/each}
				</g>

				<g class="graph-nodes">
					{#each nodes as node (node.id)}
						<g
							data-course-node={node.id}
							class="course-node"
							class:active={node.id === activeId}
							class:related={Boolean(activeId) && node.id !== activeId && isAdjacent(node.id)}
							class:quiet={Boolean(activeId) && !isAdjacent(node.id)}
							transform={`translate(${node.x ?? 0} ${node.y ?? 0})`}
							role="button"
							tabindex="0"
							aria-label={`${node.number}, ${node.name}`}
							aria-pressed={pinnedId === node.id}
							onpointerdown={(event) => beginNodeDrag(event, node)}
							onpointerenter={() => showHover(node.id)}
							onpointerleave={scheduleHoverClose}
							onfocus={() => (focusId = node.id)}
							onblur={() => (focusId = null)}
							onkeydown={(event) => handleNodeKeydown(event, node.id)}
						>
							<circle class="node-hit" r="14"></circle>
							<circle class="node-dot" r="4" fill={colorFor(node)}></circle>
							<text y="-9" text-anchor="middle">{node.number}</text>
						</g>
					{/each}
				</g>
			</g>
		</svg>

		{#if activeCourse}
			<Card.Root
				size="sm"
				class="course-card"
				style={cardStyle}
				role="region"
				aria-label={`${activeCourse.number} details`}
				onpointerenter={() => showHover(activeCourse.id)}
				onpointerleave={scheduleHoverClose}
			>
				<Card.Header
					class={activeCourse.description || activeCourse.coreContent.length ? 'border-b' : undefined}
				>
					<Card.Title>{activeCourse.name}</Card.Title>
					<Card.Description>
						{activeCourse.number}{activeCourse.categories.length
							? ` · ${activeCourse.categories.join(', ')}`
							: ''}
					</Card.Description>
					{#if pinnedId === activeCourse.id}
						<Card.Action>
							<Button
								variant="ghost"
								size="icon"
								class="size-7"
								onclick={() => (pinnedId = null)}
								aria-label="Close course details"
							>
								<XIcon />
							</Button>
						</Card.Action>
					{/if}
				</Card.Header>

				{#if activeCourse.description || activeCourse.coreContent.length}
					<Card.Content class="space-y-3">
					{#if activeCourse.description}
						<p class="text-sm leading-relaxed">{activeCourse.description}</p>
					{/if}

					{#if activeCourse.coreContent.length}
						<ul class="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
							{#each activeCourse.coreContent as item (item)}<li>{item}</li>{/each}
						</ul>
					{/if}
					</Card.Content>
				{/if}
			</Card.Root>
		{/if}
	</div>
</Card.Root>

<style>
	:global(.graph-frame) {
		overflow: hidden;
	}

	.graph-surface {
		position: relative;
		height: min(78vh, 760px);
		min-height: 620px;
		overflow: hidden;
		background: var(--card);
	}

	svg {
		display: block;
		width: 100%;
		height: 100%;
		cursor: grab;
		touch-action: none;
		user-select: none;
	}

	svg:active {
		cursor: grabbing;
	}

	.graph-links line {
		stroke: #999;
		stroke-width: 1.2;
		stroke-opacity: 0.8;
		transition: opacity 180ms ease, stroke 180ms ease, stroke-width 180ms ease;
	}

	.graph-links line.active {
		stroke: #555;
		stroke-width: 1.8;
		stroke-opacity: 1;
	}

	.graph-links line.quiet {
		opacity: 0.15;
	}

	.course-node {
		cursor: grab;
		outline: none;
		transition: opacity 180ms ease;
	}

	.course-node:active {
		cursor: grabbing;
	}

	.course-node.quiet {
		opacity: 0.35;
	}

	.node-hit {
		fill: transparent;
	}

	.node-dot {
		stroke: #fff;
		stroke-width: 1;
		transition: stroke 150ms ease, stroke-width 150ms ease, transform 150ms ease;
	}

	.course-node:hover .node-dot,
	.course-node:focus-visible .node-dot,
	.course-node.active .node-dot {
		stroke: #111;
		stroke-width: 2;
		transform: scale(1.25);
	}

	.course-node.related .node-dot {
		stroke: #ffd600;
		stroke-width: 2;
	}

	.course-node text {
		fill: #222;
		font-size: 10px;
		font-weight: 400;
		pointer-events: none;
		transition: opacity 180ms ease, font-weight 180ms ease;
	}

	.course-node.active text,
	.course-node.related text {
		font-weight: 700;
	}

	:global(.course-card) {
		position: absolute;
		z-index: 5;
		width: 16.25rem;
		max-height: min(70%, 22rem);
		overflow-y: auto;
	}

	@media (max-width: 767px) {
		:global(.graph-frame),
		.graph-surface {
			overflow: visible;
		}

		.graph-surface {
			height: 70vh;
			min-height: 520px;
		}

		:global(.course-card) {
			position: fixed;
			inset: auto 0.75rem 0.75rem !important;
			width: auto;
			max-height: min(45vh, 22rem);
			overflow-y: auto;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.graph-links line,
		.course-node,
		.node-dot,
		.course-node text {
			transition: none;
		}
	}

	:global(.dark) .course-node text {
		fill: #f4f4f5;
	}

	:global(.dark) .graph-links line {
		stroke: #71717a;
	}

	:global(.dark) .course-node:hover .node-dot,
	:global(.dark) .course-node:focus-visible .node-dot,
	:global(.dark) .course-node.active .node-dot {
		stroke: #fff;
	}
</style>
