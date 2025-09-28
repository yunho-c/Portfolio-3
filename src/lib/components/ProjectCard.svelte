<script lang="ts">
	export let project: { id: number; name: string; thumbnail: string };
</script>

<button
	on:click
	class="group relative block overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl"
>
	<img
		src={project.thumbnail}
		alt={project.name}
		class="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-110"
	/>
	<div
		class="bg-opacity-50 absolute inset-0 bg-black opacity-0 transition-opacity duration-300 group-hover:opacity-100"
	></div>
	<div
		class="absolute top-0 left-0 p-4"
	>
		<h3 class="font-semibold text-white drop-shadow-[0_0_9px_rgba(0,0,0,0.9)]">{project.name}</h3>
	</div>
</button>
