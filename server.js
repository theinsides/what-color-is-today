const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'colorquiz';
let db;

// Connect to MongoDB
async function connectToMongo() {
    try {
        const client = new MongoClient(mongoUrl);
        await client.connect();
        db = client.db(dbName);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        // Don't exit process in production, just log the error
        if (process.env.NODE_ENV === 'production') {
            console.log('Continuing without database connection...');
        } else {
            process.exit(1);
        }
    }
}

// Initialize database connection
connectToMongo();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.post('/api/submit-response', async (req, res) => {
    try {
        if (!db) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        const { day, color, city, country } = req.body;
        const response = {
            day,
            color,
            city: city || null,
            country: country || null,
            timestamp: new Date()
        };
        await db.collection('userResponses').insertOne(response);
        res.json({ success: true });
    } catch (error) {
        console.error('Error submitting response:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/global-stats', async (req, res) => {
    try {
        if (!db) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        const stats = {};
        for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
            const pipeline = [
                { $match: { day } },
                { $group: { _id: { hex: '$color.hex', city: '$city', country: '$country' }, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ];
            const dayStats = await db.collection('userResponses').aggregate(pipeline).toArray();
            // Aggregate by color hex for percentages
            const colorCounts = {};
            let total = 0;
            dayStats.forEach(stat => {
                const hex = stat._id.hex;
                colorCounts[hex] = (colorCounts[hex] || 0) + stat.count;
                total += stat.count;
            });
            // Find top city/country for each color
            const colorLocations = {};
            dayStats.forEach(stat => {
                const hex = stat._id.hex;
                const city = stat._id.city;
                const country = stat._id.country;
                if (!colorLocations[hex]) colorLocations[hex] = {};
                const locKey = [city, country].filter(Boolean).join(', ');
                if (!colorLocations[hex][locKey]) colorLocations[hex][locKey] = 0;
                colorLocations[hex][locKey] += stat.count;
            });
            // Find most popular location for each color
            const colorTopLocation = {};
            Object.keys(colorLocations).forEach(hex => {
                const locs = colorLocations[hex];
                let topLoc = '';
                let topCount = 0;
                Object.entries(locs).forEach(([loc, count]) => {
                    if (count > topCount) {
                        topLoc = loc;
                        topCount = count;
                    }
                });
                colorTopLocation[hex] = topLoc;
            });
            // Build stats object
            stats[day] = {};
            Object.keys(colorCounts).forEach(hex => {
                stats[day][hex] = {
                    percent: Math.round((colorCounts[hex] / total) * 100),
                    topLocation: colorTopLocation[hex]
                };
            });
        }
        res.json(stats);
    } catch (error) {
        console.error('Error getting global stats:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 