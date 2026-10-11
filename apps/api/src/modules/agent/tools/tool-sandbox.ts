import { ALLOWED_TOOLS, ToolDefinition } from './tool-definitions.js';
import { AppError } from '../../../common/errors/app-error.js';
import { logger } from '../../../common/logging/logger.js';

export interface ToolExecutionRecord {
  toolName: string;
  arguments: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  durationMs: number;
}

export class ToolSandbox {
  private static readonly MAX_TOOL_STEPS_PER_TURN = 5;
  private static readonly EXECUTION_TIMEOUT_MS = 15000;

  /**
   * Executes an allowlisted tool within strict runtime security constraints.
   */
  public static async executeTool(
    toolName: string,
    rawArguments: Record<string, any>,
    context: { userId: string; currentStepCount: number }
  ): Promise<{ result?: any; error?: string; record: ToolExecutionRecord }> {
    const startTime = Date.now();

    // 1. Guard against tool call step exhaustion (FR-14)
    if (context.currentStepCount >= this.MAX_TOOL_STEPS_PER_TURN) {
      const errMessage = `Tool execution limit reached (${this.MAX_TOOL_STEPS_PER_TURN} steps per turn). No further tool calls permitted.`;
      logger.warn({ toolName, step: context.currentStepCount }, errMessage);
      return {
        error: errMessage,
        record: {
          toolName,
          arguments: rawArguments,
          error: errMessage,
          durationMs: Date.now() - startTime,
        },
      };
    }

    // 2. Strict Allowlist Guard (FR-14 & STRIDE: SC-14)
    const toolDef: ToolDefinition | undefined = ALLOWED_TOOLS[toolName];
    if (!toolDef) {
      const forbiddenMsg = `SECURITY GUARD: Tool "${toolName}" is NOT in the allowlisted sandbox. The AI Agent cannot execute payments, checkouts, or arbitrary commands.`;
      logger.error({ toolName, userId: context.userId }, 'Attempted unauthorized tool execution');
      return {
        error: forbiddenMsg,
        record: {
          toolName,
          arguments: rawArguments,
          error: forbiddenMsg,
          durationMs: Date.now() - startTime,
        },
      };
    }

    // 3. Strict Zod Schema Validation on Arguments
    const parsedArgs = toolDef.schema.safeParse(rawArguments);
    if (!parsedArgs.success) {
      const validationErrorMsg = `Invalid arguments for tool "${toolName}": ${JSON.stringify(
        parsedArgs.error.format()
      )}`;
      logger.warn(
        { toolName, validationError: parsedArgs.error.format() },
        'Tool argument validation failed'
      );
      return {
        error: validationErrorMsg,
        record: {
          toolName,
          arguments: rawArguments,
          error: validationErrorMsg,
          durationMs: Date.now() - startTime,
        },
      };
    }

    // 4. Time-bounded execution
    try {
      const executePromise = toolDef.execute(parsedArgs.data, { userId: context.userId });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new AppError(
                'TOOL_TIMEOUT',
                `Tool execution exceeded ${this.EXECUTION_TIMEOUT_MS}ms`,
                504
              )
            ),
          this.EXECUTION_TIMEOUT_MS
        )
      );

      const result = await Promise.race([executePromise, timeoutPromise]);
      const durationMs = Date.now() - startTime;

      logger.info({ toolName, durationMs }, 'Sandboxed tool executed successfully');

      return {
        result,
        record: {
          toolName,
          arguments: parsedArgs.data,
          result,
          durationMs,
        },
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err?.message || 'Tool execution encountered an internal error';
      logger.error({ toolName, err, durationMs }, 'Sandboxed tool execution failed');

      return {
        error: errorMsg,
        record: {
          toolName,
          arguments: parsedArgs.data,
          error: errorMsg,
          durationMs,
        },
      };
    }
  }

  /**
   * Returns tool declarations in standard JSON Schema format for LLM providers.
   */
  public static getToolDeclarations(): Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }> {
    return Object.values(ALLOWED_TOOLS).map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parametersJsonSchema,
    }));
  }
}
