/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,jsx}',
        './components/**/*.{js,jsx}',
        './contexts/**/*.{js,jsx}',
        './hooks/**/*.{js,jsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#4C6FFF',
                'primary-soft': '#F4F6FF',
                bg: '#F8F9FB',
                surface: '#FFFFFF',
                border: '#E6E8EF',
                'text-primary': '#1E1F24',
                'text-secondary': '#6B7280',
                success: '#22C55E',
                warning: '#F59E0B',
                error: '#EF4444',
                info: '#3B82F6',
            },
            borderRadius: {
                sm: '8px',
                DEFAULT: '8px',
                md: '12px',
                lg: '16px',
                xl: '20px',
                pill: '24px',
            },
            boxShadow: {
                1: '0px 2px 8px rgba(0,0,0,0.04)',
                2: '0px 4px 16px rgba(0,0,0,0.06)',
            },
            fontFamily: {
                sans: ['Urbanist', 'sans-serif'],
            },
            fontSize: {
                h1: ['28px', { fontWeight: '600', lineHeight: '1.4' }],
                h2: ['22px', { fontWeight: '600', lineHeight: '1.4' }],
                h3: ['18px', { fontWeight: '600', lineHeight: '1.4' }],
                'body-lg': ['16px', { fontWeight: '500', lineHeight: '1.6' }],
                body: ['14px', { fontWeight: '400', lineHeight: '1.6' }],
                caption: ['12px', { fontWeight: '400', lineHeight: '1.5' }],
            },
            transitionDuration: {
                DEFAULT: '200ms',
            },
        },
    },
    plugins: [],
}
