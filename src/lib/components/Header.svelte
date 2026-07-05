<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<header
	class="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 lg:h-14 lg:flex-nowrap lg:px-6 lg:py-0"
>
	<a class="flex items-center justify-center" href="/">
		<span class="font-semibold">Yunho Cho</span>
	</a>
	<nav
		class="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:mx-auto sm:w-auto sm:gap-2 lg:gap-4"
	>
		<Button variant="ghost" size="sm" href="/about" class="text-sm font-medium">About</Button>
		<Button variant="ghost" size="sm" href="/experience" class="text-sm font-medium"
			>Experience</Button
		>
		<Button variant="ghost" size="sm" href="/projects" class="text-sm font-medium">Projects</Button>
		<Button
			variant="ghost"
			size="sm"
			href="https://research.yunhocho.com"
			class="text-sm font-medium">Research</Button
		>
		<!-- <Button variant="ghost" href="/coursework" class="text-sm font-medium">Coursework</Button> -->
		<!-- <Button variant="ghost" href="https://blog.yunhocho.com" class="text-sm font-medium"
			>Blog</Button
		> -->
	</nav>
	<nav class="ml-auto flex gap-2 sm:gap-4 lg:gap-6">
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
