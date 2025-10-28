# RationaleIQ - AI-Powered Decision Archive# RationaleIQ - Decision Rationale Archive



![RationaleIQ](https://img.shields.io/badge/AI-Gemini_1.5-blue?style=for-the-badge)A SaaS platform that automatically **captures, explains, and organizes decision rationales** made within an organization — so teams never forget *why* they made a choice.

![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge)

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)## 🎯 Features

![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)

- **Upload/Import Workspace Data**: Import meeting transcripts, chat logs, or text notes

A SaaS platform that automatically **captures, explains, and organizes decision rationales** made within organizations — so teams never forget *why* they made a choice.- **AI-based Decision Extraction**: Gemini API analyzes text to identify decisions and reasoning

- **Rationale Summary & Categorization**: AI summarizes and tags each rationale

## ✨ Features- **Searchable Decision Memory**: Vector-based semantic search for past decisions

- **Simple Dashboard UI**: Clean interface to view and filter all decisions

- **🚀 AI-Powered Decision Extraction**: Upload meeting transcripts, documents, or notes and let Gemini AI identify all decisions

- **📊 Smart Categorization**: Automatically categorize decisions by type (Technical, Cost, Strategic, etc.)## 🛠️ Tech Stack

- **🔍 Semantic Search**: Find decisions using natural language queries

- **📁 Project Organization**: Group related decisions into projects for better organization- **Frontend**: React + Vite + Tailwind CSS

- **🎨 Beautiful UI**: Modern, responsive interface with dark mode support- **Backend**: FastAPI (Python)

- **👥 Multi-Tenant**: Secure user authentication with complete data isolation- **Database**: SQLite (PostgreSQL ready)

- **💡 AI Analysis**: Get alternative perspectives, explanations, and flowcharts for complex decisions- **AI API**: Google Gemini 1.5 Flash/Pro

- **Embeddings**: sentence-transformers (MiniLM-L6-v2)

## 🛠️ Tech Stack- **Vector DB**: ChromaDB

- **Auth**: Firebase (optional for MVP)

### Frontend

- **React 18** with Vite for lightning-fast builds## 🚀 Quick Start

- **Tailwind CSS** for modern, responsive design

- **React Router v6** for navigation### Prerequisites

- **Lucide React** for beautiful icons

- **Axios** for API communication- Python 3.9+

- Node.js 18+

### Backend- Google Gemini API Key

- **Node.js** with Express.js

- **MongoDB Atlas** for cloud database### Backend Setup

- **Google Gemini 1.5** for AI-powered analysis

- **JWT** for secure authentication```powershell

- **Multer** for file uploads# Navigate to backend directory

cd backend

## 🚀 Quick Start

# Create virtual environment

### Prerequisitespython -m venv venv



- Node.js 18+ installed# Activate virtual environment

- MongoDB Atlas account (free tier works).\venv\Scripts\activate

- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

# Install dependencies

### Installationpip install -r requirements.txt



1. **Clone the repository**# Create .env file and add your Gemini API key

```bashecho "GEMINI_API_KEY=your_api_key_here" > .env

git clone https://github.com/yourusername/rationaleiq.git

cd rationaleiq# Run the server

```uvicorn main:app --reload

```

2. **Backend Setup**

```bash### Frontend Setup

cd backend-node

npm install```powershell

# Navigate to frontend directory

# Create .env file from examplecd frontend

cp .env.example .env

# Install dependencies

# Edit .env and add your credentials:npm install

# - MONGODB_URI (from MongoDB Atlas)

# - GEMINI_API_KEY (from Google AI Studio)# Run development server

# - JWT_SECRET (generate a random string)npm run dev

``````



3. **Frontend Setup**## 📁 Project Structure

```bash

cd ../frontend```

npm installRationaleIQ/

├── backend/

# Create .env file (optional for local development)│   ├── main.py              # FastAPI application

cp .env.example .env│   ├── models.py            # Database models

```│   ├── schemas.py           # Pydantic schemas

│   ├── database.py          # Database configuration

4. **Run Development Servers**│   ├── gemini_service.py    # Gemini API integration

│   ├── embedding_service.py # Vector embeddings

**Terminal 1 - Backend:**│   ├── requirements.txt     # Python dependencies

```bash│   └── .env                 # Environment variables

cd backend-node├── frontend/

npm start│   ├── src/

```│   │   ├── components/      # React components

│   │   ├── pages/           # Page components

**Terminal 2 - Frontend:**│   │   ├── services/        # API services

```bash│   │   └── App.jsx          # Main app component

cd frontend│   ├── package.json

npm run dev│   └── vite.config.js

```└── README.md

```

5. **Open your browser** to `http://localhost:5173`

## 🔑 Configuration

## 📦 Deployment to Vercel

Create a `.env` file in the backend directory:

### Backend Deployment

```env

1. **Create a new Vercel project** for the backendGEMINI_API_KEY=your_gemini_api_key

```bashDATABASE_URL=sqlite:///./rationaleiq.db

cd backend-node```

vercel

```## 📖 Usage



2. **Set environment variables** in Vercel dashboard:1. **Register/Login** to the platform

   - `MONGODB_URI`: Your MongoDB Atlas connection string2. **Upload** a meeting transcript or paste text

   - `GEMINI_API_KEY`: Your Gemini API key3. **Process** the document with AI

   - `JWT_SECRET`: A random secret string (minimum 32 characters)4. **View** extracted decisions in the dashboard

   - `ALLOWED_ORIGINS`: Your frontend URL (e.g., `https://your-app.vercel.app`)5. **Search** for specific decisions using natural language

   - `FRONTEND_URL`: Your frontend URL

## 🎯 MVP Success Criteria

3. **Deploy:**

```bash- ⏱️ Processing speed: < 10s per 1K words

vercel --prod- 🎯 Accuracy: > 80% correct decision extraction

```- 💾 Usability: Users can search "why X" and retrieve correct rationale

- 💬 Satisfaction: > 75% of beta users find summaries useful

### Frontend Deployment

## 🔮 Future Enhancements

1. **Update API URL** in frontend/.env:

```env- Outcome tracking for decisions

VITE_API_URL=https://your-backend.vercel.app- Rationale evolution analysis

```- Team collaboration features

- Slack/Google Meet/Notion integrations

2. **Create a new Vercel project** for the frontend- Local AI mode with Mistral

```bash

cd frontend## 📄 License

vercel

```MIT License


3. **Deploy:**
```bash
vercel --prod
```

4. **Update CORS** in backend .env with your frontend URL

## 📁 Project Structure

```
RationaleIQ/
├── backend-node/
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── models/            # MongoDB schemas
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth & error handling
│   │   └── server.js          # Entry point
│   ├── .env.example
│   ├── package.json
│   └── vercel.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service layer
│   │   ├── context/           # React context (theme)
│   │   ├── hooks/             # Custom hooks
│   │   ├── utils/             # Utility functions
│   │   └── App.jsx            # Root component
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── sample-projects/           # Example project documents
└── README.md
```

## 🎯 Usage Guide

### 1. First-Time Setup
- Create an account or sign in
- Enter your Gemini API key (stored locally in your browser)

### 2. Upload Documents
- Navigate to **Upload** page
- Upload meeting transcripts, documents (.txt, .md, .pdf, .docx)
- Or paste text directly
- Optionally assign to a project

### 3. AI Processing
- RationaleIQ analyzes your document
- Extracts all decisions and their rationales
- Categorizes and summarizes each decision

### 4. View & Search
- Browse decisions in the **Dashboard**
- Use **Search** to find specific decisions
- View detailed analysis for each decision
- Get AI-powered explanations and alternatives

### 5. Organize with Projects
- Create projects to group related decisions
- Add documents to projects
- View project-specific decision timelines

## 🔐 Security Features

- ✅ **JWT Authentication**: Secure user sessions
- ✅ **Password Hashing**: bcrypt for secure password storage
- ✅ **Multi-Tenant Data Isolation**: Users can only access their own data
- ✅ **CORS Protection**: Whitelist-based cross-origin requests
- ✅ **Input Validation**: All user inputs are validated
- ✅ **MongoDB Injection Protection**: Mongoose schema validation

## 🌟 Key Features

### AI Analysis
- **Explain Decision**: Get detailed explanations of the reasoning
- **Alternative Analysis**: See different perspectives and alternatives considered
- **Flowchart View**: Visualize decision factors and impacts
- **Chat with Decision**: Ask questions about the decision

### Organization
- **Projects**: Group related decisions
- **Tags & Categories**: Automatic categorization
- **Recently Viewed**: Quick access to recent decisions
- **Search**: Semantic search across all decisions

### User Experience
- **Dark Mode**: Full dark theme support
- **Responsive Design**: Works on all devices
- **Keyboard Shortcuts**: Power user features
- **Real-time Updates**: See changes immediately

## 🔑 Environment Variables

### Backend (.env)
```env
MONGODB_URI=          # MongoDB connection string
GEMINI_API_KEY=       # Google Gemini API key
PORT=8000             # Server port
NODE_ENV=production   # Environment
ALLOWED_ORIGINS=      # Comma-separated allowed origins
JWT_SECRET=           # JWT signing secret
FRONTEND_URL=         # Frontend URL
```

### Frontend (.env)
```env
VITE_API_URL=         # Backend API URL
```

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB connection string
- Verify Gemini API key is valid
- Ensure PORT is not in use

### Frontend can't connect to backend
- Verify VITE_API_URL in frontend/.env
- Check CORS settings in backend
- Ensure backend is running

### Authentication issues
- Clear browser localStorage
- Regenerate JWT_SECRET
- Check JWT token expiration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- MongoDB Atlas for cloud database
- Vercel for hosting platform
- All open-source libraries used in this project

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using AI and modern web technologies**
