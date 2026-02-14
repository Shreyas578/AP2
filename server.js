const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// In-memory store for refund requests
const refundRequests = [];

// Serve static files from the 'frontend' directory
app.use(express.static(path.join(__dirname, 'frontend')));

// API: Submit Refund Request (User)
app.post('/api/refund-request', (req, res) => {
    const { intentId, user, amount, reason } = req.body;

    // Check if already exists
    const exists = refundRequests.find(r => r.intentId === intentId);
    if (exists) {
        return res.json({ success: true, message: 'Request already pending' });
    }

    refundRequests.push({
        intentId,
        user,
        amount,
        reason,
        timestamp: Date.now(),
        status: 'pending'
    });

    console.log(`📝 Refund requested: ${intentId} from ${user}`);
    res.json({ success: true });
});

// API: Get Pending Requests (Merchant)
app.get('/api/refund-requests', (req, res) => {
    // In a real app, we would verify the merchant identity here.
    // For this demo, we return all pending requests.
    const pending = refundRequests.filter(r => r.status === 'pending');
    res.json(pending);
});

// API: Mark Request Processed (Merchant)
app.post('/api/refund-processed', (req, res) => {
    const { intentId } = req.body;
    const reqIndex = refundRequests.findIndex(r => r.intentId === intentId);
    if (reqIndex !== -1) {
        refundRequests[reqIndex].status = 'processed';
    }
    res.json({ success: true });
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Fallback for any other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
