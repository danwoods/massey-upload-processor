# Massey Upload Processor

Automatically generates album art for audio files uploaded to S3 using AI image generation.

## Features

- 🎵 Monitors S3 bucket for audio uploads (MP3, FLAC, WAV)
- 🎨 Generates custom album art using OpenAI DALL-E 3
- 📁 Only processes top-level project folders (ignores subfolders)
- 🚫 Never overwrites existing cover files
- ⚡ Serverless AWS Lambda architecture
- 🔄 Auto-deploys on push to main branch

## Setup Instructions

### Prerequisites

1. **AWS Account** with appropriate permissions
2. **OpenAI API Key** for DALL-E 3 access
3. **Node.js 18+** and npm
4. **AWS CLI** configured with your credentials

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd massey-upload-processor
npm install
```

### 2. Configure GitHub Secrets

In your GitHub repository, go to Settings > Secrets and Variables > Actions and add:

- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key  
- `OPENAI_API_KEY` - Your OpenAI API key

### 3. Deploy

Push to the main branch to trigger automatic deployment:

```bash
git add .
git commit -m "Initial setup"
git push origin main
```

Or deploy manually:

```bash
npm run deploy
```

### 4. Verify Setup

After deployment, check:
- AWS Lambda function `MasseyUploadProcessorStack-UploadProcessor` exists
- S3 bucket `promoter-2` has event notifications configured
- CloudWatch logs show the function is ready

## Usage

### Folder Structure

Upload your audio projects to S3 with this structure:

```
promoter-2.s3.us-east-2.amazonaws.com/
├── daily-track-001/
│   ├── song.mp3          ← Triggers album art generation
│   ├── info.json         ← Optional metadata
│   ├── cover.png         ← Generated automatically
│   └── samples/          ← Ignored (subfolder)
│       └── kick.wav      ← Ignored
```

### info.json Format

Optional file to provide rich metadata for better album art:

```json
{
  "id": "track-001",
  "title": "Midnight Reflections",
  "dateCreated": "2024-01-15",
  "bpm": 120,
  "key": "Am",
  "chordProgression": "Am - F - C - G",
  "description": "A contemplative piece exploring themes of solitude and introspection",
  "tags": ["ambient", "electronic", "chill"],
  "notes": "Recorded late at night with analog synths",
  "isFeatured": false,
  "isHidden": false,
  "duration": 245
}
```

### What Gets Processed

✅ **Will Generate Cover:**
- `project-name/song.mp3`
- `project-name/track.flac` 
- `project-name/audio.wav`

❌ **Will Skip:**
- `project-name/samples/drum.wav` (subfolder)
- `project-name/cover.jpg` (cover exists)
- `project-name/readme.txt` (not audio)

## Configuration

### Changing AI Prompt

Edit the prompt template in `config/config.ts`:

```typescript
template: `Your custom prompt template with {title}, {description}, and {tags} placeholders`
```

### Adding AI Provider Fallbacks

The system is designed to support multiple AI providers. Currently supports:
- OpenAI DALL-E 3 (primary)
- Future: Anthropic, Stability AI, etc.

## Monitoring

### CloudWatch Logs

Monitor processing in AWS CloudWatch:
- Log Group: `/aws/lambda/MasseyUploadProcessorStack-UploadProcessor`
- Look for successful processing messages and any errors

### Troubleshooting

**Cover not generated?**
1. Check CloudWatch logs for errors
2. Verify OpenAI API key is valid
3. Ensure audio file is in top-level folder
4. Check that no cover file already exists

**Lambda timeout?**
- Large audio files may take longer to process
- Current timeout is 5 minutes
- Increase in `src/infrastructure/upload-processor-stack.ts` if needed

## Development

### Local Testing

```bash
# Build the project
npm run build

# Run tests (when added)
npm test

# Deploy to AWS
npm run deploy

# Clean up AWS resources
npm run destroy
```

### Project Structure

```
src/
├── infrastructure/          # AWS CDK infrastructure code
│   ├── app.ts              # CDK app entry point
│   └── upload-processor-stack.ts  # Lambda and S3 setup
├── lambda/                 # Lambda function code
│   ├── index.ts           # Main handler
│   └── package.json       # Lambda dependencies
└── config/                # Configuration files
    └── config.ts          # AI and prompt settings
```

## Cost Considerations

- **Lambda**: ~$0.20 per million requests + compute time
- **OpenAI DALL-E 3**: $0.040 per 1024×1024 image
- **S3**: Storage and request costs (minimal)

Estimated cost for 100 tracks/month: ~$5-10

## Security

- Lambda has minimal S3 permissions (read/write to promoter-2 bucket only)
- OpenAI API key stored as environment variable
- No internet access required except for OpenAI API
- All processing happens in AWS infrastructure