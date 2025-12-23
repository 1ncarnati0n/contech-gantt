# ConstructionScheduler
## 건설공사 공정계획 및 관리 플랫폼 PRD

| 항목 | 내용 |
|------|------|
| 문서 버전 | v1.0 |
| 작성일 | 2024년 12월 |
| 대상 산업 | 건설업 (건축, 토목, 플랜트, 인프라) |
| 기술 스택 | TypeScript, React, Next.js, Supabase |

---

## 1. Executive Summary

ConstructionScheduler는 건설공사의 공정계획 수립부터 실시간 진행관리까지 전 과정을 지원하는 차세대 공정관리 플랫폼입니다. Oracle Primavera P6의 강력한 CPM(Critical Path Method) 엔진, Microsoft Project의 직관적인 사용자 경험, Asta Powerproject의 건설 특화 기능을 결합하여 한국 건설 현장에 최적화된 솔루션을 제공합니다.

### 1.1 핵심 가치 제안

- **건설 특화 CPM 스케줄링**: FS/FF/SS/SF 관계 유형, 리드/래그 타임, 제약조건 완벽 지원
- **직관적 간트차트 UX**: 드래그앤드롭 편집, 실시간 협업, 모바일 현장 업데이트
- **4D BIM 연동**: 3D 모델과 공정표 연계로 시공 시뮬레이션 시각화
- **AI 기반 최적화**: 공기단축, 자원평준화, 리스크 예측 자동화
- **한국 건설 환경 최적화**: 공휴일/악천후 캘린더, 협력사별 근무패턴, 한글 지원

### 1.2 참고 솔루션 벤치마킹

| 솔루션 | 핵심 강점 | 채택 기능 |
|--------|-----------|-----------|
| **Primavera P6** | 엔터프라이즈급 CPM, EVM, 포트폴리오 관리 | CPM 엔진, WBS, 베이스라인, 다중 캘린더 |
| **MS Project** | 직관적 UI, Office 연동, 학습 용이성 | 드래그앤드롭 UX, 익숙한 Excel 방식 편집 |
| **Asta Powerproject** | 건설 특화, 4D BIM, 협업 기능 | 작업별 다중 링크, 협력사 캘린더, 모바일앱 |
| **ALICE** | AI 기반 스케줄 최적화 | AI 최적화 엔진, What-if 시뮬레이션 |

> **출처**: Oracle Primavera P6 Documentation, Microsoft Project Documentation, Asta Powerproject Features (Elecosoft), ALICE Technologies

---

## 2. Product Vision & Goals

### 2.1 비전 선언문

> *"건설 현장의 모든 이해관계자가 실시간으로 공정 현황을 파악하고, AI 기반 의사결정 지원을 통해 예측 가능한 프로젝트 완수를 달성하는 것"*

### 2.2 핵심 목표

1. **공정 가시성 극대화**: 발주자, CM, 시공사, 협력사 간 실시간 정보 공유
2. **의사결정 시간 단축**: Critical Path 자동 분석 및 지연 영향 즉시 시각화
3. **협업 효율성 향상**: 문서 기반 → 데이터 기반 협업으로 전환
4. **예측 정확도 개선**: 과거 데이터 학습을 통한 공기 예측 신뢰도 향상

### 2.3 대상 사용자

| 사용자 그룹 | 역할 | 핵심 니즈 |
|-------------|------|-----------|
| 공정 관리자 | 마스터 스케줄 작성 및 관리 | 강력한 CPM 기능, 베이스라인 비교 |
| 현장 소장 | 전체 공정 현황 모니터링 | 대시보드, 리포팅, 지연 알림 |
| 공종별 담당자 | 담당 작업 진척률 입력 | 모바일 진척 입력, 간편한 UI |
| 협력사 | 자사 작업 일정 확인 및 보고 | 제한적 뷰어 권한, 작업 할당 알림 |
| 발주처/CM | 프로젝트 진행 상황 검토 | 읽기전용 대시보드, 주간/월간 보고서 |

---

## 3. Functional Requirements

### 3.1 스케줄링 엔진 (Core)

#### 3.1.1 CPM (Critical Path Method) 기능

- **Forward/Backward Pass 계산**: ES, EF, LS, LF, Total Float, Free Float 자동 산출
- **4가지 의존관계 유형**: FS (Finish-to-Start), SS (Start-to-Start), FF (Finish-to-Finish), SF (Start-to-Finish)
- **Lead/Lag Time**: 선/후행 관계에 시간 간격(+/-) 설정
- **제약조건 (Constraints)**: ASAP, ALAP, Start/Finish No Earlier/Later Than, Must Start/Finish On
- **Critical Path 하이라이팅**: 자동 식별 및 시각적 강조 (빨간색 바, 별도 필터)
- **Near-Critical Path**: 사용자 정의 Float 임계값 기반 준주공정 표시

> **출처**: Oracle Primavera P6 EPPM Documentation, CPM Scheduling Best Practices (Long International)

#### 3.1.2 WBS (Work Breakdown Structure)

- **계층 구조**: 무제한 깊이의 WBS 트리 지원
- **WBS 코드 체계**: 사용자 정의 코드 패턴 (예: 01.02.003)
- **요약 작업 (Summary Task)**: 하위 작업 기반 자동 일정 계산
- **롤업 표시**: 기간, 완료율, 비용의 상위 레벨 집계

#### 3.1.3 앵커 기반 의존성 시스템 (차별화 기능) ⭐

> 기존 스케줄링 소프트웨어의 한계를 극복하는 혁신적 기능으로, 작업의 시작/종료 시점이 아닌 **특정 일자(Day Point)**를 기준으로 의존관계를 설정할 수 있습니다.

- **Day-Point Anchor**: 작업 내 특정 일자를 앵커 포인트로 지정
- **유연한 연결**: 작업 A의 3일차 → 작업 B의 5일차 등 세밀한 연결
- **사용 사례**:
  - 콘크리트 양생 3일차에 거푸집 해체 시작
  - 도장 건조 2일차에 다음 공정 투입
  - 철근 배근 완료 50% 시점에 콘크리트 타설 준비

### 3.2 간트차트 인터페이스

#### 3.2.1 뷰어 기능

- **타임스케일 조정**: 일/주/월/분기/연도 단위 줌 인/아웃
- **열 커스터마이징**: 표시 열 선택, 순서 변경, 너비 조절
- **필터 & 그룹핑**: WBS, 담당자, 날짜 범위, 진행상태 기준
- **베이스라인 오버레이**: 최대 3개 베이스라인 동시 비교 표시
- **진척률 표시**: 바 내부 완료 비율 시각화

#### 3.2.2 편집 기능

- **드래그앤드롭**: 작업 바 이동으로 일정 변경
- **바 리사이즈**: 양 끝 드래그로 기간 조정
- **의존선 드로잉**: 바 사이 연결선 드래그로 관계 생성
- **인라인 편집**: 셀 더블클릭으로 직접 수정
- **대량 편집**: 다중 선택 후 일괄 수정
- **Undo/Redo**: 무제한 실행취소/재실행 히스토리

> **출처**: Asta Powerproject Features, MS Project UX Patterns

### 3.3 자원 관리 (Resource Management)

- **자원 유형**: 인력(Labor), 장비(Equipment), 자재(Material), 비용(Cost)
- **자원 캘린더**: 자원별 가용 시간, 휴무일 설정
- **자원 배정**: 작업에 자원 할당 및 사용량(단위/시간) 설정
- **자원 히스토그램**: 시간대별 자원 사용량 차트
- **과배정 감지**: 자원 초과 할당 시 경고
- **자원 평준화**: 자동/수동 평준화 알고리즘
- **S-Curve**: 누적 자원/비용 곡선 표시

### 3.4 캘린더 시스템

- **프로젝트 캘린더**: 기본 근무일/시간 정의
- **작업별 캘린더**: 특정 작업에 다른 캘린더 적용
- **한국 공휴일 기본 제공**: 법정 공휴일 자동 반영
- **우천/악천후 예외일**: 외부 작업용 날씨 기반 비가용일 설정
- **협력사별 캘린더**: 외주업체 근무패턴 개별 관리
- **교대 근무**: 1교대/2교대/3교대 패턴 지원

> **출처**: Asta Powerproject Subcontractor Calendars, Primavera P6 Calendar Configuration

### 3.5 베이스라인 & 버전 관리

- **베이스라인 저장**: 무제한 베이스라인 스냅샷
- **베이스라인 메타데이터**: 이름, 설명, 생성일, 생성자 기록
- **차이 분석**: 현재 vs 베이스라인 비교 (일정/비용)
- **Variance 계산**: Schedule Variance(SV), Cost Variance(CV)
- **버전 히스토리**: 모든 변경 이력 추적 및 롤백

### 3.6 4D BIM 연동

- **IFC 파일 Import**: IFC 2x3, IFC4 표준 지원
- **객체-작업 매핑**: BIM 객체와 공정표 작업 연결
- **시공 시뮬레이션**: 시간축 기반 3D 시공 과정 애니메이션
- **진척 시각화**: 완료/진행중/예정 객체 컬러 코딩
- **충돌 검토**: 공간-시간 기반 간섭 감지

> **출처**: Asta Powerproject BIM, 4D BIM Scheduling Techniques (TrueCADD)

### 3.7 EVM (Earned Value Management)

| 지표 | 의미 | 계산식 |
|------|------|--------|
| PV (BCWS) | 계획 가치 | 계획된 작업의 예산 |
| EV (BCWP) | 획득 가치 | 완료된 작업의 예산 |
| AC (ACWP) | 실제 비용 | 실제 지출 비용 |
| SV | 일정 차이 | EV - PV |
| CV | 비용 차이 | EV - AC |
| SPI | 일정 성과 지수 | EV / PV (≥1.0 양호) |
| CPI | 비용 성과 지수 | EV / AC (≥1.0 양호) |
| EAC | 완료 시 예상 비용 | BAC / CPI |

> **출처**: PMI PMBOK Guide, Primavera P6 EVM Documentation

### 3.8 AI 기능 (Future Phase)

- **공기 예측**: 진행 패턴 분석 기반 완료일 예측
- **지연 조기 경보**: Critical Path 위험 사전 알림
- **최적 시퀀싱**: AI 기반 작업 순서 최적화 제안
- **자원 최적화**: 자원 배치 최적화 시나리오 생성
- **What-if 시뮬레이션**: 변경 영향 분석 자동화

> **출처**: ALICE Technologies AI Optimization Features

---

## 4. Non-Functional Requirements

### 4.1 성능 (Performance)

| 항목 | 목표 | 측정 조건 |
|------|------|-----------|
| 초기 로딩 시간 | < 3초 | 10,000 작업 기준 |
| CPM 재계산 | < 1초 | 10,000 작업 기준 |
| 간트차트 스크롤 | 60 FPS | 가상화 적용 |
| 동시 접속자 | 500명/프로젝트 | 수평 확장 |
| 실시간 동기화 지연 | < 500ms | WebSocket |

### 4.2 확장성 (Scalability)

- **프로젝트당 최대 작업 수**: 100,000개
- **조직당 최대 프로젝트 수**: 무제한
- **파일 업로드 용량**: 500MB/파일
- **스토리지**: 100GB/조직 (추가 가능)

### 4.3 보안 (Security)

- **인증**: OAuth 2.0, SAML 2.0, MFA
- **권한**: RBAC (역할 기반 접근 제어)
- **암호화**: 전송 중(TLS 1.3), 저장 시(AES-256)
- **감사 로그**: 모든 데이터 변경 이력 기록
- **규정 준수**: 개인정보보호법, ISO 27001

### 4.4 가용성 (Availability)

- **SLA**: 99.9% 가동률
- **백업**: 일 1회 자동 백업, 30일 보관
- **재해복구**: RPO 1시간, RTO 4시간

---

## 5. Integration Requirements

### 5.1 Import/Export

| 포맷 | Import | Export |
|------|--------|--------|
| Primavera P6 (.xer) | ✓ 완전 지원 | ✓ 완전 지원 |
| MS Project (.mpp, .xml) | ✓ 완전 지원 | ✓ 완전 지원 |
| Excel (.xlsx) | ✓ 템플릿 기반 | ✓ 맞춤 형식 |
| IFC (BIM) | ✓ IFC 2x3, IFC4 | - 뷰어 전용 |
| PDF 보고서 | - | ✓ 맞춤 템플릿 |

### 5.2 외부 시스템 연동

- **REST API**: 전체 기능 API 제공, OpenAPI 3.0 문서화
- **Webhook**: 이벤트 기반 알림 (작업 생성/수정/완료 등)
- **ERP 연동**: SAP, Oracle EBS 커넥터
- **그룹웨어 연동**: 카카오워크, MS Teams, Slack 알림
- **클라우드 스토리지**: AWS S3, Google Cloud Storage, NAS

---

## 6. User Interface Requirements

### 6.1 웹 애플리케이션

- **반응형 레이아웃**: 1280px ~ 4K 해상도 지원
- **브라우저 지원**: Chrome, Edge, Safari, Firefox 최신 2개 버전
- **다크 모드**: 시스템 설정 연동 또는 수동 전환
- **키보드 단축키**: 주요 작업 단축키 지원
- **다국어**: 한국어(기본), 영어, 일본어

### 6.2 모바일 애플리케이션

- **플랫폼**: iOS 15+, Android 12+
- **핵심 기능**: 진척률 입력, 사진 첨부, 일정 확인, 알림
- **오프라인 모드**: 데이터 캐싱 및 동기화
- **푸시 알림**: 작업 할당, 지연 경고, 승인 요청

### 6.3 대시보드

- **프로젝트 개요**: 전체 진행률, 주요 마일스톤, SPI/CPI
- **Critical Path 요약**: 주공정 작업 목록 및 지연 현황
- **자원 현황**: 자원 가동률, 과배정 경고
- **위젯 커스터마이징**: 드래그앤드롭 위젯 배치
- **실시간 갱신**: 자동 새로고침 또는 실시간 업데이트

---

## 7. Reporting & Analytics

### 7.1 기본 제공 보고서

1. **공정 현황 보고서**: 전체 진행률, WBS별 진척, 지연 작업 목록
2. **Critical Path 보고서**: 주공정 작업, Float 분석, 지연 영향
3. **자원 보고서**: 자원 배정 현황, 히스토그램, 과배정 분석
4. **EVM 보고서**: SPI, CPI, S-Curve, 예상 완료일
5. **베이스라인 비교 보고서**: 일정/비용 차이 분석
6. **주간/월간 요약 보고서**: 경영진용 요약 대시보드

### 7.2 맞춤 보고서

- **보고서 빌더**: 드래그앤드롭 보고서 디자이너
- **필터 및 그룹핑**: 다차원 데이터 필터링
- **차트 유형**: 바, 라인, 파이, 히스토그램, S-Curve
- **스케줄링**: 자동 생성 및 이메일 발송

---

## 8. Development Roadmap

| Phase | 기간 | 주요 기능 |
|-------|------|-----------|
| **Phase 1** | MVP (6개월) | 간트차트 핵심 기능, CPM 엔진, WBS, 의존관계, 베이스라인, 기본 보고서 |
| **Phase 2** | 확장 (4개월) | 자원관리, 다중 캘린더, EVM, 앵커 기반 의존성, 협업 기능 |
| **Phase 3** | 고급 기능 (4개월) | 4D BIM 연동, P6/MPP Import/Export, 모바일 앱, 맞춤 보고서 |
| **Phase 4** | AI & 포트폴리오 (6개월) | AI 최적화 엔진, 포트폴리오 관리, 고급 분석, ERP 연동 |

---

## 9. Technical Architecture

### 9.1 기술 스택

| 계층 | 기술 | 선정 사유 |
|------|------|-----------|
| Frontend | React + TypeScript | 타입 안정성, 풍부한 생태계 |
| Framework | Next.js 14+ | SSR, API Routes, 성능 최적화 |
| State Management | Zustand + React Query | 경량 상태관리, 서버 캐싱 |
| 간트차트 라이브러리 | Custom (Canvas/SVG) | 완전한 제어, 앵커 의존성 지원 |
| Backend/BaaS | Supabase | PostgreSQL, 실시간, Auth 통합 |
| CPM Engine | Custom TypeScript | 앵커 의존성 등 맞춤 알고리즘 |
| File Storage | Supabase Storage | 통합 스토리지, CDN |
| Mobile | React Native | 코드 공유, 크로스플랫폼 |

### 9.2 데이터베이스 스키마 (핵심 테이블)

```
projects          - 프로젝트 마스터 정보
tasks             - 작업 정의 (WBS, 일정, 제약조건)
dependencies      - 작업 간 의존관계 (앵커 포함)
resources         - 자원 정의
assignments       - 작업-자원 배정
baselines         - 베이스라인 스냅샷
calendars         - 캘린더 정의
progress_logs     - 진척률 입력 이력
```

### 9.3 Dependencies 테이블 상세 (앵커 기반 의존성)

```sql
CREATE TABLE dependencies (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  predecessor_id UUID REFERENCES tasks(id),
  successor_id UUID REFERENCES tasks(id),
  type VARCHAR(2) CHECK (type IN ('FS', 'SS', 'FF', 'SF')),
  lag_days INTEGER DEFAULT 0,
  -- 앵커 기반 의존성 확장 필드
  predecessor_anchor_day INTEGER,  -- 선행 작업의 특정 일차 (NULL이면 기존 방식)
  successor_anchor_day INTEGER,    -- 후행 작업의 특정 일차 (NULL이면 기존 방식)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 10. Success Metrics (KPIs)

### 10.1 제품 성공 지표

| 지표 | 목표 (1년) | 측정 방법 |
|------|------------|-----------|
| 활성 프로젝트 수 | 100개 | 월간 활성 프로젝트 |
| 월간 활성 사용자 (MAU) | 1,000명 | 고유 로그인 수 |
| 사용자 만족도 (NPS) | > 40 | 분기별 설문조사 |
| 기능 채택률 | > 70% | 핵심 기능 사용 비율 |

### 10.2 비즈니스 성과 지표

- **공정 지연 감소**: 도입 전 대비 20% 감소
- **보고서 작성 시간**: 50% 단축
- **의사소통 효율**: 이슈 해결 시간 30% 단축
- **데이터 정확도**: 수기 입력 오류 90% 감소

---

## 참고 문헌

1. Oracle Primavera P6 Enterprise Project Portfolio Management Documentation
2. Microsoft Project Documentation & Best Practices
3. Asta Powerproject Features & User Guide (Elecosoft)
4. ALICE Technologies - AI Construction Scheduling Documentation
5. PMI PMBOK Guide (Project Management Body of Knowledge)
6. 한국건설관리학회 논문집 - PMIS 관련 연구
7. Long International - CPM Scheduling Best Practices
8. TrueCADD - 4D BIM Construction Scheduling Techniques
9. 서울특별시 건설정보관리시스템(One-PMIS) 운영지침

---

*Document Version: 1.0 | Last Updated: 2024.12*
