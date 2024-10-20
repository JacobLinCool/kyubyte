import typography from '@tailwindcss/typography';
import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,css,svelte,ts}'],
	theme: {
		extend: {}
	},
	plugins: [daisyui, typography]
};
