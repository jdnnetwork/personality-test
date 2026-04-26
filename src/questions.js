// ═══ 확장 문항 풀 + 랜덤 선정 시스템 ═══
// 9개 차원: 각 정 50 + 역 30 = 80문항 (총 720)
// SD 15풀(5출제) · CC 20풀(9출제) · IF 8풀(4출제)
// 매 검사마다 seed 기반 랜덤 선정 + 전체 셔플
// 출제: 본검사 182 + SD 5 + CC 9 + IF 4 = 200문항

// ═══ 공통 메타 ═══
export const DIM_LABELS = {O:"개방성",C:"성실성",E:"외향성",A:"친화성",N:"정서안정성",L:"리더십",S:"스트레스 대처",I:"자주성",F:"집중력"};
export const DIMS_ORDER = ["O","C","E","A","N","L","S","I","F"];
export const IF_THRESHOLD = 4;
export const IF_FLAG_MIN = 2;

// helper
const w = (d, arr) => arr.map(q => ({...q, dim: d}));

// ══════════════════════════════════════
// 개방성 (O) — 정 50 + 역 30 = 80
// ══════════════════════════════════════
const O_POOL = w("O", [
  // 정문항 50 (기존 17 + 신규 33)
  {id:1,text:"새로운 아이디어를 접하면 흥미가 생긴다.",rev:false},
  {id:2,text:"상상력이 풍부한 편이다.",rev:false},
  {id:3,text:"예술 작품을 감상하는 것을 즐긴다.",rev:false},
  {id:4,text:"기존 방식보다 새로운 방법을 시도하는 것을 선호한다.",rev:false},
  {id:5,text:"다양한 문화와 가치관에 관심이 많다.",rev:false},
  {id:7,text:"복잡한 문제를 분석하는 것이 재미있다.",rev:false},
  {id:8,text:"철학적인 주제에 대해 깊이 생각해본 적이 있다.",rev:false},
  {id:9,text:"틀에 박힌 일상이 지루하게 느껴진다.",rev:false},
  {id:10,text:"새로운 취미를 시작하는 것에 적극적이다.",rev:false},
  {id:12,text:"나만의 독특한 관점을 가지고 있다고 생각한다.",rev:false},
  {id:13,text:"모험적인 경험을 즐기는 편이다.",rev:false},
  {id:15,text:"낯선 환경에 놓이면 호기심이 먼저 든다.",rev:false},
  {id:17,text:"새로운 음식이나 요리를 시도하는 것을 좋아한다.",rev:false},
  {id:18,text:"다큐멘터리나 교양 프로그램을 즐겨 본다.",rev:false},
  {id:19,text:"기발한 아이디어가 자주 떠오르는 편이다.",rev:false},
  {id:21,text:"여행지에서 현지인만 아는 장소를 찾아가는 편이다.",rev:false},
  {id:191,text:"토론에서 다양한 의견을 듣는 것이 즐겁다.",rev:false},
  {id:501,text:"새로운 기술이나 도구를 배우는 것에 흥미가 있다.",rev:false},
  {id:502,text:"낯선 분야의 책도 기꺼이 읽어본다.",rev:false},
  {id:503,text:"기존의 가정을 의심하고 다시 생각해보는 편이다.",rev:false},
  {id:504,text:"예술 작품에서 영감을 얻는 일이 많다.",rev:false},
  {id:505,text:"다양한 관점을 동시에 고려하는 것을 즐긴다.",rev:false},
  {id:506,text:"추상적인 이론을 이해하는 데 흥미를 느낀다.",rev:false},
  {id:507,text:"호기심이 많다는 말을 자주 듣는다.",rev:false},
  {id:508,text:"기발한 아이디어를 일상에서 자주 떠올린다.",rev:false},
  {id:509,text:"관습보다 본질을 더 중요하게 여긴다.",rev:false},
  {id:510,text:"낯선 음악 장르도 적극적으로 들어본다.",rev:false},
  {id:511,text:"문화와 역사에 대한 지적 호기심이 강하다.",rev:false},
  {id:512,text:"사고 실험을 즐겨 한다.",rev:false},
  {id:513,text:"창의적인 해결책을 먼저 떠올리는 편이다.",rev:false},
  {id:514,text:"외국어나 새로운 언어를 배우는 것을 즐긴다.",rev:false},
  {id:515,text:"정형화된 정답보다 다양한 대안을 찾는다.",rev:false},
  {id:516,text:"남들이 가지 않는 길에 매력을 느낀다.",rev:false},
  {id:517,text:"예상 밖의 결말이 있는 이야기를 좋아한다.",rev:false},
  {id:518,text:"자연 현상에 경이로움을 자주 느낀다.",rev:false},
  {id:519,text:"생소한 주제의 강연도 관심 있게 듣는다.",rev:false},
  {id:520,text:"세상의 다양한 라이프스타일에 열려 있다.",rev:false},
  {id:521,text:"전통과 관습에 얽매이지 않는다.",rev:false},
  {id:522,text:"직관적인 아이디어를 발전시키는 것을 즐긴다.",rev:false},
  {id:523,text:"예술적 표현에서 감동을 자주 받는다.",rev:false},
  {id:524,text:"사물의 숨겨진 의미를 탐구하는 것이 재미있다.",rev:false},
  {id:525,text:"다양한 분야의 지식을 연결시키는 편이다.",rev:false},
  {id:526,text:"정해진 답보다 열린 질문을 더 좋아한다.",rev:false},
  {id:527,text:"여러 관점에서 문제를 바라본다.",rev:false},
  {id:528,text:"창작 활동이나 창의적 표현에 흥미를 느낀다.",rev:false},
  {id:529,text:"낯선 사람의 생각을 이해하는 데 관심이 많다.",rev:false},
  {id:530,text:"지적 호기심이 삶의 큰 동력이다.",rev:false},
  {id:531,text:"상상력을 발휘해 문제를 풀어본 적이 많다.",rev:false},
  {id:532,text:"새로운 경험을 찾아 나서는 편이다.",rev:false},
  {id:533,text:"전혀 다른 분야의 아이디어를 결합해 해결책을 낸다.",rev:false},
  // 역문항 30 (기존 6 + 신규 24)
  {id:6,text:"변화보다는 안정적인 환경이 편하다.",rev:true},
  {id:11,text:"익숙한 방식대로 하는 것이 가장 효율적이라고 생각한다.",rev:true},
  {id:14,text:"추상적인 개념보다 구체적인 사실을 선호한다.",rev:true},
  {id:16,text:"규칙을 따르는 것이 창의성보다 중요하다.",rev:true},
  {id:20,text:"검증된 방법만 사용해야 안심이 된다.",rev:true},
  {id:22,text:"정해진 매뉴얼대로 일하는 것이 편하다.",rev:true},
  {id:534,text:"낯선 방식보다 검증된 방식이 더 마음이 편하다.",rev:true},
  {id:535,text:"관심 분야 외의 정보는 굳이 찾아보지 않는 편이다.",rev:true},
  {id:536,text:"새로운 도구를 배우기보다 익숙한 도구를 계속 쓰는 편이다.",rev:true},
  {id:537,text:"당장 적용 가능한 이야기가 더 흥미롭다.",rev:true},
  {id:538,text:"전통적인 방식을 바꾸는 것이 불편하다.",rev:true},
  {id:539,text:"예술이나 문학보다 실용적인 정보가 더 와닿는다.",rev:true},
  {id:540,text:"낯선 환경에 노출되는 것이 부담스럽다.",rev:true},
  {id:541,text:"실용적이지 않은 주제는 관심이 잘 안 간다.",rev:true},
  {id:542,text:"추상적인 토론보다 구체적인 사례 중심의 대화가 편하다.",rev:true},
  {id:543,text:"한 번 익힌 방식은 바꾸지 않는 편이다.",rev:true},
  {id:544,text:"확실하지 않은 방식은 받아들이기 어렵다.",rev:true},
  {id:545,text:"예측 가능한 상황이 가장 편안하다.",rev:true},
  {id:546,text:"낯선 음악이나 음식은 잘 시도하지 않는다.",rev:true},
  {id:547,text:"공상보다 실제 데이터에 기반한 판단을 신뢰한다.",rev:true},
  {id:548,text:"여행을 가도 익숙한 음식과 동선을 선호한다.",rev:true},
  {id:549,text:"업무 처리는 기존 프로세스대로 하는 것이 가장 좋다.",rev:true},
  {id:550,text:"복잡한 이론보다 단순한 사실이 좋다.",rev:true},
  {id:551,text:"익숙하지 않은 주제는 피하는 편이다.",rev:true},
  {id:552,text:"변화는 가급적 최소화하려고 한다.",rev:true},
  {id:553,text:"해보지 않은 일에 뛰어드는 것을 꺼린다.",rev:true},
  {id:554,text:"기발한 발상보다 실용적인 방법을 우선한다.",rev:true},
  {id:555,text:"다양한 경험을 추구하는 것이 소모적이라고 느낀다.",rev:true},
  {id:556,text:"전통적인 방식을 신뢰한다.",rev:true},
  {id:557,text:"새로운 모험은 리스크가 커서 피한다.",rev:true},
]);

// ══════════════════════════════════════
// 성실성 (C) — 정 50 + 역 30 = 80
// ══════════════════════════════════════
const C_POOL = w("C", [
  // 정문항 50 (기존 20 + 신규 30)
  {id:23,text:"계획을 세우고 그대로 실행하는 편이다.",rev:false},
  {id:24,text:"맡은 일은 끝까지 책임지고 완수한다.",rev:false},
  {id:25,text:"약속 시간을 철저히 지킨다.",rev:false},
  {id:26,text:"정리정돈을 잘하는 편이다.",rev:false},
  {id:27,text:"목표를 정하면 꾸준히 노력한다.",rev:false},
  {id:29,text:"세부 사항까지 꼼꼼하게 확인한다.",rev:false},
  {id:30,text:"우선순위를 정해서 일을 처리한다.",rev:false},
  {id:31,text:"규칙과 절차를 잘 따른다.",rev:false},
  {id:32,text:"한 번 시작한 일은 중간에 포기하지 않는다.",rev:false},
  {id:34,text:"데드라인을 항상 지킨다.",rev:false},
  {id:35,text:"실수를 줄이기 위해 반복 확인한다.",rev:false},
  {id:36,text:"장기적인 목표를 가지고 있다.",rev:false},
  {id:37,text:"하루 일과를 체계적으로 관리한다.",rev:false},
  {id:39,text:"작은 일이라도 최선을 다한다.",rev:false},
  {id:40,text:"주변 사람들이 나를 신뢰할 수 있다고 말한다.",rev:false},
  {id:42,text:"업무 일지나 기록을 꼼꼼히 남기는 편이다.",rev:false},
  {id:43,text:"결과물의 품질에 대한 기준이 높다.",rev:false},
  {id:44,text:"시간 관리를 잘하는 편이다.",rev:false},
  {id:192,text:"복잡한 프로젝트도 단계별로 나눠서 진행한다.",rev:false},
  {id:193,text:"어려운 과제도 끈기 있게 도전한다.",rev:false},
  {id:558,text:"일정표를 보면서 하루를 시작한다.",rev:false},
  {id:559,text:"해야 할 일을 놓치지 않도록 메모를 잘 활용한다.",rev:false},
  {id:560,text:"일을 마무리하는 데서 성취감을 느낀다.",rev:false},
  {id:561,text:"사소한 약속도 잊지 않고 지킨다.",rev:false},
  {id:562,text:"업무 환경을 깔끔하게 유지한다.",rev:false},
  {id:563,text:"장기 프로젝트를 꾸준히 진행하는 편이다.",rev:false},
  {id:564,text:"자기 전 다음날 일정을 점검한다.",rev:false},
  {id:565,text:"맡은 역할에 대한 책임감이 크다.",rev:false},
  {id:566,text:"성실하게 사는 것이 중요한 가치다.",rev:false},
  {id:567,text:"결과물을 제출하기 전 여러 번 검토한다.",rev:false},
  {id:568,text:"시간을 허투루 쓰지 않으려 노력한다.",rev:false},
  {id:569,text:"목표를 명확히 설정하고 추적한다.",rev:false},
  {id:570,text:"작은 규정이라도 지키려고 한다.",rev:false},
  {id:571,text:"어려운 일도 포기하지 않고 붙잡는다.",rev:false},
  {id:572,text:"보고서나 서류의 오탈자를 꼼꼼히 확인한다.",rev:false},
  {id:573,text:"업무에 필요한 자료를 미리 준비해둔다.",rev:false},
  {id:574,text:"마감 전에 결과물을 반드시 재확인한다.",rev:false},
  {id:575,text:"정확한 결과를 내기 위해 시간이 더 걸려도 신경 쓴다.",rev:false},
  {id:576,text:"맡은 일을 완수하지 못하면 괴롭다.",rev:false},
  {id:577,text:"실수를 줄이기 위한 체크리스트를 사용한다.",rev:false},
  {id:578,text:"일 처리 순서를 미리 설계한다.",rev:false},
  {id:579,text:"기한을 넘긴 적이 거의 없다.",rev:false},
  {id:580,text:"계획한 일은 반드시 끝까지 해낸다.",rev:false},
  {id:581,text:"나에게 주어진 일에 끝까지 최선을 다한다.",rev:false},
  {id:582,text:"업무에 필요한 도구를 잘 갖추고 관리한다.",rev:false},
  {id:583,text:"숙제나 과제를 제때 마치는 편이다.",rev:false},
  {id:584,text:"체계적으로 일하는 방식을 선호한다.",rev:false},
  {id:585,text:"목표 달성을 위해 꾸준히 자기 관리를 한다.",rev:false},
  {id:586,text:"업무 일정을 투명하게 관리한다.",rev:false},
  {id:587,text:"맡은 일의 품질을 끝까지 신경 쓴다.",rev:false},
  // 역문항 30 (기존 4 + 신규 26)
  {id:28,text:"여유 있게 시작했다가 마감 직전에 몰아치는 편이다.",rev:true},
  {id:33,text:"충동적으로 결정을 내릴 때가 많다.",rev:true},
  {id:38,text:"가끔 중요한 것을 깜빡할 때가 있다.",rev:true},
  {id:41,text:"맡은 일은 80% 정도면 충분하다고 생각한다.",rev:true},
  {id:588,text:"계획 없이 즉흥적으로 움직일 때가 많다.",rev:true},
  {id:589,text:"예상보다 일이 길어져 일정이 빠듯해질 때가 있다.",rev:true},
  {id:590,text:"마감이 임박해서야 일을 시작한다.",rev:true},
  {id:591,text:"큰 그림을 먼저 보다 보니 디테일은 나중에 챙긴다.",rev:true},
  {id:592,text:"절차보다 결과가 중요하다고 생각한다.",rev:true},
  {id:593,text:"마음이 내켜야 일이 빨리 진행된다.",rev:true},
  {id:594,text:"필요한 것이 손에 닿으면 굳이 정리하지 않는다.",rev:true},
  {id:595,text:"흥미가 식으면 다른 일이 더 하고 싶어진다.",rev:true},
  {id:596,text:"체계적인 방식보다 즉흥적인 방식이 편하다.",rev:true},
  {id:597,text:"메모나 기록을 잘 남기지 않는다.",rev:true},
  {id:598,text:"기한을 맞추는 게 완성도보다 우선이라고 본다.",rev:true},
  {id:599,text:"주어진 시간보다 오래 걸리는 경우가 많다.",rev:true},
  {id:600,text:"전체 흐름을 파악한 뒤에는 세부는 동료에게 맡기는 편이다.",rev:true},
  {id:601,text:"재미없는 일은 일정이 자꾸 뒤로 밀린다.",rev:true},
  {id:602,text:"초반의 의욕이 끝까지 유지되는 편은 아니다.",rev:true},
  {id:603,text:"여러 일을 동시에 챙길 때 무엇을 먼저 할지 즉흥적으로 정한다.",rev:true},
  {id:604,text:"마무리보다 시작이 더 재미있다.",rev:true},
  {id:605,text:"약속한 결과를 못 만드는 경우가 있다.",rev:true},
  {id:606,text:"방이나 책상이 금세 어지러워진다.",rev:true},
  {id:607,text:"규칙보다 내 방식대로 하는 것이 편하다.",rev:true},
  {id:608,text:"기한을 깜빡하고 잊는 일이 종종 있다.",rev:true},
  {id:609,text:"한 가지 방식이 막히면 다른 길을 빨리 찾는 편이다.",rev:true},
  {id:610,text:"중요한 일을 순간적 판단으로 결정하는 편이다.",rev:true},
  {id:611,text:"디테일에 시간 쓰기보다 다음 단계로 넘어가는 게 효율적이다.",rev:true},
  {id:612,text:"70점만 넘으면 다음 일로 넘어가는 편이다.",rev:true},
  {id:613,text:"기록보다 기억에 의존한다.",rev:true},
]);

// ══════════════════════════════════════
// 외향성 (E) — 정 50 + 역 30 = 80
// ══════════════════════════════════════
const E_POOL = w("E", [
  // 정문항 50 (기존 19 + 신규 31)
  {id:45,text:"사람들과 어울리는 것이 에너지를 준다.",rev:false},
  {id:46,text:"모임에서 먼저 말을 거는 편이다.",rev:false},
  {id:47,text:"새로운 사람을 만나는 것이 즐겁다.",rev:false},
  {id:49,text:"회의에서 적극적으로 발언한다.",rev:false},
  {id:50,text:"파티나 행사에 참여하는 것을 좋아한다.",rev:false},
  {id:51,text:"대화할 때 주도적인 역할을 한다.",rev:false},
  {id:52,text:"혼자 보내는 시간이 길어지면 답답하다.",rev:false},
  {id:53,text:"여러 사람 앞에서 발표하는 것이 부담스럽지 않다.",rev:false},
  {id:55,text:"팀 활동을 개인 작업보다 선호한다.",rev:false},
  {id:56,text:"분위기를 띄우는 역할을 자주 한다.",rev:false},
  {id:57,text:"처음 보는 사람과도 쉽게 대화한다.",rev:false},
  {id:59,text:"감정을 표현하는 데 거리낌이 없다.",rev:false},
  {id:60,text:"혼자 밥 먹는 것보다 같이 먹는 게 좋다.",rev:false},
  {id:61,text:"내 의견을 강하게 주장하는 편이다.",rev:false},
  {id:63,text:"전화 통화를 문자보다 선호한다.",rev:false},
  {id:64,text:"사교적이라는 말을 자주 듣는다.",rev:false},
  {id:65,text:"활기찬 환경에서 일할 때 집중이 잘 된다.",rev:false},
  {id:66,text:"네트워킹 자리에 적극적으로 참석한다.",rev:false},
  {id:194,text:"리더 역할을 맡는 것이 자연스럽다.",rev:false},
  {id:614,text:"사람들 앞에서 말하는 것을 즐긴다.",rev:false},
  {id:615,text:"새로운 모임에 자연스럽게 적응한다.",rev:false},
  {id:616,text:"에너지 넘치는 분위기를 좋아한다.",rev:false},
  {id:617,text:"먼저 말을 거는 것이 어렵지 않다.",rev:false},
  {id:618,text:"사교적인 행사를 찾아다닌다.",rev:false},
  {id:619,text:"여러 사람과 동시에 소통하는 것이 즐겁다.",rev:false},
  {id:620,text:"회식이나 모임 자리가 기다려진다.",rev:false},
  {id:621,text:"혼자 있을 때보다 함께 있을 때 더 활기차다.",rev:false},
  {id:622,text:"처음 만난 사람과도 편하게 대화한다.",rev:false},
  {id:623,text:"사람이 많은 환경에서 에너지가 솟는다.",rev:false},
  {id:624,text:"유머로 분위기를 밝게 만들 때가 많다.",rev:false},
  {id:625,text:"의견을 당당하게 표현한다.",rev:false},
  {id:626,text:"모임을 주도적으로 기획한다.",rev:false},
  {id:627,text:"대화에서 리액션이 크다.",rev:false},
  {id:628,text:"많은 사람과 연결되어 있는 것이 즐겁다.",rev:false},
  {id:629,text:"축제나 공연 같은 시끌벅적한 장소를 좋아한다.",rev:false},
  {id:630,text:"새로운 친구를 만드는 것이 쉽다.",rev:false},
  {id:631,text:"목소리가 큰 편이다.",rev:false},
  {id:632,text:"주도적으로 대화를 이끌어 간다.",rev:false},
  {id:633,text:"동료들과 자주 소통하며 일한다.",rev:false},
  {id:634,text:"공공장소에서도 위축되지 않는다.",rev:false},
  {id:635,text:"다양한 사람을 만나는 것이 삶의 활력이다.",rev:false},
  {id:636,text:"발표나 프레젠테이션을 자신 있게 한다.",rev:false},
  {id:637,text:"사람들 속에서 자연스럽게 주목받는다.",rev:false},
  {id:638,text:"타인에게 먼저 다가가는 편이다.",rev:false},
  {id:639,text:"활동적인 취미를 즐긴다.",rev:false},
  {id:640,text:"대인관계의 폭이 넓다.",rev:false},
  {id:641,text:"에너지가 넘친다는 말을 자주 듣는다.",rev:false},
  {id:642,text:"사람 만나는 약속이 즐겁다.",rev:false},
  {id:643,text:"팀 활동에 적극적으로 참여한다.",rev:false},
  {id:644,text:"다양한 모임에 소속되는 것을 좋아한다.",rev:false},
  // 역문항 30 (기존 4 + 신규 26)
  {id:48,text:"조용한 환경에서 혼자 있는 것을 선호한다.",rev:true},
  {id:54,text:"주말에는 집에서 쉬는 것이 가장 좋다.",rev:true},
  {id:58,text:"사람이 많은 곳에 가면 피곤해진다.",rev:true},
  {id:62,text:"조용히 관찰하는 편이다.",rev:true},
  {id:645,text:"많은 사람 속에 있으면 에너지가 떨어진다.",rev:true},
  {id:646,text:"조용한 환경에서 혼자 일하는 것이 좋다.",rev:true},
  {id:647,text:"모르는 사람에게 먼저 말 걸기 어렵다.",rev:true},
  {id:648,text:"소규모 만남이 더 편안하다.",rev:true},
  {id:649,text:"전화보다 문자나 메시지가 편하다.",rev:true},
  {id:650,text:"사람이 많은 곳은 금방 지친다.",rev:true},
  {id:651,text:"사교적인 자리를 부담스러워한다.",rev:true},
  {id:652,text:"혼자만의 시간을 꼭 확보해야 한다.",rev:true},
  {id:653,text:"말수가 적은 편이다.",rev:true},
  {id:654,text:"주목받는 상황이 불편하다.",rev:true},
  {id:655,text:"파티나 큰 행사는 가급적 피한다.",rev:true},
  {id:656,text:"짧고 가벼운 대화보다 깊은 대화를 선호한다.",rev:true},
  {id:657,text:"혼자 보내는 시간을 더 선호한다.",rev:true},
  {id:658,text:"낯선 사람과의 만남이 긴장된다.",rev:true},
  {id:659,text:"모임 후에는 지쳐 휴식이 필요하다.",rev:true},
  {id:660,text:"발표나 발언을 되도록 피한다.",rev:true},
  {id:661,text:"시끄러운 장소는 피하게 된다.",rev:true},
  {id:662,text:"대화를 주도하기보다 듣는 편이다.",rev:true},
  {id:663,text:"혼자 먹는 식사를 오히려 좋아한다.",rev:true},
  {id:664,text:"여러 사람과의 교류가 부담된다.",rev:true},
  {id:665,text:"새 친구를 사귀는 데 오래 걸린다.",rev:true},
  {id:666,text:"모임 약속이 많아지면 피곤하다.",rev:true},
  {id:667,text:"사교 활동보다 취미 활동이 좋다.",rev:true},
  {id:668,text:"앞에 나서는 역할은 피하는 편이다.",rev:true},
  {id:669,text:"조용히 혼자 작업에 몰두한다.",rev:true},
  {id:670,text:"집에서 보내는 주말이 가장 좋다.",rev:true},
]);

// ══════════════════════════════════════
// 친화성 (A) — 정 50 + 역 30 = 80
// ══════════════════════════════════════
const A_POOL = w("A", [
  // 정문항 50 (기존 21 + 신규 29)
  {id:67,text:"다른 사람의 감정에 공감을 잘한다.",rev:false},
  {id:68,text:"갈등 상황에서 중재 역할을 자주 한다.",rev:false},
  {id:69,text:"남을 돕는 것에서 보람을 느낀다.",rev:false},
  {id:70,text:"팀의 화합이 개인의 성과보다 중요하다.",rev:false},
  {id:71,text:"비판을 할 때 상대방의 기분을 고려한다.",rev:false},
  {id:72,text:"경쟁보다 협력을 선호한다.",rev:false},
  {id:73,text:"다른 사람의 실수에 관대한 편이다.",rev:false},
  {id:74,text:"상대방의 입장에서 생각하려고 노력한다.",rev:false},
  {id:75,text:"내 이익보다 팀의 이익을 우선시한다.",rev:false},
  {id:76,text:"누군가 어려움에 처하면 먼저 나서서 돕는다.",rev:false},
  {id:78,text:"양보하는 것이 어렵지 않다.",rev:false},
  {id:79,text:"불필요한 논쟁을 피하려고 한다.",rev:false},
  {id:80,text:"배려심이 깊다는 말을 자주 듣는다.",rev:false},
  {id:81,text:"팀원의 의견을 끝까지 경청한다.",rev:false},
  {id:82,text:"나와 다른 의견도 존중한다.",rev:false},
  {id:84,text:"갈등 상황에서 먼저 사과하는 편이다.",rev:false},
  {id:85,text:"타인의 성공을 진심으로 축하한다.",rev:false},
  {id:87,text:"봉사 활동에 관심이 있다.",rev:false},
  {id:88,text:"조화로운 분위기를 만드는 데 기여한다.",rev:false},
  {id:195,text:"다른 사람을 칭찬하는 것이 자연스럽다.",rev:false},
  {id:196,text:"사람들과 따뜻한 관계를 유지하려고 노력한다.",rev:false},
  {id:671,text:"사람들에게 친절하려고 노력한다.",rev:false},
  {id:672,text:"다른 사람의 이야기를 잘 들어준다.",rev:false},
  {id:673,text:"누군가 힘들어 보이면 먼저 다가간다.",rev:false},
  {id:674,text:"상대방의 감정을 존중한다.",rev:false},
  {id:675,text:"갈등보다 화해를 선호한다.",rev:false},
  {id:676,text:"남의 아픔에 쉽게 감정이입한다.",rev:false},
  {id:677,text:"관계를 해치는 말을 하지 않으려 조심한다.",rev:false},
  {id:678,text:"서로 이해하려는 태도가 중요하다고 생각한다.",rev:false},
  {id:679,text:"기꺼이 도움을 준다.",rev:false},
  {id:680,text:"상대방의 성과를 진심으로 축하한다.",rev:false},
  {id:681,text:"배려와 존중을 최우선으로 삼는다.",rev:false},
  {id:682,text:"남이 나를 힘들게 해도 일단 이해하려 한다.",rev:false},
  {id:683,text:"부탁을 거절하기 어려워한다.",rev:false},
  {id:684,text:"타인의 입장을 상상해보는 편이다.",rev:false},
  {id:685,text:"말을 할 때 상대의 기분을 먼저 생각한다.",rev:false},
  {id:686,text:"따뜻한 관계를 유지하는 것이 중요한 가치다.",rev:false},
  {id:687,text:"팀원의 의견을 받아들이려 노력한다.",rev:false},
  {id:688,text:"다른 사람과 협력하는 것을 중요한 가치로 여긴다.",rev:false},
  {id:689,text:"어려움에 처한 사람을 외면하기 어렵다.",rev:false},
  {id:690,text:"상대의 작은 친절에 크게 감사한다.",rev:false},
  {id:691,text:"비판을 부드럽게 전달하려 한다.",rev:false},
  {id:692,text:"사람들을 긍정적으로 바라보려 한다.",rev:false},
  {id:693,text:"타인의 성공을 시기하지 않는다.",rev:false},
  {id:694,text:"대화에서 상대의 말을 가로막지 않는다.",rev:false},
  {id:695,text:"공동체를 위해 손해를 감수할 수 있다.",rev:false},
  {id:696,text:"남을 도와줄 때 행복하다.",rev:false},
  {id:697,text:"타인에게 기대 이상의 호의를 베푼다.",rev:false},
  {id:698,text:"사소한 갈등도 풀려고 노력한다.",rev:false},
  {id:699,text:"친절하다는 말을 자주 듣는다.",rev:false},
  // 역문항 30 (기존 3 + 신규 27)
  {id:77,text:"처음 만난 사람의 호의는 일단 거리를 두고 본다.",rev:true},
  {id:83,text:"솔직함이 배려보다 중요하다고 생각한다.",rev:true},
  {id:86,text:"자기주장이 강해서 부딪히는 경우가 있다.",rev:true},
  {id:700,text:"공동의 이익보다 내 역할 안에서 최선을 다하는 게 우선이다.",rev:true},
  {id:701,text:"상대가 무리한 요청을 하면 단호하게 거절한다.",rev:true},
  {id:702,text:"내 주장을 관철시키는 편이다.",rev:true},
  {id:703,text:"불필요한 친절은 피곤하다.",rev:true},
  {id:704,text:"경쟁에서 이기는 것이 중요하다.",rev:true},
  {id:705,text:"협상에서는 상대의 사정보다 내 입장을 먼저 챙긴다.",rev:true},
  {id:706,text:"분배가 애매할 때는 내 기여만큼은 분명히 받으려 한다.",rev:true},
  {id:707,text:"감정적인 대화보다 사실 관계를 정리하는 게 편하다.",rev:true},
  {id:708,text:"필요하면 냉정하게 관계를 끊는다.",rev:true},
  {id:709,text:"남의 문제에 관여하지 않는 편이다.",rev:true},
  {id:710,text:"동정보다 실질적인 해결책 제시가 중요하다고 본다.",rev:true},
  {id:711,text:"솔직한 말은 기분을 상하게 해도 해야 한다고 본다.",rev:true},
  {id:712,text:"타협하기보다 내 방식대로 끌고 간다.",rev:true},
  {id:713,text:"부탁을 자주 거절한다.",rev:true},
  {id:714,text:"사람을 쉽게 믿지 않는다.",rev:true},
  {id:715,text:"경쟁적인 환경이 오히려 재미있다.",rev:true},
  {id:716,text:"관계보다 결과가 더 중요하다.",rev:true},
  {id:717,text:"타인의 어려움에 감정적으로 깊이 빠지지 않는다.",rev:true},
  {id:718,text:"내 의견이 관철되지 않으면 불쾌하다.",rev:true},
  {id:719,text:"남에게 지는 것을 싫어한다.",rev:true},
  {id:720,text:"타인의 부탁에 쉽게 응하지 않는다.",rev:true},
  {id:721,text:"관계도 결국은 필요에 따라 형성된다고 본다.",rev:true},
  {id:722,text:"토론에서는 내 논리가 명확하게 전달되는 것을 우선한다.",rev:true},
  {id:723,text:"관계에서도 명확한 기대치가 있는 것이 편하다.",rev:true},
  {id:724,text:"내가 옳다고 믿는 것을 쉽게 바꾸지 않는다.",rev:true},
  {id:725,text:"칭찬은 의미 있는 순간에만 한다는 주의다.",rev:true},
  {id:726,text:"모두와 친하게 지내려 애쓰지 않는다.",rev:true},
]);

// ══════════════════════════════════════
// 정서안정성 (N) — 정 50 + 역 30 = 80
// ══════════════════════════════════════
const N_POOL = w("N", [
  // 정문항 50 (기존 13 + 신규 37)
  {id:89,text:"스트레스 상황에서도 침착함을 유지한다.",rev:false},
  {id:91,text:"감정 기복이 적은 편이다.",rev:false},
  {id:92,text:"실패해도 빠르게 회복한다.",rev:false},
  {id:94,text:"압박감 속에서도 일을 잘 수행한다.",rev:false},
  {id:96,text:"어려운 상황에서 긍정적으로 생각하려 한다.",rev:false},
  {id:98,text:"감정에 휘둘리지 않고 이성적으로 판단한다.",rev:false},
  {id:99,text:"자존감이 높은 편이다.",rev:false},
  {id:101,text:"예상치 못한 변화에도 유연하게 대응한다.",rev:false},
  {id:103,text:"위기 상황에서 냉정하게 대처한다.",rev:false},
  {id:105,text:"실패를 성장의 기회로 본다.",rev:false},
  {id:106,text:"쉽게 좌절하지 않는다.",rev:false},
  {id:109,text:"마음이 편안한 상태가 오래 유지된다.",rev:false},
  {id:197,text:"어떤 상황에서도 자신감을 잃지 않으려 한다.",rev:false},
  {id:727,text:"예상치 못한 어려움에도 평정을 유지한다.",rev:false},
  {id:728,text:"중요한 발표 전에도 긴장하지 않는다.",rev:false},
  {id:729,text:"실수해도 자책하지 않고 넘어간다.",rev:false},
  {id:730,text:"예상치 못한 상황에서도 마음이 흔들리지 않는다.",rev:false},
  {id:731,text:"부정적인 피드백을 받아도 크게 흔들리지 않는다.",rev:false},
  {id:732,text:"어려운 일도 감정적으로 빠지지 않고 대처한다.",rev:false},
  {id:733,text:"나 자신을 긍정적으로 받아들인다.",rev:false},
  {id:734,text:"일상에서 편안함을 자주 느낀다.",rev:false},
  {id:735,text:"불안한 상황에서도 합리적으로 판단한다.",rev:false},
  {id:736,text:"예기치 못한 변화에 안정적으로 적응한다.",rev:false},
  {id:737,text:"위기 상황에서도 감정을 컨트롤한다.",rev:false},
  {id:738,text:"기대에 못 미쳐도 다음을 준비한다.",rev:false},
  {id:739,text:"감정 기복이 크지 않다.",rev:false},
  {id:740,text:"실패를 길게 끌고 가지 않는다.",rev:false},
  {id:741,text:"자존감이 안정적이다.",rev:false},
  {id:742,text:"비판을 받아들이는 여유가 있다.",rev:false},
  {id:743,text:"당황스러운 상황에서도 금방 마음을 가라앉힌다.",rev:false},
  {id:744,text:"스스로에게 관대한 편이다.",rev:false},
  {id:745,text:"긴장감이 높아져도 호흡을 다스리며 이겨낸다.",rev:false},
  {id:746,text:"실수 후에도 빠르게 회복한다.",rev:false},
  {id:747,text:"걱정보다 행동을 먼저 한다.",rev:false},
  {id:748,text:"어려움을 객관적으로 바라본다.",rev:false},
  {id:749,text:"감정에 휘둘리지 않고 차분하게 결정한다.",rev:false},
  {id:750,text:"내 감정을 다스리는 법을 안다.",rev:false},
  {id:751,text:"결과가 좋지 않아도 낙담하지 않는다.",rev:false},
  {id:752,text:"차분하다는 말을 자주 듣는다.",rev:false},
  {id:753,text:"불확실성을 자연스럽게 받아들인다.",rev:false},
  {id:754,text:"문제 앞에서 긍정적인 면을 본다.",rev:false},
  {id:755,text:"예민한 상황에서도 평정을 유지한다.",rev:false},
  {id:756,text:"부정적 생각이 들면 의식적으로 전환한다.",rev:false},
  {id:757,text:"자신의 약점을 여유 있게 인정한다.",rev:false},
  {id:758,text:"압박 속에서도 결정 속도가 빠르다.",rev:false},
  {id:759,text:"긍정적인 사고방식을 유지한다.",rev:false},
  {id:760,text:"어려움이 지나가면 교훈으로 남긴다.",rev:false},
  {id:761,text:"감정을 표현해야 할 때와 참아야 할 때를 구분한다.",rev:false},
  {id:762,text:"결정 후 후회를 길게 하지 않는다.",rev:false},
  {id:763,text:"마음이 안정된 상태를 유지한다.",rev:false},
  // 역문항 30 (기존 10 + 신규 20)
  {id:90,text:"결정 후에도 다른 가능성을 자꾸 떠올린다.",rev:true},
  {id:93,text:"사소한 일에 예민하게 반응할 때가 있다.",rev:true},
  {id:95,text:"비판을 들으면 오래 신경 쓰인다.",rev:true},
  {id:97,text:"불확실한 상황이 불안하다.",rev:true},
  {id:100,text:"작은 실수에도 자책하는 편이다.",rev:true},
  {id:102,text:"주변 분위기에 따라 컨디션이 달라진다.",rev:true},
  {id:104,text:"남들의 시선이 신경 쓰인다.",rev:true},
  {id:107,text:"미래에 대한 막연한 불안을 느끼곤 한다.",rev:true},
  {id:108,text:"다른 사람과 비교하며 위축될 때가 있다.",rev:true},
  {id:110,text:"중요한 결정 앞에서 지나치게 고민한다.",rev:true},
  {id:764,text:"별일 아닌 메시지도 여러 번 다시 읽어본다.",rev:true},
  {id:765,text:"아무 일이 없어도 마음 한구석이 무거울 때가 있다.",rev:true},
  {id:766,text:"한 번 떠오른 생각은 잠들기 전까지 따라온다.",rev:true},
  {id:767,text:"비난받으면 오래 상처가 남는다.",rev:true},
  {id:768,text:"실수 후에 자책을 오래 한다.",rev:true},
  {id:769,text:"불안한 마음이 몸의 긴장으로 이어질 때가 있다.",rev:true},
  {id:770,text:"10년 뒤를 생각하면 막막함이 먼저 떠오른다.",rev:true},
  {id:771,text:"남들의 평가에 민감하다.",rev:true},
  {id:772,text:"하루 안에서도 감정 변화가 큰 편이다.",rev:true},
  {id:773,text:"걱정 때문에 잠을 설치는 일이 잦다.",rev:true},
  {id:774,text:"작은 지적에도 오래 신경을 쓴다.",rev:true},
  {id:775,text:"실패를 쉽게 털어내지 못한다.",rev:true},
  {id:776,text:"주변 사람의 반응에 마음 상태가 따라간다.",rev:true},
  {id:777,text:"불확실한 상황이 매우 불편하다.",rev:true},
  {id:778,text:"잘한 일이 있어도 부족한 점이 먼저 보인다.",rev:true},
  {id:779,text:"예상이 빗나가면 한동안 일이 손에 안 잡힌다.",rev:true},
  {id:780,text:"감정이 차오르면 잠시 거리를 두는 시간이 필요하다.",rev:true},
  {id:781,text:"지나가는 말에도 의미를 부여하는 편이다.",rev:true},
  {id:782,text:"다른 사람과 비교하며 위축된다.",rev:true},
  {id:783,text:"사건이 일어나지 않아도 미리 걱정한다.",rev:true},
]);

// ══════════════════════════════════════
// 리더십 (L) — 정 50 + 역 30 = 80
// ══════════════════════════════════════
const L_POOL = w("L", [
  // 정문항 50 (기존 15 + 신규 35)
  {id:111,text:"팀을 이끌 때 방향을 제시하는 편이다.",rev:false},
  {id:112,text:"결단력 있게 의사결정을 내린다.",rev:false},
  {id:113,text:"사람들에게 동기부여를 잘한다.",rev:false},
  {id:115,text:"비전을 세우고 팀원과 공유한다.",rev:false},
  {id:116,text:"갈등 상황에서 최종 결정을 내릴 수 있다.",rev:false},
  {id:117,text:"책임을 지는 것이 부담스럽지 않다.",rev:false},
  {id:118,text:"팀원의 장단점을 파악하고 역할을 배분한다.",rev:false},
  {id:119,text:"프로젝트의 전체 그림을 먼저 그린다.",rev:false},
  {id:120,text:"어려운 상황에서도 팀을 안정시키는 역할을 한다.",rev:false},
  {id:122,text:"회의에서 논의를 정리하고 결론을 도출한다.",rev:false},
  {id:123,text:"팀원들의 성장을 돕는 것이 보람 있다.",rev:false},
  {id:124,text:"의견이 갈릴 때 합의점을 찾아낸다.",rev:false},
  {id:125,text:"새로운 프로젝트를 시작할 때 먼저 나선다.",rev:false},
  {id:127,text:"조직의 목표와 개인의 목표를 연결시킨다.",rev:false},
  {id:128,text:"위기 상황에서 사람들이 나를 찾는 편이다.",rev:false},
  {id:784,text:"어려운 상황에서 팀을 하나로 모으는 역할을 한다.",rev:false},
  {id:785,text:"의사결정이 필요한 순간 머뭇거리지 않는다.",rev:false},
  {id:786,text:"장기적인 비전을 그리는 것을 좋아한다.",rev:false},
  {id:787,text:"팀원들의 동기를 이끌어내는 법을 안다.",rev:false},
  {id:788,text:"책임을 지는 위치에 있는 것이 편하다.",rev:false},
  {id:789,text:"처음 본 사람들로 구성된 팀에서도 방향을 잡을 수 있다.",rev:false},
  {id:790,text:"프로젝트를 총괄하는 경험을 선호한다.",rev:false},
  {id:791,text:"리더로서 공과 과를 분명히 가린다.",rev:false},
  {id:792,text:"팀의 방향을 수립하는 것이 나의 역할이다.",rev:false},
  {id:793,text:"문제가 생기면 해결 방안을 먼저 제시한다.",rev:false},
  {id:794,text:"팀 내 역할 분담을 자신 있게 할 수 있다.",rev:false},
  {id:795,text:"다른 사람에게 영감을 주는 편이다.",rev:false},
  {id:796,text:"변화의 기점을 스스로 만든다.",rev:false},
  {id:797,text:"어려운 결정을 미루지 않고 내린다.",rev:false},
  {id:798,text:"내 의견을 설득력 있게 전달한다.",rev:false},
  {id:799,text:"팀의 성과에 대한 최종 책임을 지는 것이 당연하다.",rev:false},
  {id:800,text:"위기 속에서도 팀을 지탱한다.",rev:false},
  {id:801,text:"조직의 목표와 개인의 목표를 연결하는 데 능하다.",rev:false},
  {id:802,text:"의견이 갈릴 때 결단을 내린다.",rev:false},
  {id:803,text:"팀원들에게 동기부여를 잘한다.",rev:false},
  {id:804,text:"회의에서 결론을 끌어내는 역할을 한다.",rev:false},
  {id:805,text:"팀의 성장에 기여하는 것이 보람이다.",rev:false},
  {id:806,text:"어려운 과제를 먼저 도맡는다.",rev:false},
  {id:807,text:"다양한 배경의 사람들을 조화롭게 이끈다.",rev:false},
  {id:808,text:"공동의 목표를 명확히 제시한다.",rev:false},
  {id:809,text:"리더의 역할에 부담을 느끼지 않는다.",rev:false},
  {id:810,text:"팀을 대표해 외부와 소통한다.",rev:false},
  {id:811,text:"다른 사람을 성장시키는 것이 즐겁다.",rev:false},
  {id:812,text:"방향을 잃은 팀에게 길을 제시한다.",rev:false},
  {id:813,text:"성과를 위해 팀의 에너지를 집중시킨다.",rev:false},
  {id:814,text:"조직의 미래를 설계하는 일을 좋아한다.",rev:false},
  {id:815,text:"중요한 일에 먼저 나서는 편이다.",rev:false},
  {id:816,text:"나의 리더십이 조직에 기여한다고 믿는다.",rev:false},
  {id:817,text:"동료들이 나를 리더로 인정하는 편이다.",rev:false},
  {id:818,text:"다음 세대 리더를 키우는 일에 관심이 많다.",rev:false},
  // 역문항 30 (기존 3 + 신규 27)
  {id:114,text:"위임보다 직접 하는 것이 편하다.",rev:true},
  {id:121,text:"다른 사람을 이끌기보다 따르는 것이 편하다.",rev:true},
  {id:126,text:"리더보다는 실무자 역할이 더 잘 맞는다.",rev:true},
  {id:819,text:"중요한 결정은 다른 사람이 내려주기를 바란다.",rev:true},
  {id:820,text:"책임지는 자리는 부담스럽다.",rev:true},
  {id:821,text:"지시를 받고 움직이는 것이 편하다.",rev:true},
  {id:822,text:"스포트라이트보다 무대 뒤에서 일하는 것이 편하다.",rev:true},
  {id:823,text:"회의에서 의견을 내는 것이 어렵다.",rev:true},
  {id:824,text:"팀을 끌어가는 것보다 따라가는 것이 좋다.",rev:true},
  {id:825,text:"내 의견을 강하게 주장하기보다 사실을 차분히 전달하려 한다.",rev:true},
  {id:826,text:"방향 설정은 경험 많은 사람이 정하는 게 안전하다고 본다.",rev:true},
  {id:827,text:"신중하게 따져본 뒤 결정하는 데 시간이 걸리는 편이다.",rev:true},
  {id:828,text:"내가 리더가 되는 상황이 불편하다.",rev:true},
  {id:829,text:"사람 간 갈등이 생기면 한 발 물러서 시간을 두는 편이다.",rev:true},
  {id:830,text:"의견이 갈릴 때 모두의 입장을 들어보는 데 시간을 쓴다.",rev:true},
  {id:831,text:"동료에게 부탁할 때 미안한 마음이 먼저 든다.",rev:true},
  {id:832,text:"문제 해결을 다른 사람에게 맡기는 편이다.",rev:true},
  {id:833,text:"공식 자리에서는 의견을 다듬어 정리한 뒤 전달하려 한다.",rev:true},
  {id:834,text:"리더십은 내 역할이 아니라고 느낀다.",rev:true},
  {id:835,text:"대표로 발언하는 것이 꺼려진다.",rev:true},
  {id:836,text:"내 생각을 관철하기보다 동료의 의견을 받아들이는 편이다.",rev:true},
  {id:837,text:"팀의 성과에 대한 책임은 함께 나누는 것이 자연스럽다.",rev:true},
  {id:838,text:"의견을 내기보다 듣는 편이 좋다.",rev:true},
  {id:839,text:"주도적으로 이끄는 역할이 피곤하다.",rev:true},
  {id:840,text:"결정이 필요한 순간 다른 사람을 바라본다.",rev:true},
  {id:841,text:"결정 전에 다른 사람의 의견을 한 번 더 확인하는 편이다.",rev:true},
  {id:842,text:"조직에서는 전문가 역할이 더 잘 맞는다.",rev:true},
  {id:843,text:"결단보다 합의 기다림을 선호한다.",rev:true},
  {id:844,text:"의견 차이가 큰 자리에서는 결론이 정리된 후 합류한다.",rev:true},
  {id:845,text:"리더십보다 전문성을 추구한다.",rev:true},
]);

// ══════════════════════════════════════
// 스트레스 대처 (S) — 정 50 + 역 30 = 80
// ══════════════════════════════════════
const S_POOL = w("S", [
  // 정문항 50 (기존 11 + 신규 39)
  {id:129,text:"마감이 촉박해도 업무 품질을 유지할 수 있다.",rev:false},
  {id:130,text:"동시에 여러 일을 처리하는 것이 가능하다.",rev:false},
  {id:131,text:"예상치 못한 문제가 생기면 대안을 빠르게 찾는다.",rev:false},
  {id:132,text:"업무 과부하 상황에서도 체계적으로 일한다.",rev:false},
  {id:133,text:"실패 후에도 동기부여를 스스로 할 수 있다.",rev:false},
  {id:135,text:"압박 속에서 오히려 업무 효율이 올라간다.",rev:false},
  {id:137,text:"어려운 상황에서도 유머 감각을 유지한다.",rev:false},
  {id:138,text:"업무 외 시간에 스트레스를 효과적으로 해소한다.",rev:false},
  {id:139,text:"갑작스러운 업무 변경에도 빠르게 적응한다.",rev:false},
  {id:140,text:"장기적인 고강도 업무에도 번아웃 없이 버틸 수 있다.",rev:false},
  {id:200,text:"위기 상황을 오히려 성장 기회로 활용한다.",rev:false},
  {id:846,text:"마감이 촉박해도 차분하게 진행한다.",rev:false},
  {id:847,text:"압박감 속에서도 품질을 유지한다.",rev:false},
  {id:848,text:"예상치 못한 이슈에도 빠르게 대안을 찾는다.",rev:false},
  {id:849,text:"여러 프로젝트를 동시에 처리할 수 있다.",rev:false},
  {id:850,text:"업무 과부하 속에서도 체계적으로 일한다.",rev:false},
  {id:851,text:"긴박한 상황에서도 업무를 차질 없이 진행한다.",rev:false},
  {id:852,text:"변화가 많아도 적응이 빠르다.",rev:false},
  {id:853,text:"위기 상황에서 해결 방안을 떠올린다.",rev:false},
  {id:854,text:"업무 외 시간을 활용해 스트레스를 해소한다.",rev:false},
  {id:855,text:"실패 후에도 다시 도전할 에너지가 있다.",rev:false},
  {id:856,text:"스트레스가 쌓여도 금방 회복한다.",rev:false},
  {id:857,text:"위기 속에서 오히려 능력을 발휘한다.",rev:false},
  {id:858,text:"고강도 업무에서도 효율을 유지하는 루틴이 있다.",rev:false},
  {id:859,text:"감정과 상황을 분리해 판단한다.",rev:false},
  {id:860,text:"문제 상황에서 우선순위를 정할 수 있다.",rev:false},
  {id:861,text:"장기간 고강도 업무에도 견딘다.",rev:false},
  {id:862,text:"빠른 의사결정이 필요한 순간에 강하다.",rev:false},
  {id:863,text:"스트레스를 건강하게 관리하는 법을 안다.",rev:false},
  {id:864,text:"압박 속에서 팀원들을 지탱한다.",rev:false},
  {id:865,text:"변동 상황에서 침착함을 유지한다.",rev:false},
  {id:866,text:"마음 회복력이 강한 편이다.",rev:false},
  {id:867,text:"난관을 만나면 오히려 의욕이 생긴다.",rev:false},
  {id:868,text:"어떤 상황에서도 결과를 내기 위해 노력한다.",rev:false},
  {id:869,text:"컨디션 관리에 신경을 쓴다.",rev:false},
  {id:870,text:"긴급 상황에서 리더 역할을 수행할 수 있다.",rev:false},
  {id:871,text:"업무 스트레스를 받아도 개인 생활에 전이되지 않는다.",rev:false},
  {id:872,text:"장기 프로젝트 동안 페이스를 조절할 수 있다.",rev:false},
  {id:873,text:"번아웃 징후를 스스로 알아차린다.",rev:false},
  {id:874,text:"스트레스를 성과의 연료로 바꾼다.",rev:false},
  {id:875,text:"예측 불가능한 상황도 즐긴다.",rev:false},
  {id:876,text:"마감 직전에 몰입도가 최고로 올라간다.",rev:false},
  {id:877,text:"역할이 자주 바뀌어도 금방 적응한다.",rev:false},
  {id:878,text:"문제가 누적되어도 차근차근 해결해 나간다.",rev:false},
  {id:879,text:"체력과 멘탈을 함께 관리한다.",rev:false},
  {id:880,text:"위기에서 배운 교훈을 다음에 적용한다.",rev:false},
  {id:881,text:"난이도가 높은 과제를 선호한다.",rev:false},
  {id:882,text:"자기 돌봄의 중요성을 안다.",rev:false},
  {id:883,text:"문제 상황을 분석해 패턴을 파악한다.",rev:false},
  {id:884,text:"스트레스 관리 도구를 갖추고 있다.",rev:false},
  // 역문항 30 (기존 2 + 신규 28)
  {id:134,text:"스트레스를 받으면 평소보다 결정이 늦어지는 편이다.",rev:true},
  {id:136,text:"마감이 겹치면 어디부터 손대야 할지 막막해진다.",rev:true},
  {id:885,text:"마감이 다가올수록 다른 일에 집중이 잘 안 된다.",rev:true},
  {id:886,text:"할 일이 많아지면 우선순위 정리에 시간이 더 걸린다.",rev:true},
  {id:887,text:"예상 밖 변수가 생기면 일단 멈춰서 상황을 다시 본다.",rev:true},
  {id:888,text:"여러 일이 겹치면 처음 계획과 달라지는 부분이 많아진다.",rev:true},
  {id:889,text:"실수하면 그 영향이 오래 간다.",rev:true},
  {id:890,text:"스트레스 받으면 수면의 질이 나빠진다.",rev:true},
  {id:891,text:"잦은 변화에 쉽게 지친다.",rev:true},
  {id:892,text:"압박 속에서 실수가 잦아진다.",rev:true},
  {id:893,text:"번아웃을 겪은 경험이 있다.",rev:true},
  {id:894,text:"업무 때문에 식사가 불규칙해진다.",rev:true},
  {id:895,text:"긴장이 높을수록 익숙한 방식에 의존하게 된다.",rev:true},
  {id:896,text:"업무 스트레스가 개인 생활에 영향을 미친다.",rev:true},
  {id:897,text:"실패를 오래 곱씹는 편이다.",rev:true},
  {id:898,text:"급한 일이 들어오면 우선순위가 한참 흔들린다.",rev:true},
  {id:899,text:"스트레스 해소는 시간이 지나는 것에 의지하는 편이다.",rev:true},
  {id:900,text:"업무 피로가 좀처럼 풀리지 않는다.",rev:true},
  {id:901,text:"어려움이 길어지면 처음의 동기가 옅어진다.",rev:true},
  {id:902,text:"상사의 질책을 들으면 하루 종일 힘들다.",rev:true},
  {id:903,text:"위기 상황에서 혼자 감당하기 어렵다.",rev:true},
  {id:904,text:"압박 속에서 예민해지는 편이다.",rev:true},
  {id:905,text:"긴급 업무를 맡으면 큰 부담을 느낀다.",rev:true},
  {id:906,text:"스트레스가 쌓이면 체력이 금방 떨어진다.",rev:true},
  {id:907,text:"압박을 받으면 업무 진행이 느려진다.",rev:true},
  {id:908,text:"어려운 일이 길어지면 평소 페이스를 유지하기 어렵다.",rev:true},
  {id:909,text:"할 일이 누적되면 평소 같았으면 안 했을 실수를 한다.",rev:true},
  {id:910,text:"예고 없이 일정이 바뀌면 회복하는 데 시간이 든다.",rev:true},
  {id:911,text:"자기 돌봄에 여유가 없다.",rev:true},
  {id:912,text:"피로가 누적되면 업무가 손에 잡히지 않는다.",rev:true},
]);

// ══════════════════════════════════════
// 자주성 (I) — 정 50 + 역 30 = 80
// ══════════════════════════════════════
const I_POOL = w("I", [
  // 정문항 50 (기존 15 + 신규 35)
  {id:141,text:"스스로 목표를 정하고 추진하는 편이다.",rev:false},
  {id:142,text:"지시를 받지 않아도 할 일을 찾아서 한다.",rev:false},
  {id:143,text:"자기 발전을 위해 스스로 학습한다.",rev:false},
  {id:145,text:"주도적으로 프로젝트를 제안한 경험이 있다.",rev:false},
  {id:146,text:"문제가 생기면 상사에게 먼저 보고하기보다 해결책을 찾는다.",rev:false},
  {id:147,text:"자기 일에 대한 주인의식이 강하다.",rev:false},
  {id:149,text:"업무 개선 아이디어를 자발적으로 제안한다.",rev:false},
  {id:150,text:"혼자서도 일정 관리를 잘한다.",rev:false},
  {id:151,text:"상사의 피드백 없이도 자기 업무를 평가할 수 있다.",rev:false},
  {id:153,text:"새로운 업무에 자원해서 참여한다.",rev:false},
  {id:154,text:"자기계발에 시간과 비용을 투자한다.",rev:false},
  {id:155,text:"정해진 역할 외의 일도 필요하면 나서서 한다.",rev:false},
  {id:157,text:"목표 달성을 위한 계획을 스스로 수립한다.",rev:false},
  {id:158,text:"자발적으로 행동한다는 말을 자주 듣는다.",rev:false},
  {id:198,text:"회사 일 외에도 자기만의 프로젝트를 진행한다.",rev:false},
  {id:913,text:"내 일의 진행을 스스로 설계한다.",rev:false},
  {id:914,text:"목표를 세우면 누가 시키지 않아도 실행한다.",rev:false},
  {id:915,text:"개선 아이디어를 자발적으로 제안한다.",rev:false},
  {id:916,text:"내 영역의 문제는 내가 해결하려 한다.",rev:false},
  {id:917,text:"스스로 학습해 실력을 쌓는다.",rev:false},
  {id:918,text:"주도적으로 일을 찾아서 한다.",rev:false},
  {id:919,text:"일을 맡으면 끝까지 책임지고 완료한다.",rev:false},
  {id:920,text:"자기 주도 학습 경험이 풍부하다.",rev:false},
  {id:921,text:"나는 내 커리어의 주인이다.",rev:false},
  {id:922,text:"새로운 과제가 주어지면 스스로 계획을 짠다.",rev:false},
  {id:923,text:"업무 수행 방식도 스스로 선택한다.",rev:false},
  {id:924,text:"필요한 리소스를 스스로 확보한다.",rev:false},
  {id:925,text:"자신의 일정은 스스로 관리한다.",rev:false},
  {id:926,text:"자율적인 환경에서 효율이 높다.",rev:false},
  {id:927,text:"목표가 있으면 방법을 스스로 찾는다.",rev:false},
  {id:928,text:"시간과 비용을 들여 자기계발한다.",rev:false},
  {id:929,text:"주도성을 인정받은 경험이 많다.",rev:false},
  {id:930,text:"새로운 도전을 스스로 기획해본 적이 있다.",rev:false},
  {id:931,text:"지시가 모호해도 적절히 판단해 실행한다.",rev:false},
  {id:932,text:"개선점을 발견하면 즉시 실행에 옮긴다.",rev:false},
  {id:933,text:"나에게 부여된 역할 이상도 해낸다.",rev:false},
  {id:934,text:"자기 관리 시스템을 갖추고 있다.",rev:false},
  {id:935,text:"일을 진행하며 필요한 결정을 스스로 내린다.",rev:false},
  {id:936,text:"상사가 없어도 같은 수준의 성과를 낸다.",rev:false},
  {id:937,text:"자기 주도성이 나의 강점이다.",rev:false},
  {id:938,text:"내 경력 목표를 스스로 설정한다.",rev:false},
  {id:939,text:"필요한 역량을 파악해 갖추는 편이다.",rev:false},
  {id:940,text:"기회를 놓치지 않으려 능동적으로 움직인다.",rev:false},
  {id:941,text:"내가 맡은 일의 시작과 끝을 책임진다.",rev:false},
  {id:942,text:"업무 도중 개선할 점을 능동적으로 찾아낸다.",rev:false},
  {id:943,text:"필요한 협력 관계를 스스로 만들어 간다.",rev:false},
  {id:944,text:"나의 판단을 믿는 편이다.",rev:false},
  {id:945,text:"자기계발을 위한 루틴이 있다.",rev:false},
  {id:946,text:"스스로에게 과제를 부여하는 편이다.",rev:false},
  {id:947,text:"지시를 기다리지 않고 먼저 움직인다.",rev:false},
  // 역문항 30 (기존 4 + 신규 26)
  {id:144,text:"구체적인 요청이 있어야 일이 빨리 시작된다.",rev:true},
  {id:148,text:"명확한 지시가 없으면 불안하다.",rev:true},
  {id:152,text:"신중하게 따라가는 스타일이라는 평가를 받는다.",rev:true},
  {id:156,text:"역할이 명확히 분담될 때 일이 더 잘 풀린다.",rev:true},
  {id:948,text:"명확한 지시가 없으면 시작하기 어렵다.",rev:true},
  {id:949,text:"방향이 모호한 일은 한참 고민하다 시작한다.",rev:true},
  {id:950,text:"전적으로 내가 결정해야 하는 일은 한 번 더 검토하게 된다.",rev:true},
  {id:951,text:"역할에 충실한 사람이라는 평가를 받는다.",rev:true},
  {id:952,text:"지시 받은 일만 하는 편이다.",rev:true},
  {id:953,text:"새로운 과제는 상사의 판단을 기다린다.",rev:true},
  {id:954,text:"기획과 실행을 한 사람이 다 떠안는 것보다 분업이 효율적이라고 본다.",rev:true},
  {id:955,text:"결정 권한이 명확하지 않을 때는 상사에게 확인하는 편이다.",rev:true},
  {id:956,text:"자기 개발은 회사가 주도해주기를 바란다.",rev:true},
  {id:957,text:"자유 시간이 주어지면 무엇부터 할지 한참 고민한다.",rev:true},
  {id:958,text:"기회를 직접 찾기보다 기다리는 편이다.",rev:true},
  {id:959,text:"스스로 학습보다 교육 프로그램에 의존한다.",rev:true},
  {id:960,text:"자율적인 환경이 부담스럽다.",rev:true},
  {id:961,text:"선배의 지시가 있어야 마음이 놓인다.",rev:true},
  {id:962,text:"일정 관리를 남에게 맡기는 편이다.",rev:true},
  {id:963,text:"주도적으로 제안한 적이 거의 없다.",rev:true},
  {id:964,text:"새로운 일을 시작할 때 누군가에게 물어본다.",rev:true},
  {id:965,text:"자기 주도보다 팀 결정을 따른다.",rev:true},
  {id:966,text:"지시 받을 때 안정감을 느낀다.",rev:true},
  {id:967,text:"책임이 크지 않은 일을 선호한다.",rev:true},
  {id:968,text:"문제를 혼자 해결하기보다 같이 해결한다.",rev:true},
  {id:969,text:"업무 범위를 넓히는 데 소극적이다.",rev:true},
  {id:970,text:"지시 없이 움직이는 것이 긴장된다.",rev:true},
  {id:971,text:"동기는 외부에서 주어질 때 더 잘 발휘된다.",rev:true},
  {id:972,text:"여러 명이 함께 결정하는 자리에서 더 편안함을 느낀다.",rev:true},
  {id:973,text:"공부도 일정과 커리큘럼이 짜여 있을 때 더 잘 진행된다.",rev:true},
]);

// ══════════════════════════════════════
// 집중력 (F) — 정 50 + 역 30 = 80
// ══════════════════════════════════════
const F_POOL = w("F", [
  // 정문항 50 (기존 14 + 신규 36)
  {id:159,text:"한 가지 일에 깊이 몰입하는 편이다.",rev:false},
  {id:160,text:"주변이 시끄러워도 집중을 유지할 수 있다.",rev:false},
  {id:161,text:"업무 중 딴 생각을 잘 하지 않는다.",rev:false},
  {id:162,text:"장시간 같은 업무를 해도 집중력이 유지된다.",rev:false},
  {id:164,text:"세밀한 작업을 오래 할 수 있다.",rev:false},
  {id:165,text:"한 번 시작하면 끝날 때까지 멈추지 않는다.",rev:false},
  {id:167,text:"복잡한 문서를 꼼꼼히 읽는 것이 어렵지 않다.",rev:false},
  {id:169,text:"중요한 일을 할 때 시간 가는 줄 모른다.",rev:false},
  {id:170,text:"집중해야 할 때 외부 방해를 차단할 수 있다.",rev:false},
  {id:171,text:"반복적인 업무에도 꾸준한 집중력을 발휘한다.",rev:false},
  {id:173,text:"수치나 데이터를 다룰 때 실수가 적다.",rev:false},
  {id:175,text:"정독이 필요한 자료를 잘 소화한다.",rev:false},
  {id:176,text:"몰입 상태에 들어가면 외부 자극을 잘 인지하지 못한다.",rev:false},
  {id:199,text:"마감 직전에 가장 높은 집중력을 발휘한다.",rev:false},
  {id:974,text:"한 번 몰입하면 긴 시간 유지한다.",rev:false},
  {id:975,text:"숫자나 데이터를 꼼꼼히 다룬다.",rev:false},
  {id:976,text:"업무 중 딴 생각이 거의 없다.",rev:false},
  {id:977,text:"주변 소음이 있어도 집중한다.",rev:false},
  {id:978,text:"긴 문서도 끝까지 집중해 읽는다.",rev:false},
  {id:979,text:"복잡한 계산을 정확하게 해낸다.",rev:false},
  {id:980,text:"반복 업무에서도 실수를 최소화한다.",rev:false},
  {id:981,text:"회의 내용을 끝까지 따라갈 수 있다.",rev:false},
  {id:982,text:"세밀한 작업을 오랫동안 할 수 있다.",rev:false},
  {id:983,text:"몰입 상태에 빠지는 경험이 잦다.",rev:false},
  {id:984,text:"한 가지 일에 깊이 파고든다.",rev:false},
  {id:985,text:"집중을 방해하는 요소를 제거한다.",rev:false},
  {id:986,text:"중요한 일을 할 때 몰입도가 최고조가 된다.",rev:false},
  {id:987,text:"디테일에 대한 주의력이 높다.",rev:false},
  {id:988,text:"몰입 상태에 들어가는 속도가 빠른 편이다.",rev:false},
  {id:989,text:"집중력이 필요한 업무를 선호한다.",rev:false},
  {id:990,text:"방해 요소가 있어도 중심을 잡는다.",rev:false},
  {id:991,text:"집중 타이머나 방법을 활용한다.",rev:false},
  {id:992,text:"업무 환경을 최대한 단순하게 만든다.",rev:false},
  {id:993,text:"데이터 분석 시 실수가 적다.",rev:false},
  {id:994,text:"오타나 숫자 오류를 놓치지 않고 발견한다.",rev:false},
  {id:995,text:"학습 시 방해를 받지 않으려 한다.",rev:false},
  {id:996,text:"작업 흐름을 깨지 않도록 관리한다.",rev:false},
  {id:997,text:"집중 모드에 들어가면 시간이 빨리 간다.",rev:false},
  {id:998,text:"중요한 문서를 한 번에 끝까지 읽는다.",rev:false},
  {id:999,text:"외부 자극에 흔들리지 않고 일한다.",rev:false},
  {id:1000,text:"복잡한 과제의 핵심을 파악하는 데 능하다.",rev:false},
  {id:1001,text:"한 가지 주제를 깊게 연구하는 것을 좋아한다.",rev:false},
  {id:1002,text:"집중이 요구되는 환경에 익숙하다.",rev:false},
  {id:1003,text:"여러 정보를 동시에 처리하면서도 실수를 줄인다.",rev:false},
  {id:1004,text:"작업 중 방해를 최소화한다.",rev:false},
  {id:1005,text:"일정 시간 몰입하는 습관이 있다.",rev:false},
  {id:1006,text:"디테일 체크를 습관처럼 한다.",rev:false},
  {id:1007,text:"계획적인 작업을 통해 집중력을 유지한다.",rev:false},
  {id:1008,text:"몰입을 위한 환경을 스스로 만든다.",rev:false},
  {id:1009,text:"장시간 회의 중에도 집중을 잃지 않는다.",rev:false},
  // 역문항 30 (기존 5 + 신규 25)
  {id:163,text:"흥미로운 자극이 있으면 시선이 자주 옮겨간다.",rev:true},
  {id:166,text:"여러 일을 동시에 하면 집중이 흐트러진다.",rev:true},
  {id:168,text:"업무 도중 SNS나 핸드폰을 자주 확인한다.",rev:true},
  {id:172,text:"회의 중 집중력을 끝까지 유지하기 어렵다.",rev:true},
  {id:174,text:"한 과제를 끝내기 전에 다른 과제로 넘어가곤 한다.",rev:true},
  {id:1010,text:"작은 소음에도 쉽게 집중이 흐트러진다.",rev:true},
  {id:1011,text:"스마트폰 알림에 자주 반응한다.",rev:true},
  {id:1012,text:"회의 중 딴 생각을 한다.",rev:true},
  {id:1013,text:"한 자리에서 한 시간 이상 같은 작업을 이어가기 어렵다.",rev:true},
  {id:1014,text:"큰 흐름을 먼저 파악한 뒤 디테일은 나중에 보충한다.",rev:true},
  {id:1015,text:"여러 일을 동시에 하면 정신이 혼란스럽다.",rev:true},
  {id:1016,text:"일하는 중간에 주변 채팅이나 알림창을 자주 본다.",rev:true},
  {id:1017,text:"반복 업무에서 실수가 많다.",rev:true},
  {id:1018,text:"업무 흐름이 자주 깨진다.",rev:true},
  {id:1019,text:"주변 환경에 쉽게 산만해진다.",rev:true},
  {id:1020,text:"집중해야 할 일 앞에서 정리정돈부터 하게 될 때가 있다.",rev:true},
  {id:1021,text:"하던 일을 금방 잊고 다른 일을 한다.",rev:true},
  {id:1022,text:"긴 문서를 끝까지 읽기 힘들다.",rev:true},
  {id:1023,text:"세밀한 작업은 중간중간 환기가 필요하다.",rev:true},
  {id:1024,text:"집중하려 해도 잡생각이 계속 떠오른다.",rev:true},
  {id:1025,text:"공부 중 휴식이 자주 필요하다.",rev:true},
  {id:1026,text:"업무 중 휴대폰을 내려놓지 못한다.",rev:true},
  {id:1027,text:"주의를 끌 만한 요소가 있으면 금방 끌린다.",rev:true},
  {id:1028,text:"몰입에 들어갔다가도 짧은 자극에 빠져나오는 편이다.",rev:true},
  {id:1029,text:"복잡한 과제는 잠시 미뤄두었다가 다시 보는 편이다.",rev:true},
  {id:1030,text:"시간이 지나면 주의력이 떨어진다.",rev:true},
  {id:1031,text:"집중이 필요한 순간에도 이것저것 확인한다.",rev:true},
  {id:1032,text:"방해 요소가 있으면 바로 흐트러진다.",rev:true},
  {id:1033,text:"같은 자리에서 오래 일하기 어렵다.",rev:true},
  {id:1034,text:"여러 업무를 오가다 보면 어디까지 했는지 다시 확인하게 된다.",rev:true},
]);

// ══════════════════════════════════════
// SD (사회적 바람직성) — 15풀 (매번 5출제)
// ══════════════════════════════════════
const SD_POOL = w("SD", [
  // 기존 5
  {id:177,text:"나는 한 번도 거짓말을 한 적이 없다.",rev:false},
  {id:178,text:"다른 사람에게 불만을 가져본 적이 전혀 없다.",rev:false},
  {id:179,text:"나는 항상 모든 사람에게 공정하게 행동한다.",rev:false},
  {id:180,text:"화가 난 적이 단 한 번도 없다.",rev:false},
  {id:181,text:"나는 어떤 상황에서도 완벽하게 자기 통제를 한다.",rev:false},
  // 신규 10
  {id:1035,text:"나는 살면서 한 번도 누군가를 험담한 적이 없다.",rev:false},
  {id:1036,text:"누군가 어려움에 처하면 언제나 도와왔다.",rev:false},
  {id:1037,text:"내가 싫어하는 사람은 단 한 명도 없다.",rev:false},
  {id:1038,text:"나는 항상 모든 규칙을 지켜왔다.",rev:false},
  {id:1039,text:"지금까지 단 한 번도 약속을 어긴 적이 없다.",rev:false},
  {id:1040,text:"나는 결코 실수를 한 적이 없다.",rev:false},
  {id:1041,text:"나는 태어나서 한 번도 거짓말을 한 적이 없다.",rev:false},
  {id:1042,text:"나는 매일 예외 없이 완벽하게 할 일을 마친다.",rev:false},
  {id:1043,text:"나는 어떤 상황에서도 완벽하게 인내한다.",rev:false},
  {id:1044,text:"나는 단 한 번도 게으름을 피운 적이 없다.",rev:false},
]);

// ══════════════════════════════════════
// CC (일관성 검증) — 20쌍 풀 (매번 9쌍 출제)
// 각 CC 문항은 특정 기본 문항(pair)과 내용이 유사
// ══════════════════════════════════════
const CC_POOL = w("CC", [
  // 기존 9
  {id:182,text:"꼼꼼한 성격이라는 말을 자주 듣는다.",rev:false,pair:29},
  {id:183,text:"사람들 사이에 있으면 힘이 난다.",rev:false,pair:45},
  {id:184,text:"다른 사람의 아픔에 같이 슬퍼진다.",rev:false,pair:67},
  {id:185,text:"항상 같은 방식대로 하는 것이 답답하게 느껴진다.",rev:false,pair:9},
  {id:186,text:"웬만한 일에는 동요하지 않는 편이다.",rev:false,pair:91},
  {id:187,text:"시키지 않아도 알아서 일을 찾아 한다.",rev:false,pair:142},
  {id:188,text:"한 가지에 오래 집중하는 것이 자연스럽다.",rev:false,pair:159},
  {id:189,text:"팀을 이끄는 것이 자연스럽다.",rev:false,pair:111},
  {id:190,text:"압박 속에서도 평소 실력을 발휘한다.",rev:false,pair:129},
  // 신규 11
  {id:1045,text:"창의적인 상상력을 가지고 있다.",rev:false,pair:2},
  {id:1046,text:"내가 맡은 업무는 끝까지 책임지는 편이다.",rev:false,pair:24},
  {id:1047,text:"처음 만나는 사람과 대화하는 것이 즐겁다.",rev:false,pair:47},
  {id:1048,text:"타인을 도와줄 때 보람을 느낀다.",rev:false,pair:69},
  {id:1049,text:"실패해도 금방 마음을 추스르는 편이다.",rev:false,pair:92},
  {id:1050,text:"맡은 역할에 대한 책임을 지는 데 부담이 없다.",rev:false,pair:117},
  {id:1051,text:"자기계발을 위해 스스로 공부하는 편이다.",rev:false,pair:143},
  {id:1052,text:"시끄러운 환경에서도 집중력을 유지할 수 있다.",rev:false,pair:160},
  {id:1053,text:"갑작스러운 문제 상황에서도 빠르게 해결책을 찾는다.",rev:false,pair:131},
  {id:1054,text:"미술관이나 공연 관람을 좋아한다.",rev:false,pair:3},
  {id:1055,text:"회의 자리에서 적극적으로 의견을 말한다.",rev:false,pair:49},
]);

// ══════════════════════════════════════
// IF (비빈도) — 8풀 (매번 4출제)
// ══════════════════════════════════════
const IF_POOL = w("IF", [
  // 기존 4
  {id:401,text:"타오르는 불꽃을 오래 바라보면 묘하게 빠져드는 기분이 든다.",rev:false},
  {id:402,text:"거울 앞에서 내 얼굴을 오래 보고 있으면 내 얼굴이 낯설게 느껴질 때가 있다.",rev:false},
  {id:403,text:"비가 쏟아지는 날 우산 없이 그냥 걸어보고 싶은 충동이 든다.",rev:false},
  {id:404,text:"조용한 공공장소에서 갑자기 큰 소리를 내보고 싶다는 생각이 든 적이 있다.",rev:false},
  // 신규 4
  {id:1056,text:"가끔 시간이 평소와 다르게 흐르는 것처럼 느껴질 때가 있다.",rev:false},
  {id:1057,text:"밤에 혼자 있을 때 방 안에 누군가 더 있는 것 같은 기분이 든 적이 있다.",rev:false},
  {id:1058,text:"특정 숫자를 보면 묘하게 끌리거나 불편해진다.",rev:false},
  {id:1059,text:"높은 곳에 서면 아래로 뛰어내리고 싶은 충동이 스치듯 든다.",rev:false},
]);

// ══════════════════════════════════════
// 풀 매핑 + 하위 호환 export
// ══════════════════════════════════════
const DIM_POOLS = { O:O_POOL, C:C_POOL, E:E_POOL, A:A_POOL, N:N_POOL, L:L_POOL, S:S_POOL, I:I_POOL, F:F_POOL };

// 하위 호환: 전체 풀을 flat으로 export
export const BASE_QUESTIONS = [
  ...O_POOL, ...C_POOL, ...E_POOL, ...A_POOL, ...N_POOL, ...L_POOL, ...S_POOL, ...I_POOL, ...F_POOL,
  ...SD_POOL, ...CC_POOL, ...IF_POOL,
];
// 하위 호환: CC 전체 쌍 맵 (실제 검사에서는 selectQuestions의 ccPairs 사용)
export const CC_PAIRS = CC_POOL.map(c => [c.id, c.pair]);
// 하위 호환: IF 전체 ID 목록
export const IF_IDS = IF_POOL.map(q => q.id);

// 기본 문항 ID → 문항 매핑 (CC pair 재조합용)
const BASE_BY_ID = {};
Object.values(DIM_POOLS).forEach(pool => pool.forEach(q => { BASE_BY_ID[q.id] = q; }));

// ══════════════════════════════════════
// 랜덤 유틸 (seed 기반)
// ══════════════════════════════════════
function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffleArray(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickN(arr, n, rand) {
  return shuffleArray(arr, rand).slice(0, n);
}

// ══════════════════════════════════════
// selectQuestions — 매 검사 세션마다 호출
// 구성: 본검사 182 + SD 5 + CC 9 + IF 4 = 200
// 반환: { questions, ccPairs, ifIds, revPairs }
// ══════════════════════════════════════
export function selectQuestions(seed) {
  const rand = mulberry32(seed || Math.floor(Math.random() * 2147483647));
  const selected = [];

  // 1) 9차원 × 20 + 2개 차원 +1 = 182 (정:역 = 7:3)
  const counts = new Array(DIMS_ORDER.length).fill(20);
  const extraIdx = pickN(DIMS_ORDER.map((_, i) => i), 2, rand);
  extraIdx.forEach(i => counts[i] += 1);

  DIMS_ORDER.forEach((d, i) => {
    const total = counts[i];
    const nRev = Math.round(total * 0.3);
    const nPos = total - nRev;
    const pool = DIM_POOLS[d];
    const poolPos = pool.filter(q => !q.rev);
    const poolRev = pool.filter(q => q.rev);
    selected.push(...pickN(poolPos, nPos, rand));
    selected.push(...pickN(poolRev, nRev, rand));
  });

  // 2) SD 15 → 5
  selected.push(...pickN(SD_POOL, 5, rand));

  // 3) CC 20 → 9 + 페어 기본 문항을 본 검사에 포함 (일관성 계산 보장)
  const ccSelected = pickN(CC_POOL, 9, rand);
  const selectedIdSet = new Set(selected.map(q => q.id));
  ccSelected.forEach(cc => {
    const pairQ = BASE_BY_ID[cc.pair];
    if (!pairQ) return;
    if (selectedIdSet.has(pairQ.id)) return;
    // 페어 문항이 본 검사에 없으면, 같은 차원/동일 rev 속성 문항 하나와 교체
    const dimMatch = selected
      .map((q, idx) => ({ q, idx }))
      .filter(x => x.q.dim === pairQ.dim && x.q.rev === pairQ.rev && x.q.id !== pairQ.id);
    if (dimMatch.length > 0) {
      const replace = dimMatch[Math.floor(rand() * dimMatch.length)];
      selectedIdSet.delete(replace.q.id);
      selected[replace.idx] = pairQ;
      selectedIdSet.add(pairQ.id);
    } else {
      // 동일 조건 없으면 그냥 추가 (드문 케이스)
      selected.push(pairQ);
      selectedIdSet.add(pairQ.id);
    }
  });
  selected.push(...ccSelected);
  const ccPairs = ccSelected.map(c => [c.id, c.pair]);

  // 4) IF 8 → 4
  const ifSelected = pickN(IF_POOL, 4, rand);
  selected.push(...ifSelected);
  const ifIds = ifSelected.map(q => q.id);

  // 5) revPairs — 선정된 문항 중 차원별 정/역 쌍을 동적으로 구성 (차원당 최대 2쌍)
  const revPairs = [];
  DIMS_ORDER.forEach(d => {
    const pos = selected.filter(q => q.dim === d && !q.rev).map(q => q.id);
    const rev = selected.filter(q => q.dim === d && q.rev).map(q => q.id);
    const n = Math.min(pos.length, rev.length, 2);
    const posSh = shuffleArray(pos, rand);
    const revSh = shuffleArray(rev, rand);
    for (let i = 0; i < n; i++) revPairs.push([posSh[i], revSh[i]]);
  });

  // 6) 전체 순서 뒤섞기
  const questions = shuffleArray(selected, rand);

  return { questions, ccPairs, ifIds, revPairs };
}

// ══════════════════════════════════════
// PERSONALITY_TYPES (유지)
// ══════════════════════════════════════
export const PERSONALITY_TYPES = [
  {name:"전략적 혁신가",emoji:"🚀",condition:(s)=>s.O>=75&&s.L>=70&&s.C>=65,
    desc:"새로운 아이디어와 비전을 제시하며, 이를 체계적으로 실행까지 이끌어내는 유형입니다.",
    strengths:"비전 제시, 창의적 문제해결, 전략적 사고",weaknesses:"완벽주의 경향, 타인의 속도에 대한 인내 부족",
    tips:["인성검사에서 '새로운 시도'와 '계획성' 문항에 모두 높게 응답하는 경향이 있어요. 모든 항목에 '매우 그렇다'만 찍으면 과장 응답으로 잡혀요.","혁신 성향이 강하면 '규칙 준수' 문항에서 점수가 낮아질 수 있는데, 기업은 균형을 봐요.","리더십 문항에서 '나 혼자 다 한다'보다 '팀과 함께 이끈다' 방향이 유리해요."],
    warnings:["과대 자기평가 경향이 있다면 일관성 검증에서 모순이 드러날 수 있어요.","개방성이 너무 높고 성실성이 낮으면 '실행력 부족'으로 분류돼요.","역문항을 놓치면 일관성 점수가 급락해요. 문항을 끝까지 읽으세요."]},
  {name:"안정적 실행가",emoji:"⚙️",condition:(s)=>s.C>=80&&s.N>=75&&s.S>=70,
    desc:"맡은 일을 묵묵히 완수하는 신뢰할 수 있는 유형입니다.",
    strengths:"책임감, 꾸준함, 위기 대응력",weaknesses:"변화에 대한 저항, 새로운 시도 주저",
    tips:["성실성이 높아 인성검사에서 유리한 편이에요.","'변화' 관련 문항에서 너무 부정적으로 답하면 '경직된 사람'으로 보여요.","스트레스 내성이 높다는 건 큰 장점이에요."],
    warnings:["성실성 문항에 전부 최고점 + 바람직성 문항에도 최고점이면 과장 응답으로 판정돼요.","역문항에서 일관성이 깨지기 쉬워요.","너무 완벽한 답변 패턴은 오히려 의심을 사요."]},
  {name:"소통형 리더",emoji:"🤝",condition:(s)=>s.E>=75&&s.A>=70&&s.L>=65,
    desc:"사람들과의 관계 속에서 시너지를 만들어내는 유형입니다.",
    strengths:"소통 능력, 팀 빌딩, 갈등 중재",weaknesses:"결단력 부족, 감정적 판단 경향",
    tips:["SK, LG 같은 협업 문화 기업에 잘 맞아요.","'결단력' 문항에서 낮으면 '결정 못 하는 리더'로 보여요.","갈등 상황에서 '합리적 조율' 방향이 좋은 평가를 받아요."],
    warnings:["외향+친화가 극단적으로 높으면 '자기 주관 없는 사람'으로 해석돼요.","감정 기복 문항에서 불안정하면 '감정적 사람'으로 분류돼요.","바람직성 문항에 높게 답하면 과장 응답에 걸려요."]},
  {name:"분석적 전문가",emoji:"🔬",condition:(s)=>s.O>=70&&s.C>=75&&s.F>=70,
    desc:"깊은 전문성과 집중력으로 문제의 본질을 파악하는 유형입니다.",
    strengths:"분석력, 전문성, 높은 집중력",weaknesses:"협업 시 소통 부족, 과도한 분석 경향",
    tips:["연구직, 기술직에 유리한 프로파일이에요.","외향성이 낮은 건 자연스러운 특성이에요.","팀 내 전문가 역할로서의 협업이 가능하다는 뉘앙스로 응답하세요."],
    warnings:["'사람을 피한다'가 아니라 '혼자 일할 때 효율적'으로 읽혀야 해요.","문항을 너무 깊이 분석하느라 시간이 오래 걸릴 수 있어요.","집중력이 높지만 협업 문항도 챙기세요."]},
  {name:"자율적 추진자",emoji:"🔥",condition:(s)=>s.I>=75&&s.L>=70&&s.S>=65,
    desc:"스스로 목표를 세우고 강한 자주성과 추진력으로 밀어붙이는 유형입니다.",
    strengths:"자주성, 추진력, 자기주도 학습",weaknesses:"독단적 판단, 협업 부족 가능",
    tips:["삼성, 현대차 같이 실행력을 강조하는 기업에서 높은 적합도를 보여요.","자주성이 높지만 친화성 문항도 챙겨야 '독불장군'으로 안 보여요.","'계산된 도전'의 뉘앙스가 중요해요."],
    warnings:["자주성 문항 전부 최고점 + 친화성 최저점이면 '협업 불가'로 분류돼요.","감정을 아예 안 느끼는 것처럼 답하면 비현실적으로 보여요.","'팀과 함께 해결한다'가 더 좋은 평가를 받아요."]},
  {name:"유연한 조율자",emoji:"🎯",condition:(s)=>s.A>=75&&s.N>=70&&s.S>=65,
    desc:"상황에 맞게 유연하게 대처하며, 팀의 균형을 잡아주는 유형입니다.",
    strengths:"유연성, 정서적 안정감, 팀워크",weaknesses:"주도성 부족, 자기주장 약함",
    tips:["대부분의 기업에서 안정적인 프로파일로 평가받아요.","리더십 문항에서 너무 소극적이면 '팔로워형'으로만 분류돼요.","자주성 문항에서도 적극적인 면을 보여주세요."],
    warnings:["모든 문항에 '보통'만 찍으면 '무성의한 응답'으로 판정돼요.","유연함과 우유부단함은 달라요.","자주성 점수가 너무 낮으면 불리해요."]},
  {name:"공감형 서포터",emoji:"💚",condition:(s)=>s.A>=80&&s.E>=60,
    desc:"따뜻한 공감 능력과 배려심으로 주변 사람들에게 신뢰를 받는 유형입니다.",
    strengths:"공감 능력, 신뢰 구축, 팀 문화 기여",weaknesses:"갈등 회피, 자기 의견 표현 부족",
    tips:["HR, CS, 교육 같은 사람 중심 직무에 적합해요.","논리적 판단력도 함께 봐요.","'경청 후 합리적 조율' 방향이 더 높은 평가를 받아요."],
    warnings:["친화성이 극단적으로 높으면 '자기 주관 없는 사람'으로 보여요.","바람직성 문항에 전부 동의하면 과장 응답으로 잡혀요.","자주성, 리더십 문항도 챙기세요."]},
  {name:"균형잡힌 올라운더",emoji:"⭐",condition:()=>true,
    desc:"전반적으로 균형 잡힌 성향을 보여주는 유형입니다.",
    strengths:"적응력, 범용성, 안정감",weaknesses:"뚜렷한 강점 부재, 차별화 어려움",
    tips:["균형잡힌 프로파일은 무난하지만 인상을 남기기 어려워요.","면접에서 차별화 포인트를 만들어야 해요.","최소 한두 개 차원에서는 강점을 보여주세요."],
    warnings:["모든 문항에 '보통'은 '무성의한 응답'으로 판정돼요.","뚜렷한 강점이 없으면 '굳이 뽑아야 할 이유'를 찾기 어려워요.","일관성 점수가 낮으면 '대충 풀었다'로 해석돼요."]},
];
