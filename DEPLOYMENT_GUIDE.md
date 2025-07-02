# 🚀 Complete Working Deployment Guide

## 📋 **Prerequisites**
- Node.js (v18+)
- Python (v3.9+)
- MongoDB database
- Cloudinary account
- GROQ API account

## 🔧 **Step 1: Get GROQ API Keys**
1. Go to https://console.groq.com/
2. Sign up/Login
3. Generate 3 API keys (for rate limiting)
4. Copy the keys (they start with `gsk_`)

## 🔧 **Step 2: Configure ML Service**

### Local Development:
```bash
cd services
cp .env.example .env
```

Edit `.env` and add your GROQ API keys:
```
GROQ_API_KEY_1=gsk_your_actual_key_1_here
GROQ_API_KEY_2=gsk_your_actual_key_2_here
GROQ_API_KEY_3=gsk_your_actual_key_3_here
```

### For Render Deployment:
1. Go to your Render ML service dashboard
2. Environment tab
3. Add these variables:
   - `GROQ_API_KEY_1` = your_first_key
   - `GROQ_API_KEY_2` = your_second_key
   - `GROQ_API_KEY_3` = your_third_key
4. Deploy

## 🔧 **Step 3: Test the ML Service**

### Test Health Check:
```bash
curl https://casecrux.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "groq_keys_available": true,
  "groq_keys_count": 3,
  "service": "ml-summarization"
}
```

### Test Summarization:
```bash
curl -X POST https://casecrux.onrender.com/summarize_from_urls \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://example.com/test.pdf"]}'
```

## 🔧 **Step 4: Run the Complete System**

### Start Backend:
```bash
cd server
npm install
npm start
```

### Start Frontend:
```bash
cd client
npm install
npm run dev
```

### Start ML Service (if running locally):
```bash
cd services
pip install -r requirements.txt
./run.sh
```

## 📊 **System Status Indicators**

### ✅ Working System:
- Health endpoint returns `"groq_keys_available": true`
- Summarization returns actual AI-generated content
- No "Demo Mode" notifications in UI

### ⚠️ Demo Mode (No Errors):
- Health endpoint returns `"groq_keys_available": false`
- Summarization returns realistic demo content
- Blue "Demo Mode Active" notification appears
- All features work with sample data

### ❌ Broken System:
- Health endpoint returns 500 errors
- Summarization fails completely
- Red error messages in UI

## 🎯 **Expected Behavior**

### With Proper GROQ Keys:
1. Real AI summarization
2. Actual legal analysis
3. No demo notifications
4. Full functionality

### Without GROQ Keys (Demo Mode):
1. Realistic sample summaries
2. Professional-looking results
3. Clear demo notifications
4. Fully functional UI

## 🔍 **Troubleshooting**

### ML Service Returns 500:
- Check GROQ API keys in environment
- Verify keys are valid and have quota
- Check Render logs for specific errors

### Backend Proxy Issues:
- Verify `ML_SERVICE_URL` environment variable
- Check if ML service is accessible
- Look at backend console logs

### Frontend Issues:
- Verify `VITE_BACKEND_URL` in client/.env
- Check browser console for errors
- Ensure backend is running

## 🎉 **Success Criteria**

Your system is working correctly when:
1. ✅ No 500 errors anywhere
2. ✅ Users get professional summaries (real or demo)
3. ✅ Clear notifications about demo mode
4. ✅ All UI features function properly
5. ✅ Health checks pass

The system is designed to NEVER fail - it always provides useful results, whether in full AI mode or demo mode.
