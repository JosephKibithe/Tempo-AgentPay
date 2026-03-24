import { execFile } from 'child_process';
import { homedir } from 'os';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface MppRequestInput {
  url: string;
  method?: 'GET' | 'POST';
  body?: any;
  dryRun?: boolean;
}

export interface MppRequestParams {
  headers?: Record<string, string>;
}

export type MppRequestResult = {
  success: true;
  data: unknown;
  raw: string;
} | {
  success: false;
  error: string;
  raw?: string;
}

export class MppPaymentAdapter {
  async execute(request: MppRequestInput, options?: MppRequestParams): Promise<MppRequestResult> {
    const tempoBin = `${homedir()}/.tempo/bin/tempo`;
    const args = ['request'];

    if (request.dryRun) {
      args.push('--dry-run');
    }

    args.push('-j', '-X', request.method || 'GET');

    if (request.body) {
      args.push('--json', JSON.stringify(request.body));
    }

    if (options?.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        args.push('-H', `${key}: ${value}`);
      }
    }

    args.push(request.url);

    try {
      const { stdout } = await execFileAsync(tempoBin, args, { maxBuffer: 1024 * 1024 * 4 });
      const parsed = JSON.parse(stdout);

      return {
        success: true,
        data: parsed,
        raw: stdout
      };
    } catch (error: any) {
      const raw = error?.stdout || error?.stderr;

      return {
        success: false,
        error: error.message || String(error),
        ...(typeof raw === 'string' ? { raw } : {})
      };
    }
  }
}
