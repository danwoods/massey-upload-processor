import { S3Event, S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { parseBuffer } from 'music-metadata';
import OpenAI from 'openai';

interface TrackInfo {
  id?: string;
  title?: string;
  dateCreated?: string;
  bpm?: number;
  key?: string;
  chordProgression?: string;
  description?: string;
  tags?: string[];
  notes?: string;
  isFeatured?: boolean;
  isHidden?: boolean;
  duration?: number;
}

interface AudioMetadata {
  duration?: number;
  format?: string;
  title?: string;
}

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const handler: S3Handler = async (event: S3Event) => {
  console.log('Processing S3 event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    try {
      await processRecord(record);
    } catch (error) {
      console.error('Error processing record:', error);
      // Continue processing other records even if one fails
    }
  }
};

async function processRecord(record: any) {
  const bucketName = record.s3.bucket.name;
  const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
  
  console.log(`Processing: ${bucketName}/${objectKey}`);

  // Check if file is in top-level project folder
  const pathParts = objectKey.split('/');
  if (pathParts.length !== 2) {
    console.log(`Ignoring subfolder file: ${objectKey}`);
    return;
  }

  const [projectFolder, fileName] = pathParts;
  
  // Check if it's an audio file
  if (!isAudioFile(fileName)) {
    console.log(`Not an audio file: ${fileName}`);
    return;
  }

  // Check if cover already exists
  const coverExists = await checkCoverExists(bucketName, projectFolder);
  if (coverExists) {
    console.log(`Cover already exists for project: ${projectFolder}`);
    return;
  }

  // Get project data
  const projectData = await getProjectData(bucketName, projectFolder, objectKey);
  
  // Generate album art
  await generateAndUploadCover(bucketName, projectFolder, projectData);
}

function isAudioFile(fileName: string): boolean {
  const audioExtensions = ['.mp3', '.flac', '.wav'];
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return audioExtensions.includes(extension);
}

async function checkCoverExists(bucketName: string, projectFolder: string): Promise<boolean> {
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: `${projectFolder}/`,
      Delimiter: '/',
    });

    const response = await s3Client.send(listCommand);
    const objects = response.Contents || [];

    return objects.some(obj => {
      const fileName = obj.Key?.split('/').pop()?.toLowerCase() || '';
      return fileName.startsWith('cover.') && (fileName.endsWith('.jpg') || fileName.endsWith('.png'));
    });
  } catch (error) {
    console.error('Error checking for existing cover:', error);
    return false;
  }
}

async function getProjectData(bucketName: string, projectFolder: string, audioKey: string) {
  const data: any = {};

  // Try to get info.json
  try {
    const infoCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: `${projectFolder}/info.json`,
    });
    
    const infoResponse = await s3Client.send(infoCommand);
    if (infoResponse.Body) {
      const infoContent = await streamToString(infoResponse.Body);
      const trackInfo: TrackInfo = JSON.parse(infoContent);
      data.trackInfo = trackInfo;
    }
  } catch (error) {
    console.log('No info.json found or error reading it:', error);
  }

  // Get audio metadata
  try {
    const audioCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: audioKey,
    });
    
    const audioResponse = await s3Client.send(audioCommand);
    if (audioResponse.Body) {
      const audioBuffer = await streamToBuffer(audioResponse.Body);
      const metadata = await parseBuffer(audioBuffer);
      
      data.audioMetadata = {
        duration: metadata.format.duration,
        format: metadata.format.container,
        title: metadata.common.title,
      };
    }
  } catch (error) {
    console.error('Error reading audio metadata:', error);
  }

  // Extract title from filename as fallback
  const fileName = audioKey.split('/').pop() || '';
  data.fallbackTitle = fileName.replace(/\.[^/.]+$/, ''); // Remove extension

  return data;
}

async function generateAndUploadCover(bucketName: string, projectFolder: string, projectData: any) {
  // Build AI prompt
  const prompt = buildPrompt(projectData);
  console.log('Generated prompt:', prompt);

  try {
    // Generate image with OpenAI
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });

    const imageUrl = response.data[0].url;
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    // Download the generated image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Upload to S3
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: `${projectFolder}/cover.png`,
      Body: imageBuffer,
      ContentType: 'image/png',
    });

    await s3Client.send(putCommand);
    console.log(`Successfully uploaded cover for project: ${projectFolder}`);

  } catch (error) {
    console.error('Error generating or uploading cover:', error);
    throw error;
  }
}

function buildPrompt(projectData: any): string {
  const trackInfo = projectData.trackInfo || {};
  const audioMetadata = projectData.audioMetadata || {};
  
  // Get title (priority: info.json > audio metadata > filename)
  const title = trackInfo.title || audioMetadata.title || projectData.fallbackTitle || 'Untitled Track';
  
  // Get description
  const description = trackInfo.description || 'An experimental and creative musical piece';
  
  // Get tags
  const tags = trackInfo.tags && trackInfo.tags.length > 0 
    ? trackInfo.tags.join(', ') 
    : 'experimental, creative';

  return `You are an award-winning concert artist. You have been asked to create the album art for a new single from one of the world's biggest bands. It should be bleeding-edge contemporary, but instantly classic. The song's title is "${title}", and it's described as "${description}", and tagged as "${tags}". The art style should reflect the track. The title should be prominently displayed, in the style of the rest of the art.`;
}

// Helper functions
async function streamToString(stream: any): Promise<string> {
  const chunks: any[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: any[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}