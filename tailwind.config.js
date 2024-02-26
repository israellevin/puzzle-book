/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        'site/index.html',
        'site/index.js'
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
