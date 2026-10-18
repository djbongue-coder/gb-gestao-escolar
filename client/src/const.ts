import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Start the Manus OAuth login. Call this from an event handler or effect at the
// moment you want to navigate, e.g. `onClick={() => startLogin()}`.
//
// It has SIDE EFFECTS — it mints a one-time nonce, writes the __Host- state
// cookie, and navigates immediately — so the cookie nonce always matches the
// `state` it sends. Do NOT call it during render (no `href={startLogin()}` /
// `loginUrl={...}`): each call overwrites the cookie, so a stray render-phase
// call would desync it from an in-flight login and the callback would reject it
// with "invalid oauth state". It returns void by design, so there is no URL to
// stash across renders.
export const startLogin = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  // Sem estas variáveis (ex.: ambiente local sem .env) a URL dá "Invalid URL" e
  // o botão morre em silêncio. Falamos alto para não haver diagnóstico mystery.
  if (!oauthPortalUrl || !appId) {
    const faltando = [!oauthPortalUrl && "VITE_OAUTH_PORTAL_URL", !appId && "VITE_APP_ID"].filter(Boolean).join(" e ");
    console.error(`[auth] Login não configurado — falta: ${faltando}. Copia .env.example para .env (ver README).`);
    alert(`Login não configurado neste ambiente.\n\nFalta definir: ${faltando}\n\nCopia ".env.example" para ".env" e preenche (ver README).`);
    return;
  }

  const nonce = crypto.randomUUID();
  document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`;
  const state = encodeOAuthState({ redirectUri, nonce });

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  window.location.href = url.toString();
};
