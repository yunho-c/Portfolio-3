<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { Project } from '$lib/notion';

	export let project: Project;
</script>

<a
	href="/projects/{project.slug}"
	class="group relative block overflow-hidden rounded-lg border border-border transition-all duration-300 ease-in-out hover:scale-[1.03] hover:shadow-xl focus-visible:scale-[1.03] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
>
	{#if project.thumbnail.match(/\.(mp4|webm|ogg|mov)$/i)}
		<video
			src={project.thumbnail}
			autoplay
			loop
			muted
			playsinline
			class="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-110 group-focus-visible:scale-110"
		></video>
	{:else}
		<img
			src={project.thumbnail}
			alt={project.name}
			class="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-110 group-focus-visible:scale-110"
		/>
	{/if}
	<div
		class="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
	></div>
	<div class="absolute inset-0 flex flex-col p-4 text-white">
		<div>
			<h3 class="font-semibold text-white drop-shadow-[0_0_9px_rgba(0,0,0,0.9)]">{project.name}</h3>
			{#if project.description}
				<p
					class="project-card-description mt-2 line-clamp-3 -translate-y-1 text-sm leading-snug text-white/90 opacity-0 drop-shadow-sm transition-[opacity,transform] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
				>
					{project.description}
				</p>
			{/if}
		</div>

		{#if project.tags.length > 0}
			<div
				class="project-card-tags mt-auto translate-y-2 opacity-0 transition-[opacity,transform] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
			>
				<div class="flex flex-wrap gap-1.5">
					{#each project.tags as tag}
						<div
							class="flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm"
						>
							{#if tag.icon}
								<Icon icon={tag.icon} width="13" height="13" />
							{/if}
							<span>{tag.name}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</a>
