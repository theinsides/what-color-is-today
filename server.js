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
        
        const { day, color } = req.body;
        const response = {
            day,
            color,
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
                { $group: { _id: '$color.hex', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ];
            
            const dayStats = await db.collection('userResponses').aggregate(pipeline).toArray();
            
            // Calculate percentages
            const totalCount = dayStats.reduce((sum, stat) => sum + stat.count, 0);
            stats[day] = dayStats.reduce((acc, stat) => {
                acc[stat._id] = Math.round((stat.count / totalCount) * 100);
                return acc;
            }, {});
        }
        
        res.json(stats);
    } catch (error) {
        console.error('Error getting global stats:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'color_day_quiz.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 