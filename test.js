import http from 'k6/http';
import { sleep } from 'k6';

const vUserCount = 10

export const options = {
  vus: vUserCount,
  duration: '10s',
};

// 도메인
const waitingQueueDomainLocal = "http://localhost:8080"
const waitingQueueDomainDev = "https://dev-waiting-queue-api.29cm.co.kr"
const waitingQueueDomainQa = "https://qa-waiting-queue-api.29cm.co.kr"
const waitingQueueDomain = waitingQueueDomainLocal

// 테스트 대상 userId (1~vUserCount)
const userIdList = [...Array(vUserCount).keys()].map(i => i + 1);

// 테스트 대상 itemId (1~120)
const itemIdList = [...Array(120).keys()].map(i => i + 1);

export default function () {
  // 0~1초 사이의 랜덤한 시간 동안 sleep
  let randomSleepTime = Math.random(); // 0과 1 사이의 랜덤 값
  sleep(randomSleepTime);

  // userId 임의 추출
  let userIdIndex = Math.floor(Math.random() * userIdList.length);
  let userId = userIdList[userIdIndex];

  // itemId 임의 추출 선택
  let itemIdIndex = Math.floor(Math.random() * itemIdList.length);
  let itemId = itemIdList[itemIdIndex];

  // 대기열 등록 API 호출
  // 대기열 등록 url
  const registerUrl = `${waitingQueueDomain}/api/v4/waiting-queue/test/${itemId}?userId=${userId}`;

  // 빈 데이터 전송
  const registerPayload = '';

  // 요청에 사용할 헤더 설정
  const registerParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // 대기열 등록 요청
  const registerResponse = http.post(registerUrl, registerPayload, registerParams);

  // 응답 본문을 JSON으로 파싱
  const registerJsonResponse = JSON.parse(registerResponse.body);

  // waitingQueueToken 값을 추출
  const waitingQueueToken = registerJsonResponse.data.waitingQueueToken;

  // 입장 여부 초기화
  let isAllowedEntrance = false

  // 입장이 불가능하다면 반복
  while(!isAllowedEntrance) {
    // 대기열 조회 API 호출 (입장열 진입 시 종료)
    const searchUrl = `${waitingQueueDomain}/api/v4/waiting-queue/test/${itemId}?userId=${userId}&waitingQueueToken=${waitingQueueToken}`;

    const searchParams = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // 대기열 정보 조회 요청
    const searchResponse = http.get(searchUrl, searchParams);

    // 응답 본문을 JSON으로 파싱
    const searchJsonResponse = JSON.parse(searchResponse.body);

    // 입장 여부 갱신
    isAllowedEntrance = searchJsonResponse.data.isAllowedEntrance

    // 5초 슬립
    sleep(5);
  }
}
