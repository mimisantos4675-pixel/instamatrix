// netlify/functions/oauth-token.js
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  try {
    const { code, redirect_uri, app_id } = JSON.parse(event.body || "{}");
    const appSecret = process.env.META_APP_SECRET;

    // Troca code por short-lived token
    const params = new URLSearchParams();
    params.append("client_id", app_id);
    params.append("client_secret", appSecret);
    params.append("grant_type", "authorization_code");
    params.append("redirect_uri", redirect_uri);
    params.append("code", code);

    const r = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: params,
    });
    const d = await r.json();

    if (d.error_type) throw new Error(d.error_message);
    if (!d.access_token) throw new Error("Token não recebido");

    // Troca por long-lived token (60 dias) via graph.instagram.com
    const longUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${d.access_token}`;
    const longR = await fetch(longUrl);
    const longD = await longR.json();

    const finalToken = longD.access_token || d.access_token;

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        access_token: finalToken,
        user_id: d.user_id,
        long_lived: !!longD.access_token,
        expires_in: longD.expires_in || null,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
