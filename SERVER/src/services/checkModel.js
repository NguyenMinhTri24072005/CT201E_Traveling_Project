const API_KEY = 'AIzaSyAY0V5HxG_1-6-LBElZyegw7aFfnHz4yDU';

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`)
    .then(r => r.json())
    .then(data => {
        const chatModels = data.models
            .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
            .map(m => ({
                name: m.name.replace('models/', ''),
                displayName: m.displayName,
                inputTokenLimit: m.inputTokenLimit,
                outputTokenLimit: m.outputTokenLimit,
                description: m.description,
            }));

        console.table(chatModels);
    });