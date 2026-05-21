// netlify/functions/ig-proxy.js
// Proxy seguro para chamadas à Instagram Graph API.

export const handler = async (event) => {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  try {
    const { path, method = "POST", body: reqBody } = JSON.parse(event.body || "{}");

    if (!path) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: "Parâmetro 'path' obrigatório (ex: /123456/media)" }),
      };
    }

    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    
    // Detecta o token para escolher a URL base correta
    const token = reqBody?.access_token || '';
    // Tokens IGAASpZ são da API Instagram básica, usar graph.instagram.com
    // Tokens EAA são do Facebook Graph API
    const baseUrl = token.startsWith('IGAAS') || token.startsWith('IGAASpZ') 
      ? `https://graph.instagram.com/v19.0${cleanPath}`
      : `https://graph.facebook.com/v19.0${cleanPath}`;

    let fetchOptions;

    if (method === "GET") {
      const queryString = reqBody
        ? Object.entries(reqBody)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join("&")
        : "";
      const fullUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;
      fetchOptions = { method: "GET" };
      const response = await fetch(fullUrl, fetchOptions);
      const data = await response.json();
      return {
        statusCode: response.status,
        headers: { ...CORS, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      };
    } else {
      fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody || {}),
      };
      const response = await fetch(baseUrl, fetchOptions);
      const data = await response.json();
      return {
        statusCode: response.status,
        headers: { ...CORS, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: "Erro interno no proxy: " + err.message }),
    };
  }
};
