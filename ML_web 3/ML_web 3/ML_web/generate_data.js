import http from 'http';

const teams = ["Care Team A", "Care Team B", "Tech Support", "Billing", "Sales", "Retention"];
const agents = [
    { name: "John Doe", team: "Care Team A" },
    { name: "Jane Smith", team: "Care Team B" },
    { name: "Emily Chen", team: "Tech Support" },
    { name: "Michael Wong", team: "Billing" },
    { name: "Sarah Davis", team: "Sales" },
    { name: "Robert Taylor", team: "Retention" },
    { name: "Anna Bell", team: "Tech Support" },
    { name: "Kevin Hart", team: "Care Team A" },
    { name: "Laura Palmer", team: "Billing" },
    { name: "James Bond", team: "Sales" },
    { name: "Natasha Romanoff", team: "Retention" },
    { name: "Bruce Wayne", team: "Tech Support" }
];

const customerNames = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy", "Mallory", "Nina", "Oscar", "Peggy"];

const positiveScenarios = [
    [
        { senderType: "customer", text: "Hello, I wanted to say thank you for the excellent service yesterday." },
        { senderType: "employee", text: "You're very welcome! Is there anything else I can help you with today?" },
        { senderType: "customer", text: "No, that's all. Keep up the good work." },
        { senderType: "employee", text: "Thank you, have a great day!" }
    ],
    [
        { senderType: "customer", text: "My issue is resolved now, thanks to your quick response." },
        { senderType: "employee", text: "Glad to hear that. I appreciate your patience." },
        { senderType: "customer", text: "It was a pleasure. Bye." }
    ],
    [
        { senderType: "customer", text: "I absolutely love the new features." },
        { senderType: "employee", text: "We are thrilled that you enjoy them! Let us know if you need any guidance." },
        { senderType: "customer", text: "Will do. You guys are the best." }
    ]
];

const negativeScenarios = [
    [
        { senderType: "customer", text: "I've been waiting for an hour and nobody helped me." },
        { senderType: "employee", text: "I apologize for the delay. Let me check your account immediately." },
        { senderType: "customer", text: "This is unacceptable. I want to cancel my subscription." },
        { senderType: "employee", text: "Please give me a moment to resolve this for you." },
        { senderType: "customer", text: "I don't care, just cancel it." }
    ],
    [
        { senderType: "customer", text: "Your product broke after 2 days of use!" },
        { senderType: "employee", text: "I'm so sorry to hear that. We can offer a replacement." },
        { senderType: "customer", text: "I want a refund, not a replacement. Your quality is terrible." }
    ],
    [
        { senderType: "customer", text: "The app is crashing every time I open it. Fix this." },
        { senderType: "employee", text: "I am sorry that you are experiencing this. Can you try reinstalling?" },
        { senderType: "customer", text: "I have tried that twice. It is still broken. Stop wasting my time." }
    ]
];

const neutralScenarios = [
    [
        { senderType: "customer", text: "Hi, what time do you close today?" },
        { senderType: "employee", text: "We close at 8 PM local time." },
        { senderType: "customer", text: "Okay, thank you." },
        { senderType: "employee", text: "You're welcome." }
    ],
    [
        { senderType: "customer", text: "Can I update my billing address here?" },
        { senderType: "employee", text: "Yes, you can do that in your account settings under 'Billing'." },
        { senderType: "customer", text: "Got it, I will check." }
    ]
];

const mixedScenarios = [...positiveScenarios, ...neutralScenarios, ...negativeScenarios];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function sendRequest(payload) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(payload);
        const options = {
            hostname: '127.0.0.1',
            port: 8080,
            path: '/api/conversations',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

function getRandomStatus() {
   return Math.random() > 0.8 ? 'pending' : 'resolved';
}

function getRandomLang() {
   const langs = ['en', 'vi', 'mix'];
   return langs[Math.floor(Math.random() * langs.length)];
}

async function run() {
    const numToGenerate = 60;
    console.log(`Generating ${numToGenerate} synthetic conversations...`);
    
    for (let i = 0; i < numToGenerate; i++) {
        const agent = getRandomItem(agents);
        const scenario = getRandomItem(mixedScenarios);
        const customer = getRandomItem(customerNames);
        
        const payload = {
            employeeName: agent.name,
            team: agent.team,
            customerName: customer,
            language: getRandomLang(),
            status: getRandomStatus(),
            messages: scenario
        };

        try {
            const result = await sendRequest(payload);
            if (result.status !== 200 && result.status !== 201) {
                console.error(`Failed on ${i}: `, result);
            } else {
                console.log(`[${i+1}/${numToGenerate}] Ingested conversation for ${agent.name} with customer ${customer}`);
            }
        } catch (e) {
            console.error(`Error on ${i}`, e.message || e);
        }
        
        await new Promise(r => setTimeout(r, 100)); // Rate limit
    }
    
    console.log("Finished generating data! Triggering NLP evaluation...");
    
    try {
        await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: '127.0.0.1',
                port: 8080,
                path: '/api/evaluation/analyze-batch',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    console.log("Batch NLP Response:", res.statusCode, data);
                    resolve(data);
                });
            });
            req.on('error', (e) => reject(e));
            req.write(JSON.stringify({ limit: 100 }));
            req.end();
        });
        
        // Let's also run a prediction for one of the employees to populate some data
        await new Promise((resolve, reject) => {
             const req = http.request({
                 hostname: '127.0.0.1',
                 port: 8080,
                 path: '/api/evaluation/employee/1/predict',
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' }
             }, (res) => {
                 let data = '';
                 res.on('data', (chunk) => data += chunk);
                 res.on('end', () => {
                     console.log("Prediction Response:", res.statusCode, data);
                     resolve();
                 });
             });
             req.on('error', (e) => reject(e));
             req.write(JSON.stringify({ period: 'weekly' }));
             req.end();
         });
         
        await new Promise((resolve, reject) => {
             const req = http.request({
                 hostname: '127.0.0.1',
                 port: 8080,
                 path: '/api/evaluation/employee/2/predict',
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' }
             }, (res) => {
                 let data = '';
                 res.on('data', (chunk) => data += chunk);
                 res.on('end', () => {
                     console.log("Prediction Response 2:", res.statusCode, data);
                     resolve();
                 });
             });
             req.on('error', (e) => reject(e));
             req.write(JSON.stringify({ period: 'weekly' }));
             req.end();
         });

         await new Promise((resolve, reject) => {
             const req = http.request({
                 hostname: '127.0.0.1',
                 port: 8080,
                 path: '/api/evaluation/employee/3/predict',
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' }
             }, (res) => {
                 let data = '';
                 res.on('data', (chunk) => data += chunk);
                 res.on('end', () => {
                     console.log("Prediction Response 3:", res.statusCode, data);
                     resolve();
                 });
             });
             req.on('error', (e) => reject(e));
             req.write(JSON.stringify({ period: 'weekly' }));
             req.end();
         });

    } catch (e) {
        console.error("Failed to trigger ML endpoints", e.message || e);
    }
}

run();
