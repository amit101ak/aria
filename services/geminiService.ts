
import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters, Part, Content, GenerationConfig, GenerateImagesResponse } from "@google/genai";
import { UnifiedAiDefinition, AiModelParams, AttachedFileContent, SecureNote, GamificationState, Quest, Achievement } from "../types";

const GENERAL_MODEL_NAME = "gemini-2.5-flash";
const IMAGE_GEN_MODEL_NAME = "imagen-3.0-generate-002";

interface ExtendedAiModelParams extends AiModelParams {
    responseMimeType?: "application/json" | "text/plain";
    thinkingConfig?: { thinkingBudget: number };
}

export class GeminiService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      console.error("API key is missing. Gemini Service will not function.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  private async generateStream(params: GenerateContentParameters): Promise<AsyncIterable<GenerateContentResponse>> {
    if (!this.ai) {
        throw new Error("Gemini AI client not initialized. API Key might be missing.");
    }
    return this.ai.models.generateContentStream(params);
  }

  private buildCoreGenerationConfig(modelParams?: ExtendedAiModelParams): any {
    const config: any = {};
    if (modelParams) {
      if (modelParams.temperature !== undefined) config.temperature = modelParams.temperature;
      if (modelParams.topK !== undefined) config.topK = modelParams.topK;
      if (modelParams.topP !== undefined) config.topP = modelParams.topP;
      if (modelParams.responseMimeType) config.responseMimeType = modelParams.responseMimeType;
      if (modelParams.thinkingConfig) config.thinkingConfig = modelParams.thinkingConfig;
    }
    return config;
  }
  
  async generateContentStream(
    prompt: string,
    aiDefinition: UnifiedAiDefinition,
    history: Content[],
    imageData?: { mimeType: string; data: string },
    videoData?: { mimeType: string; data: string },
    attachedTextFile?: AttachedFileContent,
    customSystemInstructionAddon?: string,
    modelParams?: ExtendedAiModelParams,
    useSearch: boolean = false,
    uiState?: string,
    secureNotes?: SecureNote[],
    gamificationState?: GamificationState,
    quests?: Quest[],
    achievements?: Achievement[]
  ): Promise<AsyncIterable<GenerateContentResponse>> {
    
    // 1. Build message parts
    const currentMessageParts: Part[] = [];

    if (imageData) {
      currentMessageParts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.data } });
    }
    if (videoData) {
      currentMessageParts.push({ inlineData: { mimeType: videoData.mimeType, data: videoData.data } });
    }

    let textPartContent = prompt;
    if (attachedTextFile) {
      const fileContext = `The user has attached a file named "${attachedTextFile.fileName}". Its content is:\n\n"""\n${attachedTextFile.textContent}\n"""\n\nUser's question or instruction related to this file (or general query):`;
      textPartContent = `${fileContext}\n${prompt}`;
    }
    
    const finalText = textPartContent.trim();
    if (finalText || currentMessageParts.length > 0) {
        currentMessageParts.push({ text: finalText || " " });
    }

    const contentsForRequest: Content[] = [...history, { role: "user", parts: currentMessageParts }];
    
    // 2. Build generation config
    const coreConfig = this.buildCoreGenerationConfig(modelParams);
    if (useSearch) {
      if (coreConfig.responseMimeType === 'application/json') {
          delete coreConfig.responseMimeType;
      }
      coreConfig.tools = [{googleSearch: {}}];
    }
    
    let finalSystemInstruction = aiDefinition.systemInstruction;
    
    if (gamificationState) {
        finalSystemInstruction += `\n\nUSER_GAME_STATE: This is the user's current progress. Do not show raw data. Use it to inform your responses.
- Level: ${gamificationState.level}
- XP: ${Math.floor(gamificationState.xp)} / ${gamificationState.xpToNextLevel}
- Active Quests: ${JSON.stringify(quests?.filter(q => !q.completed).map(q => q.title) || [])}
- Unlocked Achievements: ${JSON.stringify(achievements?.filter(a => a.unlocked).map(a => a.title) || [])}`;
    }

    if (secureNotes && secureNotes.length > 0) {
        finalSystemInstruction += `\n\nEXISTING_SECURE_ITEMS: This is a list of secure items that have been created. Use this to check for existing items by name. Do not show this list to the user unless they ask for it. Format: [{id, name, type}, ...]\n${JSON.stringify(secureNotes.map(({id, name, type}) => ({id, name, type})))}`;
    }

    if (uiState) {
        finalSystemInstruction += `\n\nCURRENT_UI_STATE: This is the current state of all UI windows, represented as a JSON array. Use this to inform your decisions (e.g., to check if a window for an item is already open). Do not show this to the user. \n${uiState}`;
    }
    if (customSystemInstructionAddon && customSystemInstructionAddon.trim()) {
      finalSystemInstruction += `\n\nADDITIONAL SESSION INSTRUCTIONS:\n${customSystemInstructionAddon.trim()}`;
    }

    // 3. Create request and generate content
    const requestParams: GenerateContentParameters = {
      model: GENERAL_MODEL_NAME,
      contents: contentsForRequest,
      config: {
        ...coreConfig,
        systemInstruction: finalSystemInstruction,
      },
    };

    return this.generateStream(requestParams);
  }

  async generateImage(prompt: string): Promise<string> {
    if (!this.ai) {
        throw new Error("Gemini AI client not initialized. API Key might be missing.");
    }
    
    try {
        const response: GenerateImagesResponse = await this.ai.models.generateImages({
            model: IMAGE_GEN_MODEL_NAME,
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes; // This is the base64 string
        } else {
            throw new Error("No image was generated. The response may be empty or contain safety blocks.");
        }
    } catch (error) {
        console.error("Error generating image:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate image: ${error.message}`);
        }
        throw new Error("An unknown error occurred during image generation.");
    }
  }
}
