# 🎵 Massey Upload Processor - Setup Complete!

## What I've Built For You

A complete serverless system that automatically generates album art when you upload audio files to your S3 bucket.

### 🏗️ Architecture Created

```
S3 Upload (MP3/FLAC/WAV) → Lambda Trigger → AI Art Generation → Upload Cover
```

### 📁 Project Structure

```
massey-upload-processor/
├── .github/workflows/deploy.yml    # Auto-deploy on push to main
├── src/
│   ├── infrastructure/             # AWS CDK setup
│   └── lambda/                     # Processing function
├── config/config.ts               # Easy AI/prompt customization
├── examples/info.json             # Sample metadata format
└── scripts/test-setup.ts          # Environment validation
```

## 🚀 Quick Start

### 1. Set GitHub Secrets
In your repo: Settings > Secrets and Variables > Actions

Add these secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY` 
- `OPENAI_API_KEY`

### 2. Deploy
```bash
git push origin main
```

That's it! GitHub Actions will automatically deploy everything.

### 3. Test
Upload an audio file to: `promoter-2.s3.us-east-2.amazonaws.com/my-project/song.mp3`

Watch for `cover.png` to appear in the same folder!

## 🎯 Key Features Implemented

### ✅ Smart Processing
- **Only top-level folders**: Ignores samples/stems in subfolders
- **Never overwrites**: Skips if cover.jpg/cover.png already exists
- **Multi-format**: Supports MP3, FLAC, WAV

### ✅ Rich Metadata Support
Uses your `info.json` for better AI prompts:
```json
{
  "title": "Your Track Title",
  "description": "Creative description for AI",
  "tags": ["ambient", "electronic"]
}
```

### ✅ Fallback Strategy
- No info.json? Uses filename as title
- Missing description? Uses "experimental, creative"
- Always generates something meaningful

### ✅ AI Integration
- **Primary**: OpenAI DALL-E 3 (1024x1024, high quality)
- **Configurable**: Easy to add other providers later
- **Custom prompts**: Your exact template implemented

## 🔧 Customization

### Change AI Prompt
Edit `config/config.ts`:
```typescript
template: `Your custom prompt with {title}, {description}, {tags}`
```

### Monitor Processing
- **CloudWatch Logs**: `/aws/lambda/MasseyUploadProcessorStack-UploadProcessor`
- **Costs**: ~$0.04 per image generated + minimal Lambda/S3 costs

## 🛠️ Commands Available

```bash
npm run test-setup    # Validate AWS/OpenAI credentials
npm run deploy        # Manual deployment
npm run destroy       # Remove all AWS resources
npm run build         # Compile TypeScript
```

## 🎨 Example Workflow

1. **Create project folder**: `daily-track-001/`
2. **Add audio file**: `song.mp3`
3. **Add metadata** (optional): `info.json`
4. **Upload to S3**: Files appear in bucket
5. **Magic happens**: Lambda processes, generates art
6. **Result**: `cover.png` appears automatically

## 🔍 Troubleshooting

**Cover not generating?**
1. Check CloudWatch logs for errors
2. Verify file is in top-level folder (not subfolder)
3. Ensure no existing cover file
4. Validate OpenAI API key has credits

**Want to reprocess?**
Delete existing cover file and re-upload audio file.

## 🎯 What's Next?

The system is ready for your daily audio projects! Future enhancements could include:
- Multiple AI provider fallbacks
- Custom image dimensions per project
- Batch processing for existing files
- Email notifications on completion

---

**Ready to create some art? Upload your first track and watch the magic happen! 🎨**