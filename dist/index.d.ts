export declare function fetchWithRetry(request: Request, { maxRetries, baseDelay, logger }?: {
    maxRetries?: number;
    baseDelay?: number;
    logger?: (message: string) => void;
}): Promise<Response>;
export declare function deleteBranch(token: string, repoKey: string, ref: string, baseUri?: string): Promise<Response>;
export declare function run(): Promise<void>;
