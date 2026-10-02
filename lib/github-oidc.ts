import { createPublicKey, verify } from "node:crypto";

type GitHubOidcClaims = {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  repository?: string;
  repository_visibility?: string;
  ref?: string;
  event_name?: string;
  workflow_ref?: string;
};

type GitHubJwk = {
  kid: string;
  kty: string;
  n: string;
  e: string;
  alg?: string;
  use?: string;
};

let jwksCache: { expiresAt: number; keys: GitHubJwk[] } | null = null;

function base64UrlDecode(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

async function getGitHubKeys(): Promise<GitHubJwk[]> {
  if (jwksCache && jwksCache.expiresAt > Date.now()) {
    return jwksCache.keys;
  }

  const response = await fetch(
    "https://token.actions.githubusercontent.com/.well-known/jwks",
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Не вдалося отримати ключі GitHub OIDC");
  }

  const data = (await response.json()) as { keys?: GitHubJwk[] };

  if (!Array.isArray(data.keys) || data.keys.length === 0) {
    throw new Error("GitHub OIDC не повернув ключів");
  }

  jwksCache = {
    keys: data.keys,
    expiresAt: Date.now() + 10 * 60 * 1000
  };

  return data.keys;
}

function hasAudience(claims: GitHubOidcClaims, expected: string): boolean {
  return Array.isArray(claims.aud)
    ? claims.aud.includes(expected)
    : claims.aud === expected;
}

export async function verifyGitHubOidcToken(token: string): Promise<GitHubOidcClaims> {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Некоректний GitHub OIDC токен");
  }

  let header: { alg?: string; kid?: string };
  let claims: GitHubOidcClaims;

  try {
    header = JSON.parse(base64UrlDecode(parts[0]).toString("utf8"));
    claims = JSON.parse(base64UrlDecode(parts[1]).toString("utf8"));
  } catch {
    throw new Error("Некоректний формат GitHub OIDC токена");
  }

  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Непідтримуваний GitHub OIDC токен");
  }

  const keys = await getGitHubKeys();
  let jwk = keys.find((key) => key.kid === header.kid);

  if (!jwk) {
    jwksCache = null;
    const refreshedKeys = await getGitHubKeys();
    jwk = refreshedKeys.find((key) => key.kid === header.kid);
  }

  if (!jwk) {
    throw new Error("Ключ GitHub OIDC не знайдено");
  }

  return verifyWithKey(parts, jwk, claims);
}

function verifyWithKey(
  parts: string[],
  jwk: GitHubJwk,
  claims: GitHubOidcClaims
): GitHubOidcClaims {
  const publicKey = createPublicKey({
    key: jwk as unknown as JsonWebKey,
    format: "jwk"
  });

  const signature = base64UrlDecode(parts[2]);
  const signedData = Buffer.from(`${parts[0]}.${parts[1]}`, "utf8");

  if (!verify("RSA-SHA256", signedData, publicKey, signature)) {
    throw new Error("Недійсний підпис GitHub OIDC");
  }

  const now = Math.floor(Date.now() / 1000);

  if (claims.iss !== "https://token.actions.githubusercontent.com") {
    throw new Error("Невірний видавець GitHub OIDC");
  }

  if (!hasAudience(claims, "https://prostoshop.online")) {
    throw new Error("Невірна аудиторія GitHub OIDC");
  }

  if (!claims.exp || claims.exp <= now) {
    throw new Error("GitHub OIDC токен прострочений");
  }

  if (claims.nbf && claims.nbf > now + 30) {
    throw new Error("GitHub OIDC токен ще не чинний");
  }

  if (claims.repository !== "seregachuhleb1981-stack/oksa-marketplace") {
    throw new Error("Невірний GitHub репозиторій");
  }

  if (claims.repository_visibility !== "public") {
    throw new Error("Невірна видимість GitHub репозиторію");
  }

  if (claims.ref !== "refs/heads/main") {
    throw new Error("GitHub workflow дозволений лише з main");
  }

  if (claims.event_name !== "schedule" && claims.event_name !== "workflow_dispatch") {
    throw new Error("Недозволений тип запуску GitHub workflow");
  }

  if (
    claims.workflow_ref !==
    "seregachuhleb1981-stack/oksa-marketplace/.github/workflows/supplier-import.yml@refs/heads/main"
  ) {
    throw new Error("Недозволений GitHub workflow");
  }

  return claims;
}
