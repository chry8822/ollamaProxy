import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { Request, Response } from "express";

const app = express();

// CORS 설정
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE", "PATCH"],
    allowedHeaders: "*",
    credentials: true,
  })
);

// JSON 요청 본문 파싱
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Ollama API URL 설정 - IPv4 명시적 사용
const OLLAMA_API_URL = "http://127.0.0.1:11434";

// Ollama API 생성 엔드포인트
app.post("/proxy/generate", async (req: Request, res: Response) => {
  try {
    const requestBody = req.body;
    console.log("[Proxy] Received request for model:", requestBody.model);

    console.log(
      "[Proxy] Sending request to Ollama API at:",
      `${OLLAMA_API_URL}/api/generate`
    );

    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[Proxy] Ollama API response status: ${response.status}`);

    if (!response.ok) {
      console.error(
        `[Proxy] Ollama API error: ${response.status} ${response.statusText}`
      );
      const errorText = await response.text();
      console.error("[Proxy] Error details:", errorText);
      return res.status(response.status).send(errorText);
    }

    const data = await response.json();
    console.log("[Proxy] Ollama response received successfully");

    res.json(data);
  } catch (error) {
    console.error("[Proxy] Server error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
});

// Ollama API 모델 목록 엔드포인트
app.get("/proxy/tags", async (req: Request, res: Response) => {
  try {
    console.log("[Proxy] Fetching model tags from Ollama");
    const response = await fetch(`${OLLAMA_API_URL}/api/tags`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Proxy] Failed to fetch tags:", errorText);
      return res.status(response.status).send(errorText);
    }

    const data = await response.json();
    console.log("[Proxy] Successfully retrieved model tags");
    res.json(data);
  } catch (error) {
    console.error("[Proxy] Error fetching tags:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// 프록시 서버 상태 확인 엔드포인트
app.get("/status", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "Ollama proxy server is running",
    timestamp: new Date().toISOString(),
    ollamaUrl: OLLAMA_API_URL,
  });
});

// 테스트용 에코 엔드포인트
app.post("/echo", (req: Request, res: Response) => {
  console.log("[Proxy] Echo request received:", req.body);
  res.json({
    message: "Echo successful",
    receivedData: req.body,
    headers: req.headers,
  });
});

// Ollama 서버 상태 확인
app.get("/check-ollama", async (req: Request, res: Response) => {
  try {
    console.log("[Proxy] Checking Ollama server status...");
    const response = await fetch(`${OLLAMA_API_URL}/api/version`);

    if (!response.ok) {
      return res.status(503).json({
        status: "error",
        message: `Ollama server returned status ${response.status}`,
        details: await response.text(),
      });
    }

    const data = await response.json();
    return res.json({
      status: "ok",
      message: "Ollama server is running",
      version: data.version,
    });
  } catch (error) {
    console.error("[Proxy] Failed to connect to Ollama:", error);
    return res.status(503).json({
      status: "error",
      message: "Cannot connect to Ollama server",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// 서버 시작
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`[Proxy] Server running at http://localhost:${PORT}`);
  console.log(`[Proxy] Using Ollama API at ${OLLAMA_API_URL}`);

  // 시작 시 Ollama 서버 연결 테스트
  fetch(`${OLLAMA_API_URL}/api/version`)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(`Server responded with ${response.status}`);
    })
    .then((data) => {
      console.log(
        `[Proxy] Connected to Ollama version ${data.version} successfully!`
      );
    })
    .catch((error) => {
      console.error(
        `[Proxy] WARNING: Cannot connect to Ollama server at ${OLLAMA_API_URL}!`
      );
      console.error(`[Proxy] Error details: ${error.message}`);
      console.error(
        "[Proxy] Please make sure Ollama is running before using the proxy."
      );
    });
});

// 에러 처리
process.on("uncaughtException", (error) => {
  console.error("[Proxy] Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[Proxy] Unhandled Rejection at:", promise, "reason:", reason);
});
