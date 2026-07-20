<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<header class="flex flex-wrap items-center px-4 py-3 lg:h-14 lg:flex-nowrap lg:px-6 lg:py-0">
	<!-- Left Side -->
	<div class="flex items-center sm:flex-1 justify-start">
		<a class="flex items-center justify-center" href="/">
			<span class="font-semibold">Yunho Cho</span>
		</a>
	</div>

	<!-- Center Navigation -->
	<nav class="order-3 mt-3 flex w-full justify-start gap-1 overflow-x-auto sm:order-none sm:mt-0 sm:w-auto sm:justify-center sm:gap-2 lg:gap-4">
		<div class="header-entry" style="--header-entry-delay: 80ms">
			<Button variant="ghost" size="sm" href="/about" class="text-sm font-medium">About</Button>
		</div>
		<div class="header-entry" style="--header-entry-delay: 150ms">
			<Button variant="ghost" size="sm" href="/experience" class="text-sm font-medium">Experience</Button>
		</div>
		<div class="header-entry" style="--header-entry-delay: 220ms">
			<Button variant="ghost" size="sm" href="/projects" class="text-sm font-medium">Projects</Button>
		</div>
		<div class="header-entry" style="--header-entry-delay: 290ms">
			<Button variant="ghost" size="sm" href="/publications" class="text-sm font-medium"
				>Publications</Button
			>
		</div>
	</nav>

	<!-- Right Side -->
	<nav class="ml-auto flex items-center justify-end gap-2 sm:flex-1 sm:gap-4 lg:gap-6">
		<div class="header-entry" style="--header-entry-delay: 360ms">
			<Button
				variant="link"
				href="https://scholar.google.com/citations?user=NiU6Rt8AAAAJ"
				class="text-sm font-medium text-gray-600 transition-all hover:text-blue-500 hover:drop-shadow-[0_0_5px_rgba(59,130,246,0.1)] dark:text-gray-400 dark:hover:text-blue-400 dark:hover:drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]"
				>Google Scholar</Button
			>
		</div>
		<div class="header-entry" style="--header-entry-delay: 430ms">
			<Button
				variant="link"
				href="https://github.com/yunho-c"
				class="text-sm font-medium text-gray-600 transition-all hover:text-purple-500 hover:drop-shadow-[0_0_5px_rgba(168,85,247,0.1)] dark:text-gray-400 dark:hover:text-purple-400 dark:hover:drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]"
				>GitHub</Button
			>
		</div>
	</nav>
</header>

<style>
	.header-entry {
		animation: header-entry-reveal 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: var(--header-entry-delay);
	}

	@keyframes header-entry-reveal {
		from {
			opacity: 0;
			transform: translateY(-1.25rem);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.header-entry {
			animation: none;
		}
	}
</style>
