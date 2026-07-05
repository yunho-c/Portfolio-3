<script lang="ts">
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';

	type Experience = {
		organization: string;
		title: string;
		location: string;
		period: string;
		summary: string;
		bullets: string[];
		tags: string[];
	};

	const experiences: Experience[] = [
		{
			organization: 'Qualcomm',
			title: 'XR Systems Engineering Intern',
			location: 'San Diego, CA',
			period: 'May 2026 - Current',
			summary:
				'Evaluating the systems behavior of ultra-low-power GPU paths inside XR device SoCs.',
			bullets: [
				'Run capability evaluation and performance analysis for GPU workloads in VR/AR device contexts.',
				'Connect hardware constraints, graphics performance, and XR product requirements into practical system findings.'
			],
			tags: ['XR', 'GPU systems', 'SoC', 'Performance']
		},
		{
			organization: 'Tesla',
			title: 'Computer Vision Intern',
			location: 'Austin, TX',
			period: 'Jan 2026 - May 2026',
			summary:
				'Built and optimized vision workflows for manufacturing defect identification and model training.',
			bullets: [
				'Applied classical computer vision and ML models to identify manufacturing defects.',
				'Created a semi-automated annotation and augmentation pipeline for downstream model training and tuning.',
				'Improved ML inference and database interaction latency by roughly 2000x, from 1.4 s to 0.8 ms per image.'
			],
			tags: ['Computer vision', 'ML inference', 'OpenCV', 'Data pipelines']
		},
		{
			organization: 'Safe Robotics Laboratory',
			title: 'Graduate Researcher',
			location: 'Atlanta, GA',
			period: 'Apr 2024 - Present',
			summary:
				'Researching embodied navigation, large foundation models, and humanoid teleoperation systems.',
			bullets: [
				'Trained large foundation models, including VLMs and VLAs, with 3D perception for embodied navigation.',
				'Auto-generated photorealistic indoor 3D scenes for large-scale self-supervised navigation training.',
				'Built a humanoid teleoperation client-server system for Meta Quest headsets and MuJoCo simulation.'
			],
			tags: ['Robotics', 'VLM/VLA', '3D perception', 'Unity', 'MuJoCo']
		},
		{
			organization: 'Georgia Tech Research Institute',
			title: 'Embedded Systems Intern',
			location: 'Atlanta, GA',
			period: 'Jan 2024 - Aug 2024',
			summary:
				'Worked across mechanical engineering, embedded software, and agentic AI workflows for defense-facing prototypes.',
			bullets: [
				'Built agentic AI workflows for fighter pilots to request on-demand data visualization through voice interaction.',
				'Fabricated, assembled, and documented hardware prototypes for classified DoD projects.'
			],
			tags: ['Embedded systems', 'Agentic AI', 'Hardware', 'Voice UX']
		},
		{
			organization: 'SightWise',
			title: 'Co-Founder',
			location: 'Atlanta, GA',
			period: 'Apr 2023 - Dec 2023',
			summary:
				'Co-founded an AI accessibility suite for blind and visually impaired users, balancing model capability with human-centered UX.',
			bullets: [
				'Launched an AI visual scene description service that reached more than 1.5k users.',
				'Fine-tuned large language models for visual description and deployed GPU-backed services on AWS EC2.',
				'Used ONNX and Apache TVM to accelerate mobile computer vision models, reaching a 5x speedup on Android and iOS.'
			],
			tags: ['Accessibility', 'LLMs', 'AWS', 'ONNX', 'Apache TVM']
		},
		{
			organization: 'HEART Lab @ Asan Medical Center',
			title: 'Assistive Technology Research Intern',
			location: 'Seoul, Korea',
			period: 'May 2022 - Aug 2022',
			summary:
				'Developed edge-compute assistive technology prototypes for tactile access to visual information.',
			bullets: [
				'Developed a finger-worn visual-tactile sensory substitution device for human participants with blindness.',
				'Implemented object detection, segmentation, tracking, edge detection, visual grounding, and VQA models for real-time edge inference.'
			],
			tags: ['Assistive tech', 'Edge AI', 'Object detection', 'VQA']
		}
	];

	const throughLines = [
		{
			label: 'Embodied AI',
			description: 'Foundation models, 3D perception, simulation, and teleoperation for robots.'
		},
		{
			label: 'Vision Systems',
			description:
				'Manufacturing inspection, annotation pipelines, edge perception, and real-time CV.'
		},
		{
			label: 'Systems Optimization',
			description:
				'GPU/SoC analysis, inference latency, mobile acceleration, and deployment tradeoffs.'
		},
		{
			label: 'Human-Centered Tools',
			description:
				'Accessibility, voice interaction, assistive devices, and interfaces for embodied workflows.'
		}
	];

	const featuredStats = [
		{ value: '~2000x', label: 'Tesla backend latency improvement' },
		{ value: '1.5k+', label: 'SightWise launch users' },
		{ value: '5x', label: 'Mobile CV acceleration' }
	];
</script>

<svelte:head>
	<title>Experience - Yunho Cho</title>
	<meta
		name="description"
		content="Professional and research experience across robotics, computer vision, XR systems, embodied AI, and edge computing."
	/>
</svelte:head>

<main class="min-h-screen bg-background">
	<section
		class="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-16"
	>
		<div class="lg:sticky lg:top-8 lg:h-fit">
			<div
				class="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground"
			>
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
				Robotics, perception, and XR systems
			</div>

			<h1 class="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
				Experience that crosses research, products, and physical systems.
			</h1>

			<p class="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
				I work where computer vision, embodied AI, and hardware-aware systems meet: from XR SoCs and
				manufacturing inspection to robot teleoperation and assistive technology.
			</p>

			<div class="mt-7 flex flex-wrap gap-3">
				<Button href="/resume.pdf" target="_blank" rel="noreferrer" class="gap-2">
					<FileTextIcon />
					Resume
				</Button>
				<Button variant="outline" href="https://github.com/yunho-c" class="gap-2">
					GitHub
					<ArrowUpRightIcon />
				</Button>
			</div>

			<div class="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
				{#each featuredStats as stat}
					<div class="rounded-lg border bg-card px-4 py-3">
						<div class="text-2xl font-semibold tracking-tight">{stat.value}</div>
						<div class="mt-1 text-sm leading-5 text-muted-foreground">{stat.label}</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="relative">
			<div class="absolute top-3 bottom-3 left-3 hidden w-px bg-border sm:block"></div>

			<div class="space-y-5">
				{#each experiences as experience}
					<article class="relative sm:pl-10">
						<div
							class="absolute top-6 left-1.5 hidden h-3 w-3 rounded-full border-2 border-background bg-foreground ring-4 ring-border sm:block"
						></div>

						<Card.Root class="rounded-lg border bg-card/80 shadow-none backdrop-blur">
							<Card.Header class="gap-3">
								<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
									<div>
										<Card.Title class="text-xl tracking-tight">{experience.organization}</Card.Title
										>
										<Card.Description class="mt-1 text-base font-medium text-foreground">
											{experience.title}
										</Card.Description>
									</div>

									<div class="flex flex-col gap-1 text-sm text-muted-foreground md:items-end">
										<span>{experience.period}</span>
										<span>{experience.location}</span>
									</div>
								</div>
							</Card.Header>

							<Card.Content class="space-y-5">
								<p class="max-w-2xl text-sm leading-6 text-muted-foreground">
									{experience.summary}
								</p>

								<ul class="space-y-3 text-sm leading-6">
									{#each experience.bullets as bullet}
										<li class="flex gap-3">
											<span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/70"></span>
											<span>{bullet}</span>
										</li>
									{/each}
								</ul>

								<div class="flex flex-wrap gap-2">
									{#each experience.tags as tag}
										<Badge variant="outline" class="bg-background/60">{tag}</Badge>
									{/each}
								</div>
							</Card.Content>
						</Card.Root>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<Separator />

	<section class="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
			<div>
				<p class="text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">
					Technical through-lines
				</p>
				<h2 class="mt-3 text-3xl font-semibold tracking-tight">
					The work is different, but the operating pattern is consistent.
				</h2>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				{#each throughLines as item}
					<div class="rounded-lg border bg-card p-5">
						<h3 class="font-semibold">{item.label}</h3>
						<p class="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>
</main>
