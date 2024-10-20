export function dbg(...args: unknown[]) {
	if (localStorage['QBDBG']) {
		console.log(...args);
	}
}

export function elm2md(root: Element): string {
	let logIndentation = 0;
	function log(message: string) {
		dbg(`${' '.repeat(logIndentation * 2)}${message}`);
	}

	const rules = {
		H1: (node: HTMLHeadingElement) => {
			const content = convertWithChildren(node);
			return content?.trim() ? `# ${content}\n\n` : '';
		},
		H2: (node: HTMLHeadingElement) => {
			const content = convertWithChildren(node);
			return content?.trim() ? `## ${content}\n\n` : '';
		},
		H3: (node: HTMLHeadingElement) => {
			const content = convertWithChildren(node);
			return content?.trim() ? `### ${content}\n\n` : '';
		},
		H4: (node: HTMLHeadingElement) => {
			const content = convertWithChildren(node);
			return content?.trim() ? `#### ${content}\n\n` : '';
		},
		H5: (node: HTMLHeadingElement) => {
			const content = convertWithChildren(node);
			return content?.trim() ? `##### ${content}\n\n` : '';
		},
		H6: (node: HTMLHeadingElement) => {
			const content = convertWithChildren(node);
			return content?.trim() ? `###### ${content}\n\n` : '';
		},
		P: (node: HTMLParagraphElement) => {
			const content = convertWithChildren(node);
			return content?.trim() ? `${content}\n\n` : '';
		},
		BR: () => `\n`,
		STRONG: (node: HTMLElement) => {
			const content = convertWithChildren(node);
			return content?.trim() ? `**${content}**` : '';
		},
		B: (node: HTMLElement) => {
			const content = convertWithChildren(node);
			return content?.trim() ? `**${content}**` : '';
		},
		EM: (node: HTMLElement) => {
			const content = convertWithChildren(node);
			return content?.trim() ? `_${content}_` : '';
		},
		I: (node: HTMLElement) => {
			const content = convertWithChildren(node);
			return content?.trim() ? `_${content}_` : '';
		},
		A: (node: HTMLAnchorElement) => {
			const content = convertWithChildren(node).replace(/\n/g, '');
			return content?.trim() ? `[${content}](${node.getAttribute('href')})` : '';
		},
		UL: (node: HTMLUListElement) => {
			const content = Array.from(node.children).map(elm2md).join('');
			return content?.trim() ? `${content}\n` : '';
		},
		OL: (node: HTMLOListElement) => {
			const content = Array.from(node.children)
				.map((child, i) => `${i + 1}. ${elm2md(child)}`)
				.join('');
			return content?.trim() ? `${content}\n` : '';
		},
		LI: (node: HTMLLIElement) => {
			const content = convertWithChildren(node);
			return content?.trim() ? `- ${content}\n` : '';
		},
		CODE: (node: HTMLElement) => {
			const content = convertWithChildren(node);
			return content?.trim() ? `\`${content}\`` : '';
		},
		PRE: (node: HTMLPreElement) => {
			const content = node.textContent?.trim() || '';
			return content?.trim() ? `\`\`\`\n${content}\n\`\`\`\n\n` : '';
		},
		BLOCKQUOTE: (node: HTMLQuoteElement) => {
			const content = convertWithChildren(node);
			return content?.trim() ? `> ${content}\n\n` : '';
		}
	};

	const ignoredTags = new Set(['SCRIPT', 'STYLE', 'META', 'HEAD', 'LINK', 'NOSCRIPT']);

	function isVisible(node: Node): boolean {
		if (!(node instanceof Element)) {
			log(`[isVisible] Skipping non-element node: ${nodeDescription(node)}`);
			return false;
		}
		const style = window.getComputedStyle(node);
		const visible =
			style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';

		log(`[isVisible] Element: <${node.tagName.toLowerCase()}> | Visible: ${visible}`);
		return visible;
	}

	function isInline(node: Node): boolean {
		if (!(node instanceof Element)) return false;
		const display = window.getComputedStyle(node).display;
		const isInline =
			display === 'inline' || display === 'inline-block' || display === 'inline-flex';
		log(`[isInline] Element: <${node.tagName.toLowerCase()}> | Inline: ${isInline}`);
		return isInline;
	}

	function processElement(node: Element): string {
		logIndentation++;
		log(`[processElement] Processing node: ${nodeDescription(node)}`);

		let startTime = Date.now();
		let markdown = convert(node);

		if (node.shadowRoot) {
			log(`[processElement] Found shadow root on: ${nodeDescription(node)}`);
			markdown += Array.from(node.shadowRoot.childNodes)
				.map((child) => processElement(child as Element))
				.join('');
		}

		let endTime = Date.now();
		log(
			`[processElement] Processed ${nodeDescription(node)} in ${(endTime - startTime).toFixed(2)}ms`
		);

		logIndentation--;
		return markdown;
	}

	function nodeDescription(node: Node) {
		if (node instanceof Element) {
			return `<${node.tagName.toLowerCase()}>`;
		} else if (node.nodeType === Node.TEXT_NODE) {
			return `TextNode: "${node.textContent?.trim() || ''}"`;
		} else if (node.nodeType === Node.COMMENT_NODE) {
			return `CommentNode: "${node.textContent?.trim() || ''}"`;
		} else {
			return `Node: ${node.nodeName}`;
		}
	}

	function convertWithChildren(node: Node): string {
		logIndentation++;
		let result = Array.from(node.childNodes)
			.map((child) =>
				child.nodeType === Node.TEXT_NODE
					? child.textContent?.trim() || ''
					: processElement(child as Element)
			)
			.join(isInline(node) ? '' : '\n');
		logIndentation--;
		return result;
	}

	function convert(node: Node): string {
		if (node instanceof Element && ignoredTags.has(node.tagName)) {
			log(`[convert] Ignoring: ${nodeDescription(node)}`);
			return '';
		}

		if (!isVisible(node)) {
			log(`[convert] Skipping hidden or non-visible node: ${nodeDescription(node)}`);
			return '';
		}

		const rule = node instanceof Element ? rules[node.tagName as keyof typeof rules] : null;
		if (rule) {
			log(`[convert] Converting: ${nodeDescription(node)} to Markdown`);
			// @ts-expect-error
			return rule(node);
		} else {
			log(`[convert] No rule for: ${nodeDescription(node)}. Processing children.`);
			return convertWithChildren(node);
		}
	}

	log(`[elm2md] Starting conversion from root: ${nodeDescription(root)}`);
	let startTime = Date.now();
	let markdown = processElement(root).trim();
	let endTime = Date.now();
	log(`[elm2md] Conversion completed in ${(endTime - startTime).toFixed(2)}ms`);

	return markdown.replace(/\n{3,}/g, '\n\n').trim();
}

export function deepQuerySelectorAll(selector: string, root = document) {
	let results = Array.from(root.querySelectorAll(selector));

	// Recursively collect elements from all shadow DOMs
	const shadowHosts = Array.from(root.querySelectorAll('*')).filter((el) => el.shadowRoot);

	for (const host of shadowHosts) {
		// @ts-expect-error
		results = results.concat(deepQuerySelectorAll(selector, host.shadowRoot));
	}

	return results;
}

export function findSelect(content: string): Element | null {
	dbg(`Starting search for elements closest to content: "${content}"`);

	const elements = deepQuerySelectorAll(
		'input[type="radio"], input[type="checkbox"], button, [role="option"]'
	);

	dbg(`Found ${elements.length} elements to evaluate.`);

	let closestElement: Element | null = null;
	let minDistance = Infinity;

	// Helper function to find the common ancestor, with logging
	function getCommonAncestor(node1: Node, node2: Node) {
		const ancestors1 = getAllAncestors(node1);
		const ancestors2 = getAllAncestors(node2);

		dbg(`Ancestors of node1:`, ancestors1);
		dbg(`Ancestors of node2:`, ancestors2);

		let i = ancestors1.length - 1;
		let j = ancestors2.length - 1;

		while (i >= 0 && j >= 0 && ancestors1[i] === ancestors2[j]) {
			i--;
			j--;
		}

		dbg(`Common ancestor between nodes found:`, ancestors1[i + 1] || 'None');
		return ancestors1[i + 1];
	}

	// Helper function to get all ancestors, with shadow DOM awareness
	function getAllAncestors(node: Node) {
		const ancestors = [];
		let current = node;

		while (current) {
			ancestors.push(current);
			// @ts-expect-error
			current = current.parentNode || current.host; // Traverse shadow DOM hosts
		}

		return ancestors;
	}

	// Calculate the distance between two elements with debug logs
	function getDomDistance(element: Element, targetElement: Element) {
		dbg(`Calculating distance between:`, element, targetElement);

		const commonAncestor = getCommonAncestor(element, targetElement);
		if (!commonAncestor) return Infinity;

		let distance = 0;

		let current = element;
		while (current && current !== commonAncestor) {
			distance++;
			// @ts-expect-error
			current = current.parentNode || current.host;
		}

		current = targetElement;
		while (current && current !== commonAncestor) {
			distance++;
			// @ts-expect-error
			current = current.parentNode || current.host;
		}

		dbg(`Distance calculated: ${distance}`);
		return distance;
	}

	// Locate the target element containing the content, with debug logs
	const contentElement = findContentElement(document.body, content);

	if (!contentElement) {
		dbg(`No element found containing content: "${content}"`);
		return null;
	}
	dbg(`Found content element:`, contentElement);

	// Find the closest element among the selected elements
	elements.forEach((element) => {
		const distance = getDomDistance(element, contentElement);
		dbg(`Element:`, element, `Distance to content element: ${distance}`);

		if (distance < minDistance) {
			minDistance = distance;
			closestElement = element;
			dbg(`New closest element found:`, closestElement);
		}
	});

	dbg(
		`Closest element to content "${content}":`,
		closestElement || 'None found',
		`(${minDistance})`
	);
	return closestElement;
}

function findContentElement(root: Element, content: string) {
	dbg(`Searching for content "${content}" in:`, root);

	let smallestLeaf = null;

	function normalizeText(text: string) {
		return text.replace(/\s/g, '').toLowerCase();
	}

	content = normalizeText(content);

	function searchNode(node: Element) {
		// Check if this node contains the content
		if (node.textContent && normalizeText(node.textContent) === content) {
			// If it's a leaf node or has no children with the content, update the smallestLeaf
			if (
				node.children.length === 0 ||
				!Array.from(node.children).some(
					(child) => normalizeText(child.textContent || '') === content
				)
			) {
				dbg(`Found a leaf element with content:`, node);
				smallestLeaf = node;
			}
		}

		// Recursively search children
		for (const child of node.children) {
			searchNode(child);
		}

		// If this is a shadow host, search inside its shadow root
		if (node.shadowRoot) {
			dbg(`Entering shadow root of:`, node);
			for (const child of node.shadowRoot.children) {
				searchNode(child);
			}
		}
	}

	searchNode(root);
	return smallestLeaf;
}
