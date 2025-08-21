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
		<Button variant="ghost" href="https://research.yunhocho.com" class="text-sm font-medium">Research</Button>
		<Button variant="ghost" href="https://blog.yunhocho.com" class="text-sm font-medium">Blog</Button>
	</nav>
	<nav class="flex gap-4 sm:gap-6">
		<Button variant="link" href="https://scholar.google.comar/TODO" class="text-sm font-medium"
			>Google Scholar</Button
		>
		<Button variant="link" href="https://github.com/yunho-c" class="text-sm font-medium"
			>GitHub</Button
		>
	</nav>
</header>
