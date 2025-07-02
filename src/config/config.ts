export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'stability';
  openai?: {
    apiKey: string;
    model: string;
    imageSize: '256x256' | '512x512' | '1024x1024';
    quality: 'standard' | 'hd';
  };
  // Future: Add other providers here
}

export interface PromptConfig {
  template: string;
  fallbackDescription: string;
  fallbackTags: string;
}

export const defaultConfig = {
  ai: {
    provider: 'openai' as const,
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'dall-e-3',
      imageSize: '1024x1024' as const,
      quality: 'standard' as const,
    },
  },
  prompt: {
    template: `You are an award-winning concert artist. You have been asked to create the album art for a new single from one of the world's biggest bands. It should be bleeding-edge contemporary, but instantly classic. The song's title is "{title}", and it's described as "{description}", and tagged as "{tags}". The art style should reflect the track. The title should be prominently displayed, in the style of the rest of the art.`,
    fallbackDescription: 'An experimental and creative musical piece',
    fallbackTags: 'experimental, creative',
  },
  output: {
    format: 'png' as const,
    filename: 'cover',
    overwriteExisting: false,
  },
};