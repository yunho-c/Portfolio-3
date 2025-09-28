<script lang="ts">
	export let object: { id: number; name: string; thumbnail: string };
</script>

<button
	on:click
	class="group relative block overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800"
>
	<img
		src={object.thumbnail}
		alt={object.name}
		class="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
	/>
	<div
		class="bg-opacity-50 absolute inset-0 bg-black opacity-0 transition-opacity duration-300 group-hover:opacity-100"
	></div>
	<div
		class="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4 text-white"
	>
		<h3 class="font-semibold">{object.name}</h3>
	</div>
</button>
