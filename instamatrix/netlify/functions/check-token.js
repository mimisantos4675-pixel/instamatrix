// netlify/functions/check-token.js
// Verifica se um Access Token é válido e retorna info da conta Instagram.

export const handler = async (event) => {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  try {
    const { access_token, ig_id } = JSON.parse(event.body || "{}");

    if (!access_token || !ig_id) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: "access_token e ig_id são obrigatórios" }),
      };
    }

    // Verifica o token e busca info da conta
    const url = `https://graph.facebook.com/v19.0/${ig_id}?fields=id,username,name,followers_count,media_count&access_token=${encodeURIComponent(access_token)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({
          valid: false,
          error: data.error.message,
          error_code: data.error.code,
        }),
      };
    }

    // Verifica expiração do token
    const debugUrl = `https://graph.facebook.com/v19.0/debug_token?input_token=${encodeURIComponent(access_token)}&access_token=${encodeURIComponent(access_token)}`;
    const debugRes = await fetch(debugUrl);
    const debugData = await debugRes.json();
    const tokenInfo = debugData.data || {};

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        valid: true,
        account: {
          id: data.id,
          username: data.username,
          name: data.name,
          followers: data.followers_count,
          media_count: data.media_count,
        },
        token: {
          expires_at: tokenInfo.expires_at ? new Date(tokenInfo.expires_at * 1000).toISOString() : null,
          is_valid: tokenInfo.is_valid !== false,
          scopes: tokenInfo.scopes || [],
        },
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
