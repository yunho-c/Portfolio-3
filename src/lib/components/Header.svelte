<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<header class="flex h-14 items-center px-4 lg:px-6">
	<a class="flex items-center justify-center" href="/">
		<span class="font-semibold">Yunho Cho</span>
	</a>
	<nav class="mx-auto flex gap-4 sm:gap-6">
		<Button variant="ghost" href="/about" class="text-sm font-medium">About</Button>
		<Button variant="ghost" href="/projects" class="text-sm font-medium">Projects</Button>
		<Button variant="ghost" href="https://research.yunhocho.com" class="text-sm font-medium"
			>Research</Button
		>
		<Button variant="ghost" href="/projects" class="text-sm font-medium">Coursework</Button>
		<!-- <Button variant="ghost" href="https://blog.yunhocho.com" class="text-sm font-medium"
			>Blog</Button
		> -->
	</nav>
	<nav class="flex gap-4 sm:gap-6">
		<Button
			variant="link"
			href="https://scholar.google.com/citations?user=zY_1e-AAAAAJ"
			class="text-sm font-medium text-gray-600 transition-all hover:text-blue-500 hover:drop-shadow-[0_0_5px_rgba(59,130,246,0.1)] dark:text-gray-400 dark:hover:text-blue-400 dark:hover:drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]"
			>Google Scholar</Button
		>
		<Button
			variant="link"
			href="https://github.com/yunho-c"
			class="text-sm font-medium text-gray-600 transition-all hover:text-purple-500 hover:drop-shadow-[0_0_5px_rgba(168,85,247,0.1)] dark:text-gray-400 dark:hover:text-purple-400 dark:hover:drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]"
			>GitHub</Button
		>
	</nav>
</header>
