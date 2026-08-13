import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  ChatCompletion,
  ChatCompletionCreateParams,
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

  /**
   * tool 없는 일반 텍스트 생성. 추천 메시지 같은 자유 서술용.
   */
  async chatText(params: { system: string; user: string }): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: params.user },
      ],
      temperature: 0.7,
    });

    this.logger.debug(`OpenAI usage (chatText): ${JSON.stringify(response.usage)}`);
    return response.choices[0]?.message.content?.trim() ?? '';
  }

  /**
   * 범용 chat 호출, 에이전트 루프용 - messages를 통째로 받고, tools 또는 response_format을 그대로 통과
   */
  async chat(params: {
    messages: ChatCompletionMessageParam[];
    tools?: ChatCompletionTool[];
    toolChoice?: 'auto' | 'required' | 'none';
    responseFormat?: ChatCompletionCreateParams['response_format'];
    temperature?: number;
  }): Promise<ChatCompletion> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: params.messages,
      ...(params.tools ? { tools: params.tools, tool_choice: params.toolChoice ?? 'auto' } : {}),
      ...(params.responseFormat ? { response_format: params.responseFormat } : {}),
      temperature: params.temperature ?? 0.3,
    });
    this.logger.debug(`OpenAI usage (chat): ${JSON.stringify(response.usage)}`);
    return response;
  }
}
