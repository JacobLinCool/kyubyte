import type { QAResult } from '~/lib/qa';
import { elm2md, findSelect } from '~/lib/utils';

export default defineUnlistedScript(async () => {
	const md = elm2md(document.body);
	console.log({ md });

	try {
		const res: QAResult = await new Promise((resolve, reject) => {
			browser.runtime.sendMessage({ type: 'ANSWER_QUESTIONS', md }, (response) => {
				if (browser.runtime.lastError) {
					reject(new Error(browser.runtime.lastError.message));
				} else if (response.error) {
					reject(new Error(response.error));
				} else {
					resolve(response);
				}
			});
		});

		console.log({ res });

		if (res.hasQuestion) {
			res.questions.forEach((q) => {
				console.log('solving', q.questionBody);
				if (q.questionType === 'select') {
					q.selectionOptions?.forEach((o) => {
						console.log('processing option', o.optionBody);
						const el = findSelect(o.optionBody);
						if (el instanceof HTMLElement) {
							console.log('Found element', el);
							if (o.isCorrect) {
								select(el, true);
							} else {
								select(el, false);
							}
						} else {
							console.log('Cannot find element for', o.optionBody);
						}
					});
				}
			});
		}
	} catch (error) {
		console.error('Error answering questions:', error);
	}
});

function select(el: HTMLElement, shouldSelect: boolean) {
	if (el instanceof HTMLInputElement) {
		if (el.type === 'checkbox' || el.type === 'radio') {
			if (el.checked !== shouldSelect) {
				el.click();
			}
		} else {
			if (shouldSelect) {
				el.click();
			}
		}
	} else if (el instanceof HTMLSelectElement) {
		if (shouldSelect) {
			el.click();
		}
	} else {
		if (shouldSelect) {
			el.click();
		}
	}
}
