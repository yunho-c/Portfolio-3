<script lang="ts">
	const publication = {
		title: 'A Closed-Form Geometric Retargeting Solver for Upper Body Humanoid Robot Teleoperation',
		authors: [
			'Chuizheng Kong',
			'Yunho Cho',
			'Wonsuhk Jung',
			'Idris Wibowo*',
			'Parth Shinde*',
			'Sundhar Vinodh-Sangeetha*',
			'Long Kiu Chung',
			'Zhenyang Chen',
			'Andrew Mattei',
			'Advaith Nidumukkala',
			'Alexander Elias',
			'Danfei Xu',
			'Taylor Higgins',
			'Shreyas Kousik'
		],
		year: '2026',
		venue: 'arXiv preprint',
		projectUrl: 'https://sew-mimic.com',
		paperUrl: 'https://arxiv.org/abs/2602.01632'
	};
</script>

<svelte:head>
	<title>Publications - Yunho Cho</title>
	<meta
		name="description"
		content="Selected publications by Yunho Cho in robotics, teleoperation, and embodied systems."
	/>
</svelte:head>

<main class="min-h-screen bg-background">
	<article class="mx-auto max-w-[840px] px-5 py-16 sm:px-6 sm:py-24">
		<header class="mb-12 text-center sm:mb-16">
			<h1 class="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Publications</h1>
		</header>

		<section
			class="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8"
			aria-labelledby="publication-title"
		>
			<div class="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
				<span>{publication.venue}</span>
				<span aria-hidden="true">·</span>
				<span>{publication.year}</span>
			</div>

			<h2
				id="publication-title"
				class="mt-4 text-2xl leading-tight font-semibold tracking-tight text-card-foreground sm:text-3xl"
			>
				{publication.title}
			</h2>

			<p class="mt-4 text-sm leading-6 text-muted-foreground">
				{#each publication.authors as author, index}
					{#if index > 0},&nbsp;{/if}
					<span class:font-semibold={author === 'Yunho Cho'} class:text-foreground={author === 'Yunho Cho'}
						>{author}</span
					>
				{/each}
			</p>

			<p class="mt-2 text-xs text-muted-foreground">* Equal contribution</p>

			<div class="mt-6 flex flex-wrap gap-3">
				<a
					href={publication.paperUrl}
					target="_blank"
					rel="noreferrer"
					class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
				>
					Read paper
				</a>
				<a
					href={publication.projectUrl}
					target="_blank"
					rel="noreferrer"
					class="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
				>
					Project page
				</a>
			</div>
		</section>
	</article>
</main>
