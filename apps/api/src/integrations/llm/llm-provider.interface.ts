export interface AgentToolDeclaration {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface AgentToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: AgentToolCall[];
  toolCallId?: string;
  toolResult?: any;
}

export interface LLMResponse {
  text: string;
  toolCalls?: AgentToolCall[];
}

export interface LLMProvider {
  generateResponse(
    messages: AgentMessage[],
    tools: AgentToolDeclaration[],
    systemPrompt: string
  ): Promise<LLMResponse>;
}
