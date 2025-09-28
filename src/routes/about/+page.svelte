<script lang="ts">
	// About page component
</script>

<svelte:head>
	<title>About - Portfolio</title>
	<meta name="description" content="Learn more about me and my background" />
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<header class="mb-8">
		<h1 class="text-4xl font-bold mb-4">About Me</h1>
		<p class="text-xl text-gray-600 dark:text-gray-300">
			Learn more about my background, skills, and experience
		</p>
	</header>

	<main class="prose prose-lg dark:prose-invert max-w-none">
		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">Background</h2>
			<p class="mb-4">
				I'm a passionate software developer with a love for creating innovative solutions and
				building meaningful digital experiences. My journey in technology has been driven by
				curiosity and a desire to solve complex problems.
			</p>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">Skills & Technologies</h2>
			<div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
				<div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
					<span class="font-medium">JavaScript</span>
				</div>
				<div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
					<span class="font-medium">TypeScript</span>
				</div>
				<div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
					<span class="font-medium">Svelte</span>
				</div>
				<div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
					<span class="font-medium">React</span>
				</div>
				<div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
					<span class="font-medium">Node.js</span>
				</div>
				<div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
					<span class="font-medium">Python</span>
				</div>
			</div>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">Experience</h2>
			<p class="mb-4">
				I have experience working on various projects ranging from web applications to
				mobile apps. I enjoy collaborating with teams and contributing to open-source projects.
			</p>
		</section>

		<section>
			<h2 class="text-2xl font-semibold mb-4">Get in Touch</h2>
			<p class="mb-4">
				I'm always interested in new opportunities and collaborations. Feel free to reach out
				if you'd like to work together or just want to chat about technology.
			</p>
		</section>
	</main>
</div>