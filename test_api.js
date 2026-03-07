const axios = require('axios');
async function run() {
    try {
        const res = await axios.get('http://localhost:3005/admin/stats', {
            headers: { 'Authorization': 'Bearer test' }
        });
        console.log("SUCCESS:", JSON.stringify(res.data, null, 2).slice(0, 1000));
    } catch (e) {
        console.error("ERROR:", e.response ? e.response.data : e.message);
    }
}
run();
