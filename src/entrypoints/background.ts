import { get } from 'svelte/store';
import { answerQuestionsFunctions } from '~/lib/qa';
import {
	googleAIStudioGeminiAPIKey,
	huggingFaceAPIKey,
	ModelProvider,
	openAIAPIKey,
	selectedModel,
	selectedProvider
} from '~/lib/store';

export default defineBackground(() => {
	const MENU_ACTION = {
		ANSWER_PAGE: 'answer-page'
	} as const;

	browser.contextMenus.onClicked.addListener(menu);

	function menu(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
		if (!tab?.id) {
			return;
		}

		switch (info.menuItemId) {
			case MENU_ACTION.ANSWER_PAGE: {
				browser.scripting.executeScript({
					target: { tabId: tab.id },
					files: ['ans.js']
				});
				break;
			}
		}
	}

	browser.runtime.onInstalled.addListener(async () => {
		browser.contextMenus.create({
			id: MENU_ACTION.ANSWER_PAGE,
			title: 'Answer Question on Page',
			contexts: ['all']
		});
	});

	browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message.type === 'ANSWER_QUESTIONS') {
			const { md } = message;
			answerQuestionsBackground(md)
				.then(sendResponse)
				.catch((error) => sendResponse({ error: error.message }));
			return true; // Indicates we will send a response asynchronously
		}
	});

	async function answerQuestionsBackground(md: string) {
		const provider = get(selectedProvider);
		const apiKey =
			provider === ModelProvider.GoogleAIStudio
				? get(googleAIStudioGeminiAPIKey)
				: provider === ModelProvider.OpenAI
					? get(openAIAPIKey)
					: get(huggingFaceAPIKey);
		const model = get(selectedModel);

		if (!apiKey) {
			throw new Error('No API key set. Please configure the API key in the extension options.');
		}
		if (!model) {
			throw new Error('No model selected. Please configure the model in the extension options.');
		}

		const answerQuestions = answerQuestionsFunctions[provider];
		return await answerQuestions(md, apiKey, model);
	}
});
