# 확장안과 검증할 사업 방향

상태: 기존 대화의 제안 정리 / 확정 구현 범위 아님

## AI Drawing

진행 상황: [POC-001](../06_validation/POC-001-library-placement/RESULT.md)에서 AI 없이 라이브러리 Web 심볼을 DMZ에 자동 배치하는 첫 단계에 성공했다. 로컬 Qwen 명령 해석과 업무·담당자 연결은 후속 검증 대상이다.
자연어 → AI Planner → 구조화 명령 → Symbol Catalog → 배치·Drawing 실행기 → Draft Preview → 검토·Publish.

LLM은 의도를 해석하고, 실행기는 좌표·아이콘 복제·Element ID·라벨을 처리하는 방향이다. 전용 Symbol Catalog의 이름·별칭·타입과 Library Item을 연결한다. ExcalidrawAutomate 활용은 과거 제안이며 API 지원·호환성을 이번 기록 작업에서 검증하지 않았다. AI가 만든 객체·관계는 곧바로 Registry의 확정 사실이 되지 않는다.

## Architecture OS
ArchMap을 사람과 AI의 공통 화면, Registry를 의미정보, Obsidian을 장기 지식, CMDB·SBOM·CVE를 도구, LLM Kernel을 조정자로 두는 확장안이다.

Vulnerability Agent, Change Copilot, Architecture Auditor가 후속 제안이다. 기존 Knowledge Transfer가 폐기된 것은 아니다. 자연어 조회·강조·Draft와 공식 Publish·원천 변경의 권한을 분리하는 제품 설계가 논의되었다. LLM OS 명칭이나 Agent 구성 자체를 현재 제품의 확정 범위로 올리지 않는다.

## 사업 자산과 수익모델 후보
금융 IT 경험 → 방법론 → Adapter·Mapping·관계 사전·템플릿 → 고객 적용 → 레퍼런스 → 재사용 자산 축적이 경쟁력 가설이다. ‘Moat’는 입증된 독점력이나 기존 고객 실적을 뜻하지 않는다.

유료 진단·POC, 초기 구축·연계, 연간 라이선스·유지보수, 모듈 확장·교육을 검토한다. 가격·일정·특허·퇴직 전후 계획은 미확정이다. 과거 자료의 수치나 연도별 계획을 확정 목표로 채택하지 않는다.

## 다음 구체화 후보
실제 데이터로 Search → Locate → Zoom → Inspect 한 흐름을 검증할 수 있도록 첫 유스케이스와 지원 원천을 좁힌다. 최초 유스케이스는 아직 선택하지 않았다.
