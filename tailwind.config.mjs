/** @type {import('tailwindcss').Config} */
export default {
    theme: {
        extend: {
            keyframes: {
                "slide-fade-in": {
                    "0%": { opacity: "0", transform: "translateY(-1rem)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "slide-fade-out": {
                    "0%": { opacity: "1", transform: "translateY(0)" },
                    "100%": { opacity: "0", transform: "translateY(-1rem)" },
                },
            },
            animation: {
                "slide-fade-in": "slide-fade-in 0.2s ease-out forwards",
                "slide-fade-out": "slide-fade-out 0.2s ease-in forwards",
            },
        },
    },
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
};