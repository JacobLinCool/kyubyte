import { writable } from 'svelte/store';
import type { StorageItemKey } from 'wxt/storage';

function createStore<T>(value: T, storageKey: StorageItemKey) {
	const { subscribe, set } = writable(value);

	const storageItem = storage.defineItem<T>(storageKey, {
		fallback: value
	});

	storageItem.getValue().then(set);

	const unwatch = storageItem.watch(set); // not sure when or where to call unwatch

	return {
		subscribe,
		set: (value: T) => {
			storageItem.setValue(value);
		}
	};
}

export enum ModelProvider {
	GoogleAIStudio = 'googleAIStudio',
	OpenAI = 'openAI',
	HuggingFace = 'huggingFace'
}

export enum GoogleAIStudioModel {
	GeminiFlash = 'gemini-1.5-flash-latest',
	GeminiPro = 'gemini-1.5-pro-latest'
}

export enum OpenAIModel {
	GPT4oMini = 'gpt-4o-mini',
	GPT4o = 'gpt-4o'
}

export enum HuggingFaceModel {
	'meta-llama/Llama-3.2-3B-Instruct' = 'meta-llama/Llama-3.2-3B-Instruct',
	'meta-llama/Llama-3.1-8B-Instruct' = 'meta-llama/Llama-3.1-8B-Instruct'
}

export enum StoreKey {
	SelectedProvider = 'selectedProvider',
	GoogleAIStudioAPIKey = 'googleAIStudioGeminiAPIKey',
	OpenAIAPiKey = 'openaiAPIKey',
	HuggingFaceAPIKey = 'huggingFaceAPIKey'
}

export const partialProviderModels = {
	[ModelProvider.GoogleAIStudio]: [GoogleAIStudioModel.GeminiFlash, GoogleAIStudioModel.GeminiPro],
	[ModelProvider.OpenAI]: [OpenAIModel.GPT4oMini, OpenAIModel.GPT4o],
	[ModelProvider.HuggingFace]: [
		HuggingFaceModel['meta-llama/Llama-3.2-3B-Instruct'],
		HuggingFaceModel['meta-llama/Llama-3.1-8B-Instruct']
	]
} as const;

export const selectedProvider = createStore<ModelProvider>(
	ModelProvider.GoogleAIStudio,
	`local:${StoreKey.SelectedProvider}`
);

export const googleAIStudioGeminiAPIKey = createStore<string | null>(
	null,
	`local:${StoreKey.GoogleAIStudioAPIKey}`
);

export const openAIAPIKey = createStore<string | null>(null, `local:${StoreKey.OpenAIAPiKey}`);

export const huggingFaceAPIKey = createStore<string | null>(
	null,
	`local:${StoreKey.HuggingFaceAPIKey}`
);

export const selectedModel = createStore<string | null>(null, 'local:selectedModel');
