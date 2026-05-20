// netlify/functions/oauth-token.js
// Troca o "code" OAuth pelo Access Token de forma segura no servidor.
// O APP_SECRET nunca é exposto ao browser.

export const handler = async (event) => {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Método não permitido" }) };
  }

  try {
    const { code, redirect_uri, app_id } = JSON.parse(event.body || "{}");

    if (!code || !redirect_uri || !app_id) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: "Parâmetros obrigatórios: code, redirect_uri, app_id" }),
      };
    }

    // O APP_SECRET vem das variáveis de ambiente da Netlify (nunca do frontend)
    const appSecret = process.env.META_APP_SECRET;
    if (!appSecret) {
      return {
        statusCode: 500,
        headers: CORS,
        body: JSON.stringify({ error: "META_APP_SECRET não configurado nas variáveis de ambiente da Netlify." }),
      };
    }

    const url = new URL("https://api.instagram.com/oauth/access_token");
    url.searchParams.set("client_id", app_id);
    url.searchParams.set("redirect_uri", redirect_uri);
    url.searchParams.set("client_secret", appSecret);
    url.searchParams.set("code", code);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.error) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: data.error.message, code: data.error.code }),
      };
    }

    // Troca o short-lived token pelo long-lived token (60 dias)
    const longUrl = new URL("https://api.instagram.com/oauth/access_token");
    longUrl.searchParams.set("grant_type", "fb_exchange_token");
    longUrl.searchParams.set("client_id", app_id);
    longUrl.searchParams.set("client_secret", appSecret);
    longUrl.searchParams.set("fb_exchange_token", data.access_token);

    const longRes = await fetch(longUrl.toString());
    const longData = await longRes.json();

    const finalToken = longData.access_token || data.access_token;
    const expiresIn = longData.expires_in || data.expires_in || null;

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        access_token: finalToken,
        token_type: "bearer",
        expires_in: expiresIn,
        long_lived: !!longData.access_token,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: "Erro interno: " + err.message }),
    };
  }
};
