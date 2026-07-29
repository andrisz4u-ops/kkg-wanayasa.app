
const apiKey = process.env.MISTRAL_API_KEY || 'YOUR_MISTRAL_API_KEY'; // JANGAN PERNAH COMMIT API KEY KE GITHUB!

async function test() {
    console.log('Testing Mistral API...');
    try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'mistral-large-latest',
                messages: [
                    { role: 'user', content: 'Say hello' }
                ]
            })
        });

        if (!response.ok) {
            console.error('Status:', response.status);
            const host = await response.text();
            console.error('Body:', host);
        } else {
            const data = await response.json();
            console.log('Success:', data.choices[0].message.content);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
