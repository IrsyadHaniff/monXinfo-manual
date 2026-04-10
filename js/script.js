// Logika dark/light mode
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('icon-sun');
    const moonIcon = document.getElementById('icon-moon');

    // Init Theme
    if (localStorage.getItem('theme') === 'light') {
        document.documentElement.classList.remove('dark');
        updateIcons(false);
    } else {
        document.documentElement.classList.add('dark');
        updateIcons(true);
    }

    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateIcons(isDark);
    });

    function updateIcons(isDark) {
        sunIcon.classList.toggle('hidden', !isDark);
        moonIcon.classList.toggle('hidden', isDark);
    }
});

// Logika Page Loader
window.addEventListener('load', () => {
    const loader = document.getElementById('page-loader');
    
    // delay
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 600); 
});

// Logika running title tab
let text = "   monXinfo - Homepage   ";
        let i = 0;

        function scrollTitle() {
            document.title = text.substring(i) + text.substring(0, i);
            i = (i + 1) % text.length;
            setTimeout(scrollTitle, 300);
        }

        scrollTitle();