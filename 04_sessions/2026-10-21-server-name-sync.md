# 서버명 자동 동기화

- 사용자 요청: 텍스트 수정 시 중복 검사용 내부 서버명을 자동 갱신.
- 대상: ArcMap 서버명 라벨 첫 줄과 같은 그룹의 서버 구성 요소. 요소 ID는 고정, serverId/nameLabelId는 라벨 ID로 연결.
- 구현: Excalidraw onChange 구독, 텍스트 편집 종료 후 최신 장면을 기준으로 메타데이터 갱신. 별도 undo 단계 없이 텍스트 변경을 따르고 변경 시 Drawing dirty 표시. 동일 구독 중복 설치 방지 및 Drawing 종료 시 해제.
- 기존 라벨 메타데이터 보정, 중복/빈 이름 플래그와 알림, 원래 도형/추가 메타데이터 보존.
- 추가 명령 실행 전 동기화하여 변경 전 이름으로 중복 차단되는 문제 방지.
- 전용 스크립트는 registerAutostart로 최초 사용자 허용 후 Drawing 재열기 시 활성화. 현재 Drawing은 허용 여부와 무관하게 활성화.
- 검증: 배치 모의 테스트 10개, 동기화의 자동 이름 갱신·편집 종료·중복 및 회복·빈 이름·삭제·undo 유사 변경·고정 ID/도형·루프 방지·구독 중복 방지·종료 해제·뷰 격리·컴파일 통과.
- 실제 Obsidian 실행·재열기·저장·취소는 미검증. 후속 사용자 요청에 따라 코드를 커밋하고 개발 브랜치를 GitHub에 전송한다. main 병합은 하지 않는다.
- API 근거: 설치된 2.29.0 main.js의 registerAutostart/executeExecutable 및 [공식 onChange 문서](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props/excalidraw-api#onchange).
