<script lang="ts">
	type Experience = {
		organization: string;
		title: string;
		period: string;
		bullets: string[];
	};

	const experiences: Experience[] = [
		{
			organization: 'Qualcomm',
			title: 'XR Systems Engineering Intern',
			period: 'May 2026 - Current',
			bullets: [
				'Run capability evaluation and performance analysis for GPU workloads in VR/AR device contexts.',
				'Connect hardware constraints, graphics performance, and XR product requirements into practical system findings.'
			]
		},
		{
			organization: 'Tesla',
			title: 'Computer Vision Intern',
			period: 'Jan 2026 - May 2026',
			bullets: [
				'Applied classical computer vision and ML models to identify manufacturing defects.',
				'Created a semi-automated annotation and augmentation pipeline for downstream model training and tuning.',
				'Improved ML inference and database interaction latency by roughly 2000x, from 1.4 s to 0.8 ms per image.'
			]
		},
		{
			organization: 'Safe Robotics Laboratory',
			title: 'Graduate Researcher',
			period: 'Apr 2024 - Present',
			bullets: [
				'Trained large foundation models, including VLMs and VLAs, with 3D perception for embodied navigation.',
				'Auto-generated photorealistic indoor 3D scenes for large-scale self-supervised navigation training.',
				'Built a humanoid teleoperation client-server system for Meta Quest headsets and MuJoCo simulation.'
			]
		},
		{
			organization: 'Georgia Tech Research Institute',
			title: 'Embedded Systems Intern',
			period: 'Jan 2024 - Aug 2024',
			bullets: [
				'Built agentic AI workflows for fighter pilots to request on-demand data visualization through voice interaction.',
				'Fabricated, assembled, and documented hardware prototypes for classified DoD projects.'
			]
		},
		{
			organization: 'SightWise',
			title: 'Co-Founder',
			period: 'Apr 2023 - Dec 2023',
			bullets: [
				'Launched an AI visual scene description service that reached more than 1.5k users.',
				'Fine-tuned large language models for visual description and deployed GPU-backed services on AWS EC2.',
				'Used ONNX and Apache TVM to accelerate mobile computer vision models, reaching a 5x speedup on Android and iOS.'
			]
		},
		{
			organization: 'HEART Lab @ Asan Medical Center',
			title: 'Assistive Technology Research Intern',
			period: 'May 2022 - Aug 2022',
			bullets: [
				'Developed a finger-worn visual-tactile sensory substitution device for human participants with blindness.',
				'Implemented object detection, segmentation, tracking, edge detection, visual grounding, and VQA models for real-time edge inference.'
			]
		}
	];
</script>

<svelte:head>
	<title>Experience - Yunho Cho</title>
</svelte:head>

<main class="bg-background min-h-screen">
	<article class="mx-auto max-w-[840px] px-5 py-16 sm:px-6 sm:py-24">
		<header class="mb-16 md:mb-20 text-center">
			<h1 class="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">Experience</h1>
		</header>
		<div class="space-y-20">
			{#each experiences as experience}
				<section class="flex flex-col md:flex-row gap-6 md:gap-10">
					<!-- Left Column: Organization & Metadata -->
					<div class="md:w-[240px] shrink-0">
						<h3 class="text-2xl font-semibold tracking-tight text-foreground">{experience.organization}</h3>
						<div class="mt-2.5 flex flex-col space-y-0.5 text-muted-foreground">
							<span class="text-xs">{experience.period}</span>
							<span class="text-[14.5px]">{experience.title}</span>
						</div>
					</div>

					<!-- Right Column: Bullets -->
					<div class="flex-1 mt-1 md:mt-0">
						<ul class="ml-4 list-outside list-disc space-y-2 text-[15px] leading-[1.4] text-foreground marker:text-muted-foreground">
							{#each experience.bullets as bullet}
								<li class="pl-1">{bullet}</li>
							{/each}
						</ul>
					</div>
				</section>
			{/each}
		</div>
	</article>
</main>
