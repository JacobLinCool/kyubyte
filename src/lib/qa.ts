import { ModelProvider } from './store';

export type answerQuestions = (content: string, apiKey: string, model: string) => Promise<QAResult>;

export interface QAResult {
	hasQuestion: boolean;
	summary: string;
	questions: Question[];
}

export interface Question {
	questionBody: string;
	questionType: 'freeform' | 'select';
	selectionOptions?: selectionOption[];
	freeformAnswer?: string;
}

export interface selectionOption {
	optionBody: string;
	isCorrect: boolean;
}

export const answerQuestionsFunctions: Record<ModelProvider, answerQuestions> = {
	[ModelProvider.GoogleAIStudio]: answerQuestionsGoogleAIStudio,
	[ModelProvider.OpenAI]: answerQuestionsOpenAI,
	[ModelProvider.HuggingFace]: answerQuestionsHuggingFace
};

export async function answerQuestionsGoogleAIStudio(
	content: string,
	apiKey: string,
	model = 'gemini-1.5-flash-latest'
): Promise<QAResult> {
	const body = {
		systemInstruction: {
			role: 'user',
			parts: [
				{
					text: 'Please check if there are any questions on the page. For select questions, list out all options and select one or more correct options. For freeform questions, answer them or at least provide a template to answer.'
				}
			]
		},
		contents: [
			{
				parts: [{ text: content }]
			}
		],
		generationConfig: {
			temperature: 0.3,
			topK: 40,
			topP: 0.95,
			maxOutputTokens: 8192,
			responseMimeType: 'application/json',
			responseSchema: {
				type: 'object',
				properties: {
					hasQuestion: {
						type: 'boolean'
					},
					summary: {
						type: 'string'
					},
					questions: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								questionBody: {
									type: 'string'
								},
								questionType: {
									type: 'string',
									enum: ['freeform', 'select']
								},
								selectionOptions: {
									type: 'array',
									items: {
										type: 'object',
										properties: {
											optionBody: {
												type: 'string'
											},
											isCorrect: {
												type: 'boolean'
											}
										},
										required: ['optionBody', 'isCorrect']
									}
								},
								freeformAnswer: {
									type: 'string'
								}
							},
							required: ['questionBody', 'questionType']
						}
					}
				},
				required: ['hasQuestion', 'summary']
			}
		}
	};

	const data = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		}
	).then((response) => response.json());
	console.log(data);

	return JSON.parse(data.candidates[0].content.parts[0].text);
}

export async function answerQuestionsOpenAI(
	content: string,
	apiKey: string,
	model: string
): Promise<QAResult> {
	const body = {
		model,
		messages: [
			{
				role: 'system',
				content: [
					{
						type: 'text',
						text: 'Please check if there are any questions on the page. For select questions, list out all options and select one or more correct options. For freeform questions, answer them or at least provide a template to answer.'
					}
				]
			},
			{
				role: 'user',
				content: [
					{
						type: 'text',
						text: content
					}
				]
			}
		],
		temperature: 0.3,
		max_tokens: 4096,
		top_p: 1,
		frequency_penalty: 0,
		presence_penalty: 0,
		response_format: {
			type: 'json_schema',
			json_schema: {
				name: 'response',
				strict: true,
				schema: {
					type: 'object',
					properties: {
						hasQuestion: {
							type: 'boolean'
						},
						summary: {
							type: 'string'
						},
						questions: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									questionBody: {
										type: 'string'
									},
									questionType: {
										type: 'string',
										enum: ['freeform', 'select']
									},
									selectionOptions: {
										type: 'array',
										items: {
											type: 'object',
											properties: {
												optionBody: {
													type: 'string'
												},
												isCorrect: {
													type: 'boolean'
												}
											},
											required: ['optionBody', 'isCorrect'],
											additionalProperties: false
										}
									},
									freeformAnswer: {
										type: 'string'
									}
								},
								required: ['questionBody', 'questionType', 'selectionOptions', 'freeformAnswer'],
								additionalProperties: false
							}
						}
					},
					required: ['hasQuestion', 'summary', 'questions'],
					additionalProperties: false
				}
			}
		}
	};

	const data = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify(body)
	}).then((response) => response.json());
	console.log(data);

	return JSON.parse(data.choices[0].message.content);
}

export async function answerQuestionsHuggingFace(
	content: string,
	apiKey: string,
	model: string
): Promise<QAResult> {
	const schema = JSON.stringify(
		{
			type: 'object',
			properties: {
				hasQuestion: {
					type: 'boolean'
				},
				summary: {
					type: 'string'
				},
				questions: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							questionBody: {
								type: 'string'
							},
							questionType: {
								type: 'string',
								enum: ['freeform', 'select']
							},
							selectionOptions: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										optionBody: {
											type: 'string'
										},
										isCorrect: {
											type: 'boolean'
										}
									},
									required: ['optionBody', 'isCorrect'],
									additionalProperties: false
								}
							},
							freeformAnswer: {
								type: 'string'
							}
						},
						required: ['questionBody', 'questionType', 'selectionOptions', 'freeformAnswer'],
						additionalProperties: false
					}
				}
			},
			required: ['hasQuestion', 'summary', 'questions'],
			additionalProperties: false
		},
		null,
		4
	);

	const body = {
		model,
		messages: [
			{
				role: 'system',
				content: `Please check if there are any questions on the page. For select questions, list out all options and select one or more correct options. For freeform questions, answer them or at least provide a template to answer.\n\nOutput JSON in the following schema:\n\n${schema}`
			},
			{
				role: 'user',
				content: content
			}
		],
		temperature: 0.3,
		max_tokens: 2048,
		top_p: 0.7,
		response_format: {
			type: 'json',
			value: schema
		}
	};

	const data = await fetch('https://api-inference.huggingface.co/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify(body)
	}).then((response) => response.json());
	console.log(data);

	return JSON.parse(data.choices[0].message.content);
}
