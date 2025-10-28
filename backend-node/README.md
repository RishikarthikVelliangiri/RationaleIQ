# RationaleIQ Node.js Backend

Modern Node.js/Express backend with MongoDB Atlas and Google Gemini AI integration.

## Features

- ✅ Express REST API
- ✅ MongoDB Atlas connection
- ✅ Google Gemini AI for decision extraction
- ✅ Document processing & analysis
- ✅ Semantic search (basic text search, vector search ready)
- ✅ Dashboard statistics
- ✅ No authentication (single-user mode)

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **AI**: Google Gemini 1.5 Flash
- **ODM**: Mongoose

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   - Copy `.env.example` to `.env` (already created)
   - Add your Gemini API key to `GEMINI_API_KEY`
   - MongoDB URI is already configured

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Start production server**:
   ```bash
   npm start
   ```

## API Endpoints

### Health Check
- `GET /` - API status

### Documents
- `POST /api/documents` - Create document from text
- `POST /api/documents/upload` - Upload file
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get single document
- `POST /api/documents/:id/process` - Process document with AI

### Decisions
- `GET /api/decisions` - List all decisions
- `GET /api/decisions/:id` - Get single decision

### Search
- `GET /api/search?q=query` - Search decisions

### Dashboard
- `GET /api/dashboard/stats` - Get statistics

## Environment Variables

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
GEMINI_API_KEY=your-api-key
PORT=8000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode (with auto-reload)
npm run dev

# Run in production mode
npm start
```

## Project Structure

```
backend-node/
├── src/
│   ├── config/
│   │   └── database.js       # MongoDB connection
│   ├── models/
│   │   ├── Document.js       # Document schema
│   │   └── Decision.js       # Decision schema
│   ├── controllers/
│   │   ├── documentController.js
│   │   ├── decisionController.js
│   │   ├── searchController.js
│   │   └── dashboardController.js
│   ├── routes/
│   │   ├── documents.js
│   │   ├── decisions.js
│   │   ├── search.js
│   │   └── dashboard.js
│   ├── services/
│   │   ├── geminiService.js  # AI integration
│   │   └── embeddingService.js
│   └── server.js             # Entry point
├── .env                      # Environment config
├── .gitignore
├── package.json
└── README.md
```

## Notes

- Vector embeddings service is a placeholder - implement ChromaDB integration if needed
- Current search uses MongoDB text search - upgrade to vector search for better results
- No authentication - all data is shared (single-user mode)
