<script lang="ts">
	import { onMount } from 'svelte';
	import {
		selectedProvider,
		googleAIStudioGeminiAPIKey,
		openAIAPIKey,
		huggingFaceAPIKey,
		selectedModel,
		partialProviderModels,
		ModelProvider
	} from '~/lib/store';

	$: partialModels = partialProviderModels[$selectedProvider] || [];

	let modelInput: HTMLInputElement;
	let isDropdownOpen = false;
	let filteredModels: string[] = [];

	$: {
		filteredModels = partialModels.filter((model) =>
			model.toLowerCase().includes(($selectedModel ?? '').toLowerCase())
		);
	}

	function handleModelInput() {
		isDropdownOpen = true;
	}

	function selectModel(model: string) {
		$selectedModel = model;
		isDropdownOpen = false;
	}

	function handleClickOutside(event: MouseEvent) {
		if (modelInput && !modelInput.contains(event.target as Node)) {
			isDropdownOpen = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	function getApiKeyLink(provider: ModelProvider): string {
		switch (provider) {
			case ModelProvider.GoogleAIStudio:
				return 'https://aistudio.google.com/app/apikey';
			case ModelProvider.OpenAI:
				return 'https://platform.openai.com/account/api-keys';
			case ModelProvider.HuggingFace:
				return 'https://huggingface.co/settings/tokens';
			default:
				return '#';
		}
	}

	function getApiKeyLabel(provider: ModelProvider): string {
		switch (provider) {
			case ModelProvider.GoogleAIStudio:
				return 'Google AI Studio API Key';
			case ModelProvider.OpenAI:
				return 'OpenAI API Key';
			case ModelProvider.HuggingFace:
				return 'Hugging Face API Key';
			default:
				return 'API Key';
		}
	}
</script>

<div class="bg-base-200 p-4 min-h-[300px] flex items-center justify-center">
	<div class="card w-96 bg-base-100 shadow-xl">
		<div class="card-body p-6">
			<h2 class="card-title text-xl font-bold mb-4">Kyubyte Settings</h2>

			<!-- Provider selection (unchanged) -->
			<div class="form-control mb-4">
				<label for="provider" class="label p-0 mb-1">
					<span class="label-text text-sm">AI Provider</span>
				</label>
				<select
					id="provider"
					bind:value={$selectedProvider}
					class="select select-bordered select-sm w-full"
				>
					<option value="googleAIStudio">Google AI Studio</option>
					<option value="openAI">OpenAI</option>
					<option value="huggingFace">Hugging Face</option>
				</select>
			</div>

			<!-- New model selection component -->
			<div class="form-control mb-4 relative">
				<label for="model" class="label p-0 mb-1">
					<span class="label-text text-sm">Model</span>
				</label>
				<input
					id="model"
					bind:this={modelInput}
					bind:value={$selectedModel}
					on:input={handleModelInput}
					placeholder="Select or enter model name"
					class="input input-bordered input-sm w-full pr-8"
				/>
				{#if isDropdownOpen && filteredModels.length > 0}
					<ul
						class="absolute z-10 mt-1 w-full bg-base-200 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-primary-content ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
					>
						{#each filteredModels as model}
							<!-- svelte-ignore a11y-click-events-have-key-events -->
							<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
							<li
								class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-primary hover:text-primary-content"
								on:click={() => selectModel(model)}
							>
								{model}
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<div class="form-control">
				<label for="api-key" class="label p-0 mb-1">
					<span class="label-text text-sm">{getApiKeyLabel($selectedProvider)}</span>
				</label>
				{#if $selectedProvider === ModelProvider.GoogleAIStudio}
					<input
						id="api-key"
						type="password"
						bind:value={$googleAIStudioGeminiAPIKey}
						placeholder="Enter Google AI Studio API key"
						class="input input-bordered input-sm w-full"
					/>
				{:else if $selectedProvider === ModelProvider.OpenAI}
					<input
						id="api-key"
						type="password"
						bind:value={$openAIAPIKey}
						placeholder="Enter OpenAI API key"
						class="input input-bordered input-sm w-full"
					/>
				{:else if $selectedProvider === ModelProvider.HuggingFace}
					<input
						id="api-key"
						type="password"
						bind:value={$huggingFaceAPIKey}
						placeholder="Enter Hugging Face API key"
						class="input input-bordered input-sm w-full"
					/>
				{/if}
				<a
					href={getApiKeyLink($selectedProvider)}
					target="_blank"
					rel="noopener noreferrer"
					class="link link-primary text-xs mt-1"
				>
					Get your API key here
				</a>
			</div>
		</div>
	</div>
</div>
