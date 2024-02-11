/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './index.html'
    ],
    theme: {
        extend: {
            fontSize: {
                'xxs': ['10px', '16px']
            }
        }
    },
    plugins: [
        function({addUtilities}) {
            const newUtilities = {};
            addUtilities(newUtilities, ['responsive', 'hover']);
        }
    ]
};
