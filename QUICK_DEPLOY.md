# 🚀 Quick Deployment Guide

## Prerequisites Ready ✅

You need:
1. ✅ **MongoDB Atlas** account → [Create here](https://www.mongodb.com/cloud/atlas/register)
2. ✅ **Google Gemini API Key** → [Get here](https://makersuite.google.com/app/apikey)
3. ✅ **Vercel** account → [Sign up here](https://vercel.com/signup)
4. ✅ **GitHub** account → [Sign up here](https://github.com/signup)

## Step-by-Step Deployment

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for deployment"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

### Step 2: Get MongoDB Connection String

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/...`)

### Step 3: Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the API key

### Step 4: Deploy Backend to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Go to backend directory
cd backend-node

# Login to Vercel
vercel login

# Deploy
vercel
```

**Follow the prompts:**
- Link to existing project? → **No**
- What's your project name? → **rationaleiq-backend** (or your choice)
- In which directory is your code located? → **./**
- Want to override settings? → **No**

**After deployment, add environment variables:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your backend project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `MONGODB_URI` | Your MongoDB connection string | Production |
   | `GEMINI_API_KEY` | Your Gemini API key | Production |
   | `JWT_SECRET` | Generate random 32+ char string | Production |
   | `NODE_ENV` | `production` | Production |
   | `PORT` | `8000` | Production |

5. **Save** and **Redeploy** → Click "Deployments" → "Redeploy"

**Copy your backend URL**: `https://your-backend.vercel.app`

### Step 5: Deploy Frontend to Vercel

```bash
# Go to frontend directory
cd ../frontend

# Deploy
vercel
```

**Follow the prompts:**
- Link to existing project? → **No**
- What's your project name? → **rationaleiq** (or your choice)
- In which directory is your code located? → **./**
- Want to override settings? → **No**

**After deployment, add environment variable:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your frontend project
3. Go to **Settings** → **Environment Variables**
4. Add this variable:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `VITE_API_URL` | Your backend URL from Step 4 | Production |

5. **Save** and **Redeploy**

**Copy your frontend URL**: `https://your-app.vercel.app`

### Step 6: Update Backend CORS

1. Go back to **backend** project in Vercel
2. Go to **Settings** → **Environment Variables**
3. Add/Update these variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `ALLOWED_ORIGINS` | Your frontend URL from Step 5 | Production |
   | `FRONTEND_URL` | Your frontend URL from Step 5 | Production |

4. **Save** and **Redeploy**

### Step 7: Test Your Deployment! 🎉

1. Visit your frontend URL: `https://your-app.vercel.app`
2. Click **"Don't have an account? Sign up"**
3. Create a new account (username, password)
4. Enter your Gemini API key when prompted
5. Try uploading a sample document from `sample-projects/`
6. Watch the AI extract decisions!

## 🎯 Troubleshooting

### ❌ Frontend can't connect to backend
- Check `VITE_API_URL` in frontend Vercel settings
- Ensure backend URL is correct (no trailing slash)
- Check browser console for errors

### ❌ Backend errors
- Verify `MONGODB_URI` is correct
- Verify `GEMINI_API_KEY` is valid
- Check Vercel function logs in dashboard

### ❌ CORS errors
- Ensure `ALLOWED_ORIGINS` includes your frontend URL
- Make sure there are no typos in URLs
- Both URLs should use `https://` (not `http://`)

## ✅ Success Checklist

- [ ] Backend deployed to Vercel
- [ ] Frontend deployed to Vercel
- [ ] All environment variables set
- [ ] Can create an account
- [ ] Can add Gemini API key
- [ ] Can upload and process documents
- [ ] Can view extracted decisions
- [ ] Search works
- [ ] Projects work

## 🎊 You're Live!

Share your deployed app:
- Frontend: `https://your-app.vercel.app`
- Your portfolio is now more impressive!

---

**Need help?** Check `DEPLOYMENT_READY.md` for detailed information or `README.md` for full documentation.
