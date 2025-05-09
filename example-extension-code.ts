// 확장 프로그램에서 사용할 코드 예시

// Ollama API를 프록시 서버를 통해 호출하는 함수
async function callOllamaViaProxy(prompt: string, model: string = "llama3:8b") {
  try {
    console.log("프록시 서버를 통해 Ollama API 호출 중...");
    
    const response = await fetch("http://localhost:3000/proxy/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false
      })
    });
    
    console.log("응답 상태:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API 오류:", errorText);
      return { success: false, error: `API 오류 (${response.status}): ${errorText}` };
    }
    
    const data = await response.json();
    console.log("API 응답 데이터:", data);
    
    if (data && data.response) {
      return { success: true, response: data.response };
    } else {
      console.error("API 응답 형식 오류:", data);
      return { success: false, error: "API 응답에 필요한 데이터가 없습니다" };
    }
  } catch (error: any) {
    console.error("API 호출 중 오류:", error);
    return { success: false, error: error.message };
  }
}

// 사용 예시
async function exampleUsage() {
  const result = await callOllamaViaProxy("Hello, world! Please give me a short greeting.");
  
  if (result.success) {
    console.log("Ollama 응답:", result.response);
    // 여기서 UI 업데이트 등의 작업 수행
  } else {
    console.error("오류 발생:", result.error);
    // 오류 처리 로직
  }
}

// 함수 실행
// exampleUsage();

// 또는 이벤트 핸들러에서 호출
document.getElementById('generate-button')?.addEventListener('click', async () => {
  const promptInput = document.getElementById('prompt-input') as HTMLInputElement;
  const prompt = promptInput?.value || "Hello, world!";
  
  const result = await callOllamaViaProxy(prompt);
  
  if (result.success) {
    const outputElement = document.getElementById('output');
    if (outputElement) {
      outputElement.textContent = result.response;
    }
  } else {
    alert(`Error: ${result.error}`);
  }
});
