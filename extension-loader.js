document.addEventListener("DOMContentLoaded", async () => {
    try {
        const uiResponse = await fetch('app-ui.html');
        const uiText = await uiResponse.text();
        
        document.getElementById('app-root').innerHTML = uiText;

        const scriptsToLoad = [
            'js-body/screens.js',
            'js-body/bodyscript.js',
            'js-body/filedrop.js',
            'js-body/initbuttons.js'
        ];

        for (const src of scriptsToLoad) {
            const script = document.createElement('script');
            script.src = src;
            
            // 1. FORCE STRICT EXECUTION ORDER
            script.async = false; 
            
            // 2. Wait for HTML parsing (best practice)
            script.defer = true;  
            
            document.body.appendChild(script);
        }

        window.dispatchEvent(new Event('AppUIReady'));
    } catch (e) {
        console.error("Failed to load app-ui.html:", e);
    }
});