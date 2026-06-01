import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';

// OpenAI SDK 단일 진입점
@Injectable()
export class OpenAIClient {
  private readonly logger = new Logger(OpenAIClient.name);
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(config: ConfigService) {
    this.client = new OpenAI({
      apiKey: config.getOrThrow<string>('OPENAI_API_KEY'),
    });
    this.model = config.get<string>('OPENAI_MODEL') ?? 'gpt-4.1-mini';
  }

  async chatWithTools(params: {
    system: string;
    user: string;
    tools: ChatCompletionTool[];
    toolChoice?: 'required' | 'auto' | 'none';
  }): Promise<ChatCompletion> {
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: params.system },
      { role: 'user', content: params.user },
    ];

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      tools: params.tools,
      tool_choice: params.toolChoice ?? 'required',
      temperature: 0.1, // 파싱 일관성
    });

    this.logger.debug(`OpenAI usage: ${JSON.stringify(response.usage)} (model=${this.model})`);

    return response;
  }
}
