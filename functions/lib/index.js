"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onCallGenkit = void 0;
// v2 https 모듈 API
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
// Secret 정의 (배포 시 firebase functions:secrets:set GOOGLE_API_KEY 로 주입)
const GOOGLE_API_KEY = (0, params_1.defineSecret)("GOOGLE_API_KEY");
// region, secrets 등 옵션은 첫 번째 인자에 넣습니다.
exports.onCallGenkit = (0, https_1.onCall)({
    region: "asia-east1", // 필요 시 리전 지정
    secrets: [GOOGLE_API_KEY], // v2: runWith 대신 여기서 secrets 주입
}, async (request) => {
    // 시크릿 읽기
    const apiKeyFromParam = GOOGLE_API_KEY.value();
    // 사용하지 않는 변수 제거
    // const apiKeyFromEnv = process.env.GOOGLE_API_KEY;
    const prompt = request.data?.prompt ?? "";
    // TODO: apiKey로 외부 호출 or Genkit 초기화 등
    // await someCall({ apiKey: apiKeyFromParam, prompt });
    return {
        ok: true,
        used: apiKeyFromParam ? "param" : "env",
        promptLength: prompt.length,
    };
});
