# 현재 상태

기준일: 2026-10-21 (한국 시간)

## 완료
- 비공개 GitHub 저장소 JinSofty/biz_Planning과 로컬 작업본 연결.
- 초기 문서·템플릿 생성 및 원격 전송 확인.
- 사용자가 설명한 금융회사·기업 IT 담당자, 지식 관리·아키텍처·CMDB·CVE 목적 반영.
- 다른 채팅방과 기존 산출물을 대조해 기술구조 기준선·수정 이력·확장안을 정리.
- POC-001: Excalidraw 2.29.0에서 라이브러리 Web 객체의 DMZ 배치 성공을 사용자가 확인. [결과](../06_validation/POC-001-library-placement/RESULT.md).

## 먼저 읽을 문서
1. [사업 정의](../01_business/OVERVIEW.md)
2. [기술구조 기준선](../01_business/ARCHITECTURE.md)
3. [결정 상태](../03_decisions/DEC-001-architecture-baseline.md)
4. [확장안](../01_business/OPTIONS.md), [출처 한계](../05_sources/2026-10-21-cross-chat-sources.md)

## 현재 단계
ArcMap 요소기술 검증 중. 첫 객체 배치는 실제 실행에 성공했다. 줌 탐색 UX, AI 연결, 제품 전체 구현과 고객 검증은 아직 완료하지 않았다.

## 다음 작업
1. POC-001 저장 후 재열기·실행 취소·그룹 이동·스타일 확인.
2. 줌 탐색: 위치 찾기·확대·계층 이동·상세정보 확인의 사용성과 성능 검증.
3. 배치 실행기와 구조화 명령을 분리하고 로컬 Qwen 연결 검토.
4. 첫 유스케이스·실제 CMDB/SBOM 연계·관계 및 Publish 정책 구체화.

## 미확정
최초 상품·유스케이스 우선순위, 가격·계약·매출 목표·일정, 상세 스키마, Publish 충돌/삭제 정책, AI/Architecture OS 구현 범위, 고객 배포 환경과 지원 범위.

커밋·원격 전송 여부는 Git 이력과 원격 브랜치 일치 여부로 확인한다.
