<script lang="ts">
	import { onMount } from 'svelte';
	import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import XIcon from '@lucide/svelte/icons/x';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { movable, type MoveDetail } from '$lib/actions/movable';
	import type { Course, CourseRelation } from '$lib/coursework';
	import type { Simulation, SimulationLinkDatum, SimulationNodeDatum } from 'd3-force';

	type GraphNode = Course & SimulationNodeDatum;
	type GraphLink = SimulationLinkDatum<GraphNode> & {
		id: string;
		source: string | GraphNode;
		target: string | GraphNode;
	};

	type GraphTransform = { x: number; y: number; scale: number };
	type EntranceMode = 'distributed' | 'explosion';
	type LabelMode = 'code' | 'title';
	type PanInteraction = {
		pointerId: number;
		startX: number;
		startY: number;
		originX: number;
		originY: number;
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
	let releasingId = $state<string | null>(null);
	let entranceMode = $state<EntranceMode>('distributed');
	let labelMode = $state<LabelMode>('code');
	let labelTextSize = $state(10);
	let wrapTitles = $state(false);
	let panInteraction: PanInteraction | null = null;
	let hoverCloseTimer: number | undefined;
	let releaseTimer: number | undefined;
	let prefersReducedMotion = false;

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
	const preferencesKey = 'coursework-graph-preferences';
	const minimumLabelTextSize = 8;
	const maximumLabelTextSize = 18;
	const labelLineLimit = 20;
	const labelLineHeight = 1.15;

	function normalizeLabelTextSize(value: number): number {
		return Math.min(maximumLabelTextSize, Math.max(minimumLabelTextSize, Math.round(value)));
	}

	function loadPreferences(): void {
		try {
			const saved = JSON.parse(window.localStorage.getItem(preferencesKey) ?? '{}') as Record<
				string,
				unknown
			>;
			if (saved.entranceMode === 'distributed' || saved.entranceMode === 'explosion') {
				entranceMode = saved.entranceMode;
			}
			if (saved.labelMode === 'code' || saved.labelMode === 'title') {
				labelMode = saved.labelMode;
			}
			if (typeof saved.labelTextSize === 'number' && Number.isFinite(saved.labelTextSize)) {
				labelTextSize = normalizeLabelTextSize(saved.labelTextSize);
			}
			if (typeof saved.wrapTitles === 'boolean') wrapTitles = saved.wrapTitles;
		} catch {
			// Ignore unavailable storage and malformed user preferences.
		}
	}

	function savePreferences(): void {
		try {
			window.localStorage.setItem(
				preferencesKey,
				JSON.stringify({ entranceMode, labelMode, labelTextSize, wrapTitles })
			);
		} catch {
			// Settings remain available for the current page when storage is unavailable.
		}
	}

	function colorFor(course: Course): string {
		const categoryIndex = Math.max(0, categories.indexOf(course.categories[0]));
		return categoryPalette[categoryIndex % categoryPalette.length];
	}

	function labelFor(course: Course): string {
		return labelMode === 'title' ? course.name : course.number;
	}

	function wrapLabel(label: string): string[] {
		const words = label.trim().split(/\s+/);
		const lines: string[] = [];
		let line = '';

		for (const word of words) {
			const nextLine = line ? `${line} ${word}` : word;
			if (line && nextLine.length > labelLineLimit) {
				lines.push(line);
				line = word;
			} else {
				line = nextLine;
			}
		}

		if (line) lines.push(line);
		return lines.length ? lines : [''];
	}

	function labelLinesFor(course: Course): string[] {
		const label = labelFor(course);
		return labelMode === 'title' && wrapTitles ? wrapLabel(label) : [label];
	}

	function labelY(course: Course): number {
		return -9 - (labelLinesFor(course).length - 1) * labelTextSize * labelLineHeight;
	}

	function wrappedLabelHorizontalRadius(course: Course): number {
		const longestLine = Math.max(...labelLinesFor(course).map((line) => line.length));
		return Math.max(30 * (labelTextSize / 10), longestLine * labelTextSize * 0.26 + 6);
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

	function initialPosition(course: Course, index: number): { x: number; y: number; vx?: number; vy?: number } {
		if (entranceMode === 'distributed') return categoryAnchor(course.categories[0], index);
		const angle = index * Math.PI * (3 - Math.sqrt(5));
		const radius = 4 + (index % 5) * 1.5;
		return {
			x: width / 2 + Math.cos(angle) * radius,
			y: height / 2 + Math.sin(angle) * radius,
			vx: Math.cos(angle) * 2,
			vy: Math.sin(angle) * 2
		};
	}

	function collisionRadius(node: GraphNode): number {
		const textScale = labelTextSize / 10;
		if (labelMode === 'code') return 24 * textScale;
		if (wrapTitles) {
			const lines = labelLinesFor(node);
			const verticalRadius = 18 + lines.length * labelTextSize * labelLineHeight;
			return Math.max(wrappedLabelHorizontalRadius(node), verticalRadius);
		}
		return Math.min(90, Math.max(30, node.name.length * 2.2)) * textScale;
	}

	function createCollisionForce() {
		return forceCollide<GraphNode>().radius(collisionRadius).strength(0.9);
	}

	function clampNodesToCanvas(simulationNodes: GraphNode[]): void {
		for (const node of simulationNodes) {
			const lineCount = labelLinesFor(node).length;
			const horizontalInset =
				labelMode === 'title' && wrapTitles ? wrappedLabelHorizontalRadius(node) : 30;
			const topInset = Math.max(
				28,
				12 + labelTextSize + (lineCount - 1) * labelTextSize * labelLineHeight
			);
			node.x = Math.max(
				horizontalInset,
				Math.min(width - horizontalInset, node.x ?? width / 2)
			);
			node.y = Math.max(topInset, Math.min(height - 20, node.y ?? height / 2));
		}
	}

	function createSimulation(reducedMotion: boolean): void {
		cancelNodeRelease();
		simulation?.stop();

		const simulationNodes = courses.map((course, index) => {
			const position = initialPosition(course, index);
			return { ...course, ...position } satisfies GraphNode;
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
			.force('collision', createCollisionForce())
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

	function selectEntranceMode(mode: EntranceMode): void {
		entranceMode = mode;
		transform = { x: 0, y: 0, scale: 1 };
		pinnedId = null;
		hoverId = null;
		savePreferences();
		createSimulation(prefersReducedMotion);
	}

	function selectLabelMode(mode: LabelMode): void {
		if (labelMode === mode) return;
		labelMode = mode;
		savePreferences();
		simulation?.force('collision', createCollisionForce()).alpha(0.4).restart();
	}

	function toggleTitleWrapping(): void {
		wrapTitles = !wrapTitles;
		savePreferences();
		simulation?.force('collision', createCollisionForce()).alpha(0.4).restart();
	}

	function applyLabelTextSize(nextSize: number): void {
		if (nextSize === labelTextSize) return;
		labelTextSize = nextSize;
		savePreferences();
		simulation?.force('collision', createCollisionForce()).alpha(0.35).restart();
	}

	function previewLabelTextSize(event: Event): void {
		const value = (event.currentTarget as HTMLInputElement).valueAsNumber;
		if (
			!Number.isInteger(value) ||
			value < minimumLabelTextSize ||
			value > maximumLabelTextSize
		) {
			return;
		}
		applyLabelTextSize(value);
	}

	function commitLabelTextSize(event: Event): void {
		const input = event.currentTarget as HTMLInputElement;
		const nextSize = Number.isFinite(input.valueAsNumber)
			? normalizeLabelTextSize(input.valueAsNumber)
			: labelTextSize;
		input.value = String(nextSize);
		applyLabelTextSize(nextSize);
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
		panInteraction = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			originX: transform.x,
			originY: transform.y
		};
		svgElement.setPointerCapture(event.pointerId);
	}

	function beginNodeMove(node: GraphNode): void {
		cancelNodeRelease();
		const simulationNode = simulation?.nodes().find((candidate) => candidate.id === node.id) ?? node;
		simulationNode.fx = simulationNode.x;
		simulationNode.fy = simulationNode.y;
	}

	function moveNode(node: GraphNode, movement: MoveDetail): void {
		const simulationNode = simulation?.nodes().find((candidate) => candidate.id === node.id) ?? node;
		const nextX = Math.max(
			30,
			Math.min(
				width - 30,
				(simulationNode.fx ?? simulationNode.x ?? 0) + movement.dx / transform.scale
			)
		);
		const nextY = Math.max(
			28,
			Math.min(
				height - 20,
				(simulationNode.fy ?? simulationNode.y ?? 0) + movement.dy / transform.scale
			)
		);

		simulationNode.x = nextX;
		simulationNode.y = nextY;
		simulationNode.fx = nextX;
		simulationNode.fy = nextY;
		nodes = [...(simulation?.nodes() ?? nodes)];
		simulation?.alphaTarget(0.12).restart();
	}

	function endNodeMove(node: GraphNode, moved: boolean): void {
		const simulationNode = simulation?.nodes().find((candidate) => candidate.id === node.id) ?? node;
		if (!moved) {
			simulationNode.fx = null;
			simulationNode.fy = null;
			simulation?.alphaTarget(0);
			pinnedId = pinnedId === node.id ? null : node.id;
			return;
		}

		const activeSimulation = simulation;
		releasingId = node.id;
		simulationNode.vx = 0;
		simulationNode.vy = 0;
		activeSimulation?.alpha(0.22).alphaTarget(0.07).restart();
		releaseTimer = window.setTimeout(() => {
			if (simulation !== activeSimulation || releasingId !== node.id) return;
			simulationNode.fx = null;
			simulationNode.fy = null;
			simulationNode.vx = 0;
			simulationNode.vy = 0;
			releasingId = null;
			releaseTimer = undefined;
			activeSimulation?.alphaTarget(0).alpha(0.14).restart();
		}, 140);
	}

	function cancelNodeRelease(): void {
		if (releaseTimer !== undefined) window.clearTimeout(releaseTimer);
		releaseTimer = undefined;
		if (releasingId) {
			const releasingNode = simulation?.nodes().find((candidate) => candidate.id === releasingId);
			if (releasingNode) {
				releasingNode.fx = null;
				releasingNode.fy = null;
			}
		}
		releasingId = null;
	}

	function movePointer(event: PointerEvent): void {
		if (!panInteraction || panInteraction.pointerId !== event.pointerId) return;
		transform = {
			...transform,
			x: panInteraction.originX + event.clientX - panInteraction.startX,
			y: panInteraction.originY + event.clientY - panInteraction.startY
		};
	}

	function endPointer(event: PointerEvent): void {
		if (!svgElement) return;
		if (!panInteraction || panInteraction.pointerId !== event.pointerId) return;
		if (svgElement.hasPointerCapture(event.pointerId)) svgElement.releasePointerCapture(event.pointerId);
		panInteraction = null;
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
		const initialBounds = root.getBoundingClientRect();
		width = Math.max(320, initialBounds.width);
		height = Math.max(460, initialBounds.height);
		prefersReducedMotion = mediaQuery.matches;
		loadPreferences();
		const resizeObserver = new ResizeObserver(([entry]) => {
			width = Math.max(320, entry.contentRect.width);
			height = Math.max(460, entry.contentRect.height);
			updateSimulationBounds();
		});
		resizeObserver.observe(root);
		createSimulation(prefersReducedMotion);
		svg.addEventListener('wheel', handleWheel, { passive: false });

		const handleWindowKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				pinnedId = null;
				hoverId = null;
			}
		};
		window.addEventListener('keydown', handleWindowKeydown);
		window.addEventListener('pointermove', movePointer);
		window.addEventListener('pointerup', endPointer);
		window.addEventListener('pointercancel', endPointer);

		return () => {
			cancelNodeRelease();
			simulation?.stop();
			resizeObserver.disconnect();
			svg.removeEventListener('wheel', handleWheel);
			window.removeEventListener('keydown', handleWindowKeydown);
			window.removeEventListener('pointermove', movePointer);
			window.removeEventListener('pointerup', endPointer);
			window.removeEventListener('pointercancel', endPointer);
			if (hoverCloseTimer !== undefined) window.clearTimeout(hoverCloseTimer);
		};
	});
</script>

<Card.Root class="graph-frame gap-0 py-0 shadow-xl">
	<div
		class="graph-surface"
		data-entrance-mode={entranceMode}
		data-label-mode={labelMode}
		data-label-size={labelTextSize}
		data-wrap-titles={wrapTitles}
		style={`--course-label-size: ${labelTextSize}px`}
		bind:this={graphRoot}
	>
		<svg
			bind:this={svgElement}
			viewBox={`0 0 ${width} ${height}`}
			data-label-size={labelTextSize}
			role="img"
			aria-label="Course relationship map"
			aria-describedby="coursework-svg-description"
			onpointerdown={beginPan}
		>
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
							data-releasing={releasingId === node.id ? 'true' : undefined}
							class="course-node"
							class:active={node.id === activeId}
							class:related={Boolean(activeId) && node.id !== activeId && isAdjacent(node.id)}
							class:quiet={Boolean(activeId) && !isAdjacent(node.id)}
							transform={`translate(${node.x ?? 0} ${node.y ?? 0})`}
							role="button"
							tabindex="0"
							aria-label={`${node.number}, ${node.name}`}
							aria-pressed={pinnedId === node.id}
							use:movable={{
								onMoveStart: () => beginNodeMove(node),
								onMove: (movement) => moveNode(node, movement),
								onMoveEnd: ({ moved }) => endNodeMove(node, moved)
							}}
							onpointerenter={() => showHover(node.id)}
							onpointerleave={scheduleHoverClose}
							onfocus={() => (focusId = node.id)}
							onblur={() => (focusId = null)}
							onkeydown={(event) => handleNodeKeydown(event, node.id)}
						>
							<circle class="node-hit" r="14"></circle>
							<circle class="node-dot" r="4" fill={colorFor(node)}></circle>
							<text y={labelY(node)} text-anchor="middle">
								{#each labelLinesFor(node) as line, lineIndex}
									<tspan x="0" dy={lineIndex === 0 ? 0 : `${labelLineHeight}em`}>{line}</tspan>
								{/each}
							</text>
						</g>
					{/each}
				</g>
			</g>
		</svg>

		<Dialog.Root>
			<Dialog.Trigger
				class={`${buttonVariants({ variant: 'ghost', size: 'icon' })} graph-settings-trigger`}
				aria-label="Graph settings"
			>
				<SlidersHorizontalIcon />
			</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-sm">
				<Dialog.Header>
					<Dialog.Title>Graph settings</Dialog.Title>
					<Dialog.Description class="sr-only">
						Configure the graph entrance and course labels.
					</Dialog.Description>
				</Dialog.Header>

				<div class="grid gap-5">
					<fieldset class="grid gap-2">
						<legend class="text-sm font-medium">Entrance</legend>
						<div class="grid grid-cols-2 gap-2">
							<Button
								variant={entranceMode === 'distributed' ? 'default' : 'outline'}
								size="sm"
								aria-pressed={entranceMode === 'distributed'}
								onclick={() => selectEntranceMode('distributed')}
							>
								Distributed
							</Button>
							<Button
								variant={entranceMode === 'explosion' ? 'default' : 'outline'}
								size="sm"
								aria-pressed={entranceMode === 'explosion'}
								onclick={() => selectEntranceMode('explosion')}
							>
								Explosion
							</Button>
						</div>
					</fieldset>

					<fieldset class="grid gap-2">
						<legend class="text-sm font-medium">Labels</legend>
						<div class="grid grid-cols-2 gap-2">
							<Button
								variant={labelMode === 'code' ? 'default' : 'outline'}
								size="sm"
								aria-pressed={labelMode === 'code'}
								onclick={() => selectLabelMode('code')}
							>
								Course code
							</Button>
							<Button
								variant={labelMode === 'title' ? 'default' : 'outline'}
								size="sm"
								aria-pressed={labelMode === 'title'}
								onclick={() => selectLabelMode('title')}
							>
								Course title
							</Button>
						</div>
						<div class="mt-1 grid grid-cols-[1fr_auto] items-center gap-3">
							<span class="text-sm">Wrap titles</span>
							<Button
								variant={wrapTitles ? 'default' : 'outline'}
								size="sm"
								class="w-20"
								aria-label="Wrap titles"
								aria-pressed={wrapTitles}
								onclick={toggleTitleWrapping}
							>
								{wrapTitles ? 'On' : 'Off'}
							</Button>
						</div>
					</fieldset>

					<div class="grid grid-cols-[1fr_auto] items-center gap-3">
						<label for="coursework-label-size" class="text-sm font-medium">Text size</label>
						<div class="flex items-center gap-2">
							<input
								id="coursework-label-size"
								type="number"
								min={minimumLabelTextSize}
								max={maximumLabelTextSize}
								step="1"
								value={labelTextSize}
								oninput={previewLabelTextSize}
								onchange={commitLabelTextSize}
								class="h-8 w-20 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
							/>
							<span class="text-xs text-muted-foreground" aria-hidden="true">px</span>
						</div>
					</div>
				</div>
			</Dialog.Content>
		</Dialog.Root>

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
		width: 100%;
		aspect-ratio: 1;
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
		font-size: var(--course-label-size, 10px);
		font-weight: 400;
		pointer-events: none;
		transition: opacity 180ms ease, font-weight 180ms ease;
	}

	:global(.graph-settings-trigger) {
		position: absolute;
		right: 0.75rem;
		bottom: 0.75rem;
		z-index: 10;
		width: 2rem;
		height: 2rem;
		opacity: 0;
		color: var(--muted-foreground);
		transition: opacity 160ms ease;
	}

	:global(.graph-settings-trigger:hover),
	:global(.graph-settings-trigger:focus-visible),
	:global(.graph-settings-trigger[data-state='open']) {
		opacity: 1;
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
			aspect-ratio: auto;
			height: clamp(580px, 78vh, 720px);
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
