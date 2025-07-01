const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/colorquiz', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Schema for user responses
const userResponseSchema = new mongoose.Schema({
    day: String,
    color: {
        hex: String,
        rgb: [Number],
        hsl: [Number]
    },
    timestamp: { type: Date, default: Date.now }
});

const UserResponse = mongoose.model('UserResponse', userResponseSchema);

// Routes
app.post('/api/submit-response', async (req, res) => {
    try {
        const { day, color } = req.body;
        const response = new UserResponse({ day, color });
        await response.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/global-stats', async (req, res) => {
    try {
        const stats = {};
        
        for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
            const dayStats = await UserResponse.aggregate([
                { $match: { day } },
                { $group: { _id: '$color.hex', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]);
            
            stats[day] = dayStats.reduce((acc, stat) => {
                acc[stat._id] = Math.round((stat.count / dayStats.reduce((sum, s) => sum + s.count, 0)) * 100);
                return acc;
            }, {});
        }
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 