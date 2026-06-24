/**
 * AWS Lambda Test Connection
 * ==========================
 * Endpoint untuk test koneksi / health check ke Lambda
 * 
 * Upload ke AWS Lambda via Console:
 * 1. Copy-paste code ini ke AWS Console Lambda Code Editor
 * 2. Handler: handler.test
 * 3. Save & Deploy
 */

exports.test = async (event) => {
  console.log("Testing Lambda connection...");

  try {
    // Simulasi processing time
    const processingTime = Math.random() * 100;
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        status: "SUCCESS",
        message: "Success connection to lambda ✓",
        timestamp: new Date().toISOString(),
        processingTime: `${processingTime.toFixed(2)}ms`,
        version: "1.0",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        status: "ERROR",
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
