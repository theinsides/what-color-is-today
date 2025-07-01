# Color Quiz Backend

A Node.js backend for the Color Quiz application that stores user color choices and provides global statistics.

## Features

- Store user color choices for each day of the week
- Retrieve global statistics showing popular colors
- RESTful API endpoints
- MongoDB integration

## API Endpoints

- `POST /api/submit-response` - Submit a user's color choice
- `GET /api/global-stats` - Get global color statistics
- `GET /health` - Health check endpoint

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. The server will run on `http://localhost:3000`

## Deployment on Render

1. **Connect your repository** to Render
2. **Create a new Web Service**
3. **Configure the service**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

4. **Set Environment Variables** (if using MongoDB Atlas):
   - `MONGODB_URI`: Your MongoDB connection string
   - `DB_NAME`: Your database name (optional, defaults to 'colorquiz')
   - `NODE_ENV`: Set to 'production'

5. **Deploy** the service

## Environment Variables

- `MONGODB_URI`: MongoDB connection string (default: mongodb://localhost:27017)
- `DB_NAME`: Database name (default: colorquiz)
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

## Dependencies

- Express.js - Web framework
- MongoDB Driver - Database driver
- CORS - Cross-origin resource sharing 