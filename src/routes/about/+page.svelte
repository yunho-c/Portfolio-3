<script lang="ts">
	import { asset, resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<svelte:head>
	<title>About - Yunho Cho</title>
	<meta
		name="description"
		content="About Yunho Cho, a robotics graduate student and machine learning engineer at Georgia Tech."
	/>
</svelte:head>

<main class="min-h-screen bg-background">
	<article class="mx-auto max-w-[920px] px-5 py-16 sm:px-6 sm:py-24">
		<header class="about-reveal border-b border-border pb-16 sm:pb-20" style="--reveal-delay: 80ms">
			<div class="mx-auto max-w-3xl">
				<p class="mb-5 text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
					About / 소개
				</p>
				<h1
					class="max-w-3xl text-5xl leading-[0.98] font-bold tracking-[-0.045em] text-foreground sm:text-6xl md:text-7xl"
				>
					Hi there!<span class="text-muted-foreground">—</span><span lang="ko">안녕하세요!</span>
				</h1>
			</div>

			<div
				class="mx-auto mt-12 max-w-3xl space-y-6 text-lg leading-relaxed text-foreground/90 sm:text-xl"
			>
				<p>
					My name is Yunho—or <span lang="ko" class="font-medium text-foreground">조윤호</span> in
					Korean.
				</p>
				<p>
					I am a graduate student completing an M.S. degree in Robotics at Georgia Tech,
					advised by <a href="https://www.shreyaskousik.com/" class="inline-link"
						>Shreyas Kousik</a
					>. Previously, I received a bachelor’s degree in mechanical engineering, with a minor in
					psychology, at Georgia Tech.
				</p>
				<p class="text-muted-foreground">
					I like to run, listen to music, read webtoons, take photos, and play sim racing games.
				</p>
			</div>
		</header>

		<div
			class="prose prose-zinc prose-lg sm:prose-xl dark:prose-invert mx-auto max-w-3xl pt-14 sm:pt-16 prose-headings:tracking-tight prose-h2:mb-4 prose-p:leading-relaxed prose-p:text-foreground/90 prose-li:leading-relaxed prose-li:text-foreground/90 prose-a:text-foreground prose-a:decoration-muted-foreground/50 prose-a:underline-offset-4"
		>
			<section>
				<div class="not-prose flex items-center justify-between gap-4">
					<h2 class="text-3xl leading-tight font-bold tracking-tight text-foreground sm:text-4xl">
						Background
					</h2>
					<Button
						href={asset('/resume.pdf')}
						target="_blank"
						rel="noreferrer"
						variant="outline"
						size="lg"
						class="h-12 px-8 text-base shadow-sm transition-[box-shadow,background-color,color] hover:shadow-md"
					>
						Resume
					</Button>
				</div>
				<p class="mt-4">
					I am a generalist with diverse interests—and love delving into unfamiliar fields within
					engineering.
				</p>

				<p>My areas of expertise-ish are:</p>
				<ul>
					<li><strong>Perception</strong>, control, and motion planning for robotic systems</li>
					<li>Inference optimization of machine learning models (for edge inference)</li>
					<li>
						Building software in general (web, mobile, desktop, backend/database, systems-level)
					</li>
				</ul>

				<p>My research interests are:</p>
				<ul>
					<li>
						Applying computational approaches to new domains
						<ul>
							<li>Including traditional sciences, unobservable or subjective phenomena, and more</li>
						</ul>
					</li>
					<li>
						Utilizing joint information representations and test-time input augmentations to extend
						the capabilities of large transformer models (e.g., LLMs)
					</li>
					<li>
						Devising human-centered communication and control schemes by considering human
						perceptual, cognitive, and motor characteristics
					</li>
					<li>
						Utilizing large-scale unlabeled data (e.g., videos) for weak self-supervised learning of
						joint/multimodal information representations
						<ul>
							<li>Including value functions, world-state perception and prediction, and more</li>
						</ul>
					</li>
				</ul>
			</section>

			<hr />

			<section>
				<h2>Links</h2>
				<div class="not-prose grid gap-4 sm:grid-cols-3">
					<a
						href={resolve('/experience')}
						class="flex min-h-20 items-center justify-center rounded-lg bg-gray-100 p-3 text-center text-lg font-medium text-foreground transition-colors hover:bg-gray-200 sm:text-xl dark:bg-gray-800 dark:hover:bg-gray-700"
					>
						Experience
					</a>
					<div
						class="flex min-h-20 items-center justify-center rounded-lg bg-gray-100 p-3 text-center text-lg font-medium text-foreground sm:text-xl dark:bg-gray-800"
					>
						Coursework
					</div>
					<div
						class="flex min-h-20 items-center justify-center rounded-lg bg-gray-100 p-3 text-center text-lg font-medium text-foreground sm:text-xl dark:bg-gray-800"
					>
						Blog
					</div>
				</div>
			</section>

			<hr />

			<section>
				<h2>🌠 I envision...</h2>
				<p>
					My life goal is to tackle underserved problems (e.g., affordable and useful assistive
					technology devices) and create solutions that directly improve individuals’ quality of
					life.
				</p>
				<p>So far, I have encountered a few important topics that fit this description:</p>

				<ul>
					<li>
						<strong>Access to high-quality knowledge content for non-English speakers</strong>
						<ul>
							<li>
								An unfair amount of academic lectures and articles are available strictly in
								English.
							</li>
							<li>
								As a society, we have powerful machine-translation technology, but it has not yet
								been deployed in end-user tools that let people comfortably translate textbooks,
								lectures, and assignments—and learn in their own language.
							</li>
						</ul>
					</li>
					<li>
						<strong
							>Assistive technologies that enhance life for people with sensory impairments</strong
						>
						<ul>
							<li>
								The world we live in is not designed with sensory impairment in mind. This
								includes roads, products, interfaces, schools, and public buildings. Our society
								presents people with more challenges and safety risks while offering them fewer
								opportunities for success in school and work.
							</li>
							<li>
								We have <strong>lots</strong> of room for improvement as a society and as a field.
								Some of the work is social and infrastructural, but modern technology also has a
								great deal to offer in reducing the frustrations that arise during activities of
								daily living.
							</li>
							<li>
								Visual impairment, for example, is both more common and more detrimental than many
								people realize. I am not currently putting as much time into visual-assistance
								systems as I once did, but I plan to continue until the problem is truly considered
								“solved.” Projects like Project Astra are very exciting!
							</li>
						</ul>
					</li>
				</ul>

				<p>I plan to keep working hard on things like this throughout my life.</p>
			</section>

			<hr />

			<section>
				<h2>Talk</h2>
				<p>
					I am always open to a coffee chat! Send me an email at:
					<span
						class="not-prose ml-1.5 inline-flex flex-wrap items-center gap-1.5 align-middle"
						aria-label="Email address shown in image fragments"
					>
						<img
							src={asset('/email/email-1.svg')}
							alt="Email username"
							class="email-fragment h-7 w-auto"
						/>
						<img
							src={asset('/email/email-2.svg')}
							alt="at sign"
							class="email-fragment h-7 w-auto"
						/>
						<img
							src={asset('/email/email-3.svg')}
							alt="Email domain"
							class="email-fragment h-7 w-auto"
						/>
					</span>
				</p>
			</section>
		</div>
	</article>
</main>

<style>
	.email-fragment {
		display: block;
	}

	.about-reveal {
		animation: about-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
		animation-delay: var(--reveal-delay);
	}

	@keyframes about-rise {
		from {
			opacity: 0;
			transform: translateY(1rem);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.about-reveal {
			animation: none;
		}
	}

	:global(.dark) .email-fragment {
		filter: invert(1);
	}
</style>
