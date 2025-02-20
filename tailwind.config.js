/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				dark_bg_1: '#1E3A5F', // Dark blue shade
				dark_bg_2: '#2C4D77',
				dark_bg_3: '#1A3A5A',
				dark_bg_4: '#244A6F',
				dark_bg_5: '#26547C',
				dark_bg_6: '#162C47',
				primary: '#1E3A5F',
				secondary: '#2C4D77',
				dark_border_1: '#2A4965',
				dark_border_2: '#3A5C82',
				dark_hover_1: '#315A7E',
				dark_svg_1: '#A0C4E2',
				dark_svg_2: '#7CA0C4',
				blue_1: '#4A90E2', // A more vibrant blue
				blue_2: '#357ABD',
				dark_text_1: '#E6EFF7',
				dark_text_2: '#A1B8D1',
				dark_text_3: '#A1B8D1',
				dark_text_4: '#C3D4E1',
				dark_text_5: '#8AA8C0',
				dark_scrollbar: '#3D5A75',
				green_1: '#0077B6', // Adjusted green with a blue hint
				green_2: '#005F94',
				green_3: '#00456D',
				green_4: '#003A5A',
			},
		},
	},
	plugins: [],
};
