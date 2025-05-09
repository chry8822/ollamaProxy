// 프록시 서버 테스트 스크립트
// 터미널에서 실행: node test-client.js

const fetch = require('node-fetch');

async function testProxy() {
  console.log('테스트 시작: Ollama 프록시 서버에 요청 보내기');
  
  try {
    // 1. 먼저 상태 확인
    console.log('1. 프록시 서버 상태 확인 중...');
    const statusResponse = await fetch('http://localhost:3000/status');
    const statusData = await statusResponse.json();
    console.log('상태 응답:', statusData);
    
    // 2. 에코 테스트
    console.log('\n2. 에코 테스트 중...');
    const echoResponse = await fetch('http://localhost:3000/echo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'Echo test data' })
    });
    const echoData = await echoResponse.json();
    console.log('에코 응답:', echoData);
    
    // 3. 모델 목록 확인
    console.log('\n3. Ollama 모델 목록 확인 중...');
    const tagsResponse = await fetch('http://localhost:3000/proxy/tags');
    const tagsData = await tagsResponse.json();
    console.log('태그 응답:', tagsData);
    
    // 4. 생성 API 테스트
    console.log('\n4. Ollama 생성 API 테스트 중...');
    const generateResponse = await fetch('http://localhost:3000/proxy/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3:8b',
        prompt: 'Hello, world!',
        stream: false
      })
    });
    
    console.log('생성 API 응답 상태:', generateResponse.status);
    
    if (generateResponse.ok) {
      const generateData = await generateResponse.json();
      console.log('생성 API 응답 데이터:', {
        model: generateData.model,
        response: generateData.response.substring(0, 100) + '...',
        created_at: generateData.created_at
      });
      console.log('테스트 성공! 프록시 서버가 올바르게 작동합니다.');
    } else {
      const errorText = await generateResponse.text();
      console.error('생성 API 오류:', errorText);
      console.log('프록시 서버는 작동하지만 Ollama API 응답에 문제가 있습니다.');
    }
    
  } catch (error) {
    console.error('테스트 중 오류 발생:', error);
    console.log('프록시 서버가 실행 중인지 확인하세요.');
  }
}

testProxy();
