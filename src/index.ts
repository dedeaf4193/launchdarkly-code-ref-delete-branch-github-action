import * as core from "@actions/core";
import * as github from "@actions/github";

export async function fetchWithRetry(
  request: Request,
  { maxRetries = 5, baseDelay = 1000, logger = console.log }: {
    maxRetries?: number;
    baseDelay?: number;
    logger?: (message: string) => void;
  } = {}
) {
  let attempt = 0;

  while (attempt <= maxRetries) {
    const cloned = request.clone();
    try {
      const response = await fetch(cloned);

      // Retry on 429 or transient 5xx
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        const retryAfterHeader =
          response.headers.get("Retry-After") || response.headers.get("X-Ratelimit-Reset");
        const retryAfter =
          !retryAfterHeader || isNaN(parseInt(retryAfterHeader, 10))
            ? baseDelay
            : parseInt(retryAfterHeader, 10);

        logger(
          `⚠️ Received ${response.status}, retrying in ${retryAfter}ms (attempt ${attempt + 1}/${maxRetries})...`
        );
        await new Promise((r) => setTimeout(r, retryAfter));
        attempt++;
        continue;
      }

      return response; // success or non-retryable
    } catch (err) {
      if (attempt < maxRetries) {
        const delay = baseDelay * 2 ** attempt;
        logger(
          `⚠️ Network error: ${err instanceof Error ? err.message : String(err)}. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`
        );
        await new Promise((r) => setTimeout(r, delay));
        attempt++;
        continue;
      }
      throw err;
    }
  }

  throw new Error(`Request failed after ${maxRetries} retries`);
}

export async function deleteBranch(
  token: string,
  repoKey: string,
  ref: string,
  baseUri: string = "https://app.launchdarkly.com"
) {
  const url = new URL(`/api/v2/code-refs/repositories/${encodeURIComponent(repoKey)}/branch-delete-tasks`, baseUri).toString();

  const body = JSON.stringify([ref]);
  const request = new Request(url, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body,
  });

  const res = await fetchWithRetry(request, { logger: core.info });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LD API error ${res.status}: ${text || res.statusText}`);
  }

  return res;
}

export async function run() {
  try {
    const token = core.getInput("access-token", { required: true });
    const baseUri = core.getInput("base-uri") || "https://app.launchdarkly.com";
    const ghRepoName =
      github.context?.payload?.repository?.name || process.env.GITHUB_REPOSITORY?.split("/")?.[1];
    const repoKey = core.getInput("repo") || ghRepoName;

    const event = github.context?.payload || {};
    const refType = event.ref_type;
    const ref = core.getInput("branch") || event.ref;

    if (!repoKey) throw new Error("Repository key not found");
    if (!ref) throw new Error("Branch ref not found");
    if (github.context.eventName === "delete" && refType && refType !== "branch") {
      core.info(`Skipping non-branch delete event (ref_type=${refType})`);
      return;
    }

    core.info(`Deleting LaunchDarkly Code Refs branch '${ref}' in repo '${repoKey}'...`);

    await deleteBranch(token, repoKey, ref, baseUri);

    core.info("✅ LaunchDarkly Code Refs branch delete queued successfully.");
  } catch (err) {
    core.setFailed(`Action failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// Only run automatically if not in test environment
if (process.env.NODE_ENV !== 'test') {
  run();
}