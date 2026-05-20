// netlify/functions/ig-proxy.js
// Proxy seguro para chamadas à Instagram Graph API.
// Repassa a requisição ao Meta e devolve a resposta.
// Isso evita bloqueios de CORS e mantém os tokens do lado do servidor.

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

    // Garante que o path começa com /
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const apiUrl = `https://graph.facebook.com/v19.0${cleanPath}`;

    let fetchOptions;

    if (method === "GET") {
      // Para polling do status do container
      const queryString = reqBody
        ? Object.entries(reqBody)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join("&")
        : "";
      const fullUrl = queryString ? `${apiUrl}?${queryString}` : apiUrl;
      fetchOptions = { method: "GET" };
      const response = await fetch(fullUrl, fetchOptions);
      const data = await response.json();
      return {
        statusCode: response.status,
        headers: { ...CORS, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      };
    } else {
      // POST para criar container ou publicar
      fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody || {}),
      };
      const response = await fetch(apiUrl, fetchOptions);
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
