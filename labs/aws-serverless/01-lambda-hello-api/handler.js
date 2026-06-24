/**
 * AWS Lambda Hello API
 * =====================
 * Endpoint sederhana yang merespons dengan "Hello from Lambda"
 * 
 * Upload ke AWS Lambda via Console:
 * 1. Copy-paste code ini ke AWS Console Lambda Code Editor
 * 2. Handler: handler.main
 * 3. Save & Deploy
 */

exports.main = async (event) => {
  console.log("Event:", JSON.stringify(event));

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify({
      message: "Hello from Lambda! 🚀",
      timestamp: new Date().toISOString(),
      requestId: event.requestContext?.requestId || "unknown",
      version: "1.0",
    }),
  };
};
