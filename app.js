/* =====================================================
   AMERICAN DREAM INDEX — app.js
   Research-based scoring algorithm + UI logic
   ===================================================== */

'use strict';

// ── State: collected answers ──────────────────────────
const A = {};   // answers keyed by field name
const TOTAL_STEPS = 7;

// ── State opportunity scores (Raj Chetty, Opportunity Atlas 2018) ────────────
// Represents probability of upward income mobility for children in each state.
// Scaled 0–100. Source: opportunityatlas.org
const STATE_DATA = {
  AL: { name:'Alabama',             opp: 32 },
  AK: { name:'Alaska',              opp: 66 },
  AZ: { name:'Arizona',             opp: 58 },
  AR: { name:'Arkansas',            opp: 38 },
  CA: { name:'California',          opp: 54 },
  CO: { name:'Colorado',            opp: 73 },
  CT: { name:'Connecticut',         opp: 64 },
  DE: { name:'Delaware',            opp: 60 },
  FL: { name:'Florida',             opp: 50 },
  GA: { name:'Georgia',             opp: 42 },
  HI: { name:'Hawaii',              opp: 63 },
  ID: { name:'Idaho',               opp: 70 },
  IL: { name:'Illinois',            opp: 57 },
  IN: { name:'Indiana',             opp: 62 },
  IA: { name:'Iowa',                opp: 80 },
  KS: { name:'Kansas',              opp: 72 },
  KY: { name:'Kentucky',            opp: 44 },
  LA: { name:'Louisiana',           opp: 30 },
  ME: { name:'Maine',               opp: 68 },
  MD: { name:'Maryland',            opp: 64 },
  MA: { name:'Massachusetts',       opp: 76 },
  MI: { name:'Michigan',            opp: 56 },
  MN: { name:'Minnesota',           opp: 85 },
  MS: { name:'Mississippi',         opp: 28 },
  MO: { name:'Missouri',            opp: 55 },
  MT: { name:'Montana',             opp: 68 },
  NE: { name:'Nebraska',            opp: 78 },
  NV: { name:'Nevada',              opp: 51 },
  NH: { name:'New Hampshire',       opp: 77 },
  NJ: { name:'New Jersey',          opp: 66 },
  NM: { name:'New Mexico',          opp: 40 },
  NY: { name:'New York',            opp: 57 },
  NC: { name:'North Carolina',      opp: 48 },
  ND: { name:'North Dakota',        opp: 88 },
  OH: { name:'Ohio',                opp: 56 },
  OK: { name:'Oklahoma',            opp: 44 },
  OR: { name:'Oregon',              opp: 68 },
  PA: { name:'Pennsylvania',        opp: 60 },
  RI: { name:'Rhode Island',        opp: 60 },
  SC: { name:'South Carolina',      opp: 42 },
  SD: { name:'South Dakota',        opp: 76 },
  TN: { name:'Tennessee',           opp: 46 },
  TX: { name:'Texas',               opp: 58 },
  UT: { name:'Utah',                opp: 86 },
  VT: { name:'Vermont',             opp: 74 },
  VA: { name:'Virginia',            opp: 65 },
  WA: { name:'Washington',          opp: 72 },
  WV: { name:'West Virginia',       opp: 38 },
  WI: { name:'Wisconsin',           opp: 79 },
  WY: { name:'Wyoming',             opp: 70 },
  DC: { name:'Washington D.C.',     opp: 45 },
};

// ── Init on load ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  populateStates();
  syncSlider('age', 'ageVal');
});

// ── Populate state dropdown ───────────────────────────
function populateStates() {
  const sel = document.getElementById('state');
  Object.entries(STATE_DATA)
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
    .forEach(([code, d]) => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = d.name;
      sel.appendChild(opt);
    });
}

// ── Slider sync ───────────────────────────────────────
function syncSlider(inputId, displayId) {
  const val = document.getElementById(inputId).value;
  document.getElementById(displayId).textContent = val;
  A[inputId] = parseInt(val);
}

// ── Option button selection ───────────────────────────
function pick(btn, field, value) {
  // Deselect siblings in the same container
  const container = btn.closest('[id$="-opts"]') || btn.parentElement;
  container.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  A[field] = value;

  // Clear any validation error
  const err = document.getElementById(`err-${field}`);
  if (err) err.style.display = 'none';
}

// ── Show/hide equity group ────────────────────────────
function showEquity(show) {
  document.getElementById('equityGroup').style.display = show ? 'block' : 'none';
  if (!show) delete A.homeEquity;
}

// ── Step navigation ───────────────────────────────────
function goToStep(n) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(n === 'results' ? 'step-results' : `step-${n}`);
  if (target) target.classList.add('active');

  // Update progress bar
  if (n === 0 || n === 'results') {
    document.getElementById('progressWrap').style.display = 'none';
  } else {
    document.getElementById('progressWrap').style.display = 'flex';
    const pct = ((n - 1) / TOTAL_STEPS) * 100;
    document.getElementById('progressBar').style.width = pct + '%';
    document.getElementById('progressLabel').textContent = `Step ${n} of ${TOTAL_STEPS}`;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Validate then navigate ────────────────────────────
function next(from, to, requiredFields) {
  // Collect slider/select values
  const ageEl = document.getElementById('age');
  if (ageEl) A.age = parseInt(ageEl.value);
  const stateEl = document.getElementById('state');
  if (stateEl && stateEl.value) A.state = stateEl.value;

  const missing = requiredFields.filter(f => {
    if (f === 'state') return !A.state;
    return !A[f];
  });

  if (missing.length > 0) {
    // Show error near first missing field
    showError(missing[0], `Please answer this question before continuing.`);
    return;
  }
  goToStep(to);
}

function showError(field, msg) {
  let errId = `err-${field}`;
  let errEl = document.getElementById(errId);
  if (!errEl) {
    // Find the opt container and append error
    const container = document.getElementById(`${field}-opts`)
      || document.getElementById('state')?.parentElement
      || document.querySelector(`[data-field="${field}"]`);
    errEl = document.createElement('div');
    errEl.id = errId;
    errEl.className = 'validation-error';
    if (container) container.insertAdjacentElement('afterend', errEl);
    else document.getElementById(`step-${field}`) && document.getElementById(`step-${field}`).appendChild(errEl);
  }
  errEl.textContent = msg;
  errEl.style.display = 'block';
  errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ── Calculate and display results ────────────────────
function submitAndScore() {
  // Collect last-step answers
  const stateEl = document.getElementById('state');
  if (stateEl && stateEl.value) A.state = stateEl.value;
  const ageEl = document.getElementById('age');
  if (ageEl) A.age = parseInt(ageEl.value);

  const req = ['insurance', 'healthAfford'];
  const missing = req.filter(f => !A[f]);
  if (missing.length > 0) { showError(missing[0], 'Please answer this question.'); return; }

  const scores = computeScores();
  const total = computeTotal(scores);
  renderResults(scores, total);
  goToStep('results');
}

// =====================================================
//   SCORING ENGINE
// =====================================================

function computeScores() {
  return {
    income:    scoreIncome(),
    mobility:  scoreMobility(),
    education: scoreEducation(),
    housing:   scoreHousing(),
    financial: scoreFinancial(),
    health:    scoreHealth(),
    geography: scoreGeography(),
  };
}

function computeTotal(s) {
  // Weights: income 25%, mobility 20%, education 15%, housing 15%, financial 15%, health 5%, geography 5%
  return Math.round(
    s.income    * 0.25 +
    s.mobility  * 0.20 +
    s.education * 0.15 +
    s.housing   * 0.15 +
    s.financial * 0.15 +
    s.health    * 0.05 +
    s.geography * 0.05
  );
}

// ── 1. Income Score (0–100) ───────────────────────────
// Source: Census Bureau ACS 2022, U.S. median HHI = $74,580
// Adjusted for household size via OECD equivalence scale (÷ √size)
function scoreIncome() {
  const incomeMap = {
    under25:  12, '25to40': 28, '40to60': 46,
    '60to80': 62, '80to100': 74, '100to150': 84,
    '150to250': 93, over250: 100,
  };
  const base = incomeMap[A.income] ?? 50;

  // Household size adjustment: larger households need more income for equivalent living standards
  const size = parseInt(A.householdSize) || 1;
  const sizeAdjust = {1: 0, 2: 0, 3: -4, 4: -7, 5: -10, 6: -13}[Math.min(size, 6)] ?? 0;

  // Employment penalty: unemployment or part-time with same income signals instability
  const empPenalty = { unemployed: -15, parttime: -5, student: -8 }[A.employment] ?? 0;

  return clamp(base + sizeAdjust + empPenalty, 0, 100);
}

// ── 2. Mobility Score (0–100) ─────────────────────────
// Source: Chetty et al. "The Fading American Dream" (Science, 2017)
// Upward mobility from low-income start is the quintessential American Dream
function scoreMobility() {
  // Matrix: [starting class][change] → score
  const matrix = {
    poor:       { muchworse: 15, worse: 22, same: 42, better: 78, muchbetter: 100 },
    working:    { muchworse: 10, worse: 18, same: 50, better: 82, muchbetter: 100 },
    middle:     { muchworse:  5, worse: 14, same: 55, better: 80, muchbetter:  95 },
    uppermiddle:{ muchworse:  5, worse: 10, same: 60, better: 76, muchbetter:  88 },
    wealthy:    { muchworse:  5, worse: 10, same: 65, better: 73, muchbetter:  82 },
  };
  return matrix[A.parentsClass]?.[A.mobilityChange] ?? 50;
}

// ── 3. Education Score (0–100) ────────────────────────
// Source: Georgetown Center on Education and the Workforce (2021)
// Bachelor's holders earn 84% more over lifetime vs. HS diploma only
function scoreEducation() {
  const eduBase = {
    nodiploma: 10, highschool: 36, somecollege: 52,
    associates: 63, bachelors: 82, graduate: 100,
  };
  const debtPenalty = {
    none: 0, under25k: 5, '25to50k': 12, '50to100k': 20, over100k: 30,
  };
  const base    = eduBase[A.education] ?? 50;
  const penalty = debtPenalty[A.studentDebt] ?? 0;
  return clamp(base - penalty, 0, 100);
}

// ── 4. Housing Score (0–100) ──────────────────────────
// Source: Census Bureau (2023) homeownership rate = 65.6%
// HUD defines housing burden as >30% of income; severe burden = >50%
function scoreHousing() {
  let base;
  if (A.housingStatus === 'ownoutright') {
    base = 92;
  } else if (A.housingStatus === 'ownmortgage') {
    const equityMap = { underwater: 24, under20: 56, '20to50': 72, over50: 86 };
    base = equityMap[A.homeEquity] ?? 65;
  } else if (A.housingStatus === 'rent') {
    base = 22;
  } else {
    base = 5;  // unstable
  }

  // Housing cost burden adjustment
  const costAdjust = {
    under20: +12, '20to28': +6, '28to35': 0, '35to45': -12, over45: -22,
  };
  base += costAdjust[A.housingCostPct] ?? 0;

  return clamp(base, 0, 100);
}

// ── 5. Financial Security Score (0–100) ───────────────
// Source: Federal Reserve Survey of Consumer Finances; Bankrate Emergency Savings 2024
// Fidelity retirement benchmarks; Federal Reserve debt-to-income guidelines
function scoreFinancial() {
  // Emergency fund (max 40 pts)
  const efPts = { none: 4, '1to3': 18, '3to6': 30, over6: 40 }[A.emergencyFund] ?? 15;

  // Retirement track (max 35 pts)
  const retPts = { ahead: 35, ontrack: 27, slightlybehind: 16, significantlybehind: 7, notsaving: 0 }[A.retirement] ?? 15;

  // Non-mortgage debt-to-income (max 25 pts)
  const debtPts = { under10: 25, '10to20': 18, '20to35': 10, '35to50': 4, over50: 0 }[A.debtRatio] ?? 12;

  return clamp(efPts + retPts + debtPts, 0, 100);
}

// ── 6. Health Score (0–100) ───────────────────────────
// Source: CDC National Health Interview Survey (2023); KFF Health Care Costs Survey
// Medical debt is a top cause of bankruptcy; 1 in 4 Americans skip care due to cost
function scoreHealth() {
  const insuranceBase = { employer: 68, private: 58, government: 62, uninsured: 8 }[A.insurance] ?? 40;
  const affordAdjust = { always: +32, usually: +18, sometimes: 0, rarely: -18, avoid: -28 }[A.healthAfford] ?? 0;
  return clamp(insuranceBase + affordAdjust, 5, 100);
}

// ── 7. Geography Score (0–100) ────────────────────────
// Source: Chetty & Friedman, Opportunity Atlas (2018)
// Children from bottom income quintile: probability of reaching top quintile varies 3x by state
function scoreGeography() {
  return STATE_DATA[A.state]?.opp ?? 55;
}

// ── Helper ────────────────────────────────────────────
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

// =====================================================
//   RESULTS RENDERER
// =====================================================

function renderResults(scores, total) {
  const tier     = getTier(total);
  const stateInfo = STATE_DATA[A.state] || { name: 'your state', opp: scores.geography };
  const age      = A.age || 35;

  // Build gauge arc path
  const arcPath = buildGaugeArc(total);
  const scoreColor = getScoreColor(total);

  // Category display config
  const categories = [
    {
      key: 'income',    label: 'Income & Employment', weight: '25%',
      score: scores.income,
      context: incomeContext(),
    },
    {
      key: 'mobility',  label: 'Upward Mobility', weight: '20%',
      score: scores.mobility,
      context: mobilityContext(),
    },
    {
      key: 'education', label: 'Education', weight: '15%',
      score: scores.education,
      context: educationContext(),
    },
    {
      key: 'housing',   label: 'Housing', weight: '15%',
      score: scores.housing,
      context: housingContext(),
    },
    {
      key: 'financial', label: 'Financial Security', weight: '15%',
      score: scores.financial,
      context: financialContext(),
    },
    {
      key: 'health',    label: 'Health Security', weight: '5%',
      score: scores.health,
      context: healthContext(),
    },
    {
      key: 'geography', label: 'Geographic Opportunity', weight: '5%',
      score: scores.geography,
      context: `${stateInfo.name} ranks among the ${stateInfo.opp >= 70 ? 'top' : stateInfo.opp >= 50 ? 'middle' : 'bottom'} states for upward mobility (Opportunity Atlas).`,
    },
  ];

  const insights    = generateInsights(scores, total);
  const tips        = generateTips(scores);
  const nationalCtx = getNationalStats(scores, total);

  // Inject HTML
  const el = document.getElementById('step-results');
  el.innerHTML = `
<div class="results-wrap">

  <!-- SCORE HERO -->
  <div class="score-hero">
    <div class="score-hero-label">Your American Dream Index Score</div>
    <svg class="gauge-svg" viewBox="0 0 240 150" width="320" height="200">
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   style="stop-color:#c0392b"/>
          <stop offset="30%"  style="stop-color:#e67e22"/>
          <stop offset="55%"  style="stop-color:#d4a017"/>
          <stop offset="80%"  style="stop-color:#27ae60"/>
          <stop offset="100%" style="stop-color:#1a6b3a"/>
        </linearGradient>
      </defs>
      <!-- Track -->
      <path d="M 30 120 A 90 90 0 0 1 210 120"
        fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="18" stroke-linecap="round"/>
      <!-- Fill -->
      <path class="gauge-fill" d="${arcPath}"
        fill="none" stroke="url(#gaugeGrad)" stroke-width="18" stroke-linecap="round"/>
      <!-- Score number -->
      <text x="120" y="112" class="gauge-score-num" font-size="52">${total}</text>
      <text x="120" y="132" class="gauge-score-sub" font-size="13">out of 100</text>
    </svg>

    <div class="tier-badge tier-${tier.cls}">${tier.emoji}&nbsp; ${tier.label}</div>
    <p class="tier-desc-text">${tier.description}</p>

    <div class="meta-tags">
      <div class="meta-tag">Age <span>${age}</span></div>
      <div class="meta-tag">State <span>${stateInfo.name}</span></div>
      <div class="meta-tag">Percentile <span>~${scoreToPercentile(total)}th</span></div>
    </div>
  </div>

  <div class="results-grid">

    <!-- SCORE BREAKDOWN -->
    <div class="result-card">
      <h3>Score Breakdown by Dimension</h3>
      <div class="breakdown-list">
        ${categories.map(cat => `
          <div class="breakdown-item">
            <div class="breakdown-header">
              <span class="breakdown-name">${cat.label} <small style="color:var(--text-muted);font-weight:400">(${cat.weight})</small></span>
              <span class="breakdown-score-label" style="color:${getScoreColor(cat.score)}">${cat.score}/100</span>
            </div>
            <div class="breakdown-bar-track">
              <div class="breakdown-bar-fill ${getScoreClass(cat.score)}" style="width:${cat.score}%"></div>
            </div>
            <div class="breakdown-context">${cat.context}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- INSIGHTS -->
    <div class="result-card">
      <h3>Key Insights</h3>
      <div class="insight-list">
        ${insights.map(i => `
          <div class="insight-item insight-${i.type}">
            <span class="insight-icon">${i.icon}</span>
            <span>${i.text}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- NATIONAL CONTEXT -->
    <div class="result-card">
      <h3>How You Compare — National Benchmarks</h3>
      <div class="stat-grid">
        ${nationalCtx.map(s => `
          <div class="stat-box">
            <div class="stat-box-num">${s.num}</div>
            <div class="stat-box-label">${s.label}</div>
            <div class="stat-box-sub">${s.sub}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- TIPS -->
    <div class="result-card">
      <h3>Opportunities for Growth</h3>
      <div class="tips-list">
        ${tips.map((t, i) => `
          <div class="tip-item">
            <div class="tip-rank">${i + 1}</div>
            <div class="tip-content">
              <div class="tip-title">${t.title}</div>
              <div class="tip-body">${t.body}</div>
              <div class="tip-potential">${t.potential}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- METHODOLOGY -->
    <div class="result-card">
      <h3>Scoring Methodology &amp; Research Basis</h3>
      <p style="font-size:0.87rem;color:var(--text-muted);line-height:1.6;margin-bottom:16px">
        This index is inspired by landmark economic mobility research. Weights reflect the empirical predictive power of each factor for achieving the traditional markers of the American Dream: stable income, wealth accumulation, homeownership, and intergenerational improvement.
      </p>
      <div class="methodology-grid">
        <div class="method-item">
          <div class="method-name">Income &amp; Employment</div>
          <div class="method-weight">Weight: 25%</div>
          <div class="method-source">U.S. Census Bureau ACS 2022; BLS Employment Statistics</div>
        </div>
        <div class="method-item">
          <div class="method-name">Upward Mobility</div>
          <div class="method-weight">Weight: 20%</div>
          <div class="method-source">Chetty et al., "The Fading American Dream," Science (2017)</div>
        </div>
        <div class="method-item">
          <div class="method-name">Education</div>
          <div class="method-weight">Weight: 15%</div>
          <div class="method-source">Georgetown CEW, "The College Payoff" (2021)</div>
        </div>
        <div class="method-item">
          <div class="method-name">Housing</div>
          <div class="method-weight">Weight: 15%</div>
          <div class="method-source">Census Bureau Housing Vacancies (2023); HUD Cost Burden Standards</div>
        </div>
        <div class="method-item">
          <div class="method-name">Financial Security</div>
          <div class="method-weight">Weight: 15%</div>
          <div class="method-source">Federal Reserve SCF; Bankrate Emergency Savings (2024); Fidelity Benchmarks</div>
        </div>
        <div class="method-item">
          <div class="method-name">Health Security</div>
          <div class="method-weight">Weight: 5%</div>
          <div class="method-source">CDC NHIS (2023); KFF Health Care Costs Survey</div>
        </div>
        <div class="method-item">
          <div class="method-name">Geographic Opportunity</div>
          <div class="method-weight">Weight: 5%</div>
          <div class="method-source">Chetty &amp; Friedman, Opportunity Atlas (2018)</div>
        </div>
      </div>
    </div>

  </div><!-- /results-grid -->

  <div class="retake-section" style="margin-top:32px; padding-bottom: 8px;">
    <button class="btn btn-outline-navy btn-lg" onclick="location.reload()">← Retake the Assessment</button>
  </div>

</div><!-- /results-wrap -->
  `;

  // Animate bars after render
  setTimeout(() => {
    document.querySelectorAll('.breakdown-bar-fill').forEach((bar, i) => {
      setTimeout(() => { bar.style.width = bar.style.width; }, i * 100);
    });
  }, 80);
}

// ── Gauge arc builder ─────────────────────────────────
// Semicircle from (30,120) to (210,120), through (120,30) at top
// Center: (120, 120), Radius: 90
function buildGaugeArc(score) {
  if (score <= 0) return 'M 30 120';
  if (score >= 100) return 'M 30 120 A 90 90 0 0 1 210 120';
  const angleRad = (Math.PI - (score / 100) * Math.PI);
  const x = (120 + 90 * Math.cos(angleRad)).toFixed(3);
  const y = (120 - 90 * Math.sin(angleRad)).toFixed(3);
  return `M 30 120 A 90 90 0 0 1 ${x} ${y}`;
}

// ── Tier system ───────────────────────────────────────
function getTier(score) {
  if (score >= 80) return { label: 'Living the Dream',     cls: 'living',   emoji: '🌟', description: 'You\'ve achieved strong economic security and upward mobility. You represent the ideal the American Dream was built on — you\'ve built genuine financial independence and exceeded the benchmarks that predict long-term prosperity.' };
  if (score >= 65) return { label: 'On Track',             cls: 'ontrack',  emoji: '📈', description: 'You\'re making meaningful progress toward the American Dream. Your economic position is solid, though there are specific areas where improvement would meaningfully close the gap.' };
  if (score >= 48) return { label: 'Climbing',             cls: 'climbing', emoji: '🧗', description: 'You\'re navigating real obstacles to economic mobility. You\'ve made some progress but face structural challenges in one or more key dimensions that constrain your trajectory.' };
  if (score >= 30) return { label: 'Struggling',           cls: 'struggle', emoji: '⚖️', description: 'Significant barriers are limiting your path to economic mobility. Multiple dimensions of your financial life are under strain, making the traditional American Dream harder to access.' };
  return              { label: 'Facing Headwinds',          cls: 'risk',     emoji: '⛅', description: 'You\'re facing serious structural disadvantages across several dimensions. The research is clear: your current position makes upward mobility difficult — but targeted interventions in even one area can shift your trajectory.' };
}

// ── Score color helper ────────────────────────────────
function getScoreColor(score) {
  if (score >= 80) return '#1a6b3a';
  if (score >= 65) return '#27ae60';
  if (score >= 48) return '#d4a017';
  if (score >= 30) return '#e67e22';
  return '#c0392b';
}

function getScoreClass(score) {
  if (score >= 80) return 'fill-dkgreen';
  if (score >= 65) return 'fill-green';
  if (score >= 48) return 'fill-amber';
  if (score >= 30) return 'fill-orange';
  return 'fill-red';
}

// ── Percentile approximation ──────────────────────────
// Rough percentile from score (based on expected distribution of US population)
function scoreToPercentile(score) {
  // US distribution skews low; national average ~ 51
  const map = [ [0,1],[15,4],[20,7],[25,10],[30,15],[35,20],[40,28],[45,36],[48,42],
                [51,50],[55,57],[60,65],[65,72],[70,80],[75,87],[80,92],[85,96],[90,98],[100,99] ];
  for (let i = 1; i < map.length; i++) {
    if (score <= map[i][0]) {
      const [x0,y0] = map[i-1], [x1,y1] = map[i];
      return Math.round(y0 + ((score - x0) / (x1 - x0)) * (y1 - y0));
    }
  }
  return 99;
}

// ── Context strings ───────────────────────────────────
function incomeContext() {
  const labels = {
    under25:'Well below the poverty line for most households ($30,000 threshold). Severe upward mobility constraints.',
    '25to40':'Below the national median. Significant difficulty building wealth or absorbing financial shocks.',
    '40to60':'Approaching the national median ($74,580). Housing and savings remain stretched for most families.',
    '60to80':'Near the national median. Can sustain basic financial stability with discipline.',
    '80to100':'Above median. Meaningful capacity to save, invest, and weather setbacks.',
    '100to150':'Top third of earners. Strong position for wealth accumulation and homeownership.',
    '150to250':'Top 15–20% of earners. Significant advantages across nearly all Dream dimensions.',
    over250:'Top 5% of earners. Structural barriers to the Dream largely removed.',
  };
  return labels[A.income] || '';
}

function mobilityContext() {
  const startLabel = { poor:'poverty', working:'working class', middle:'middle class', uppermiddle:'upper-middle class', wealthy:'wealth' };
  const start = startLabel[A.parentsClass] || 'your background';
  const change = { muchworse:'fallen significantly', worse:'declined somewhat', same:'remained level', better:'risen somewhat', muchbetter:'risen significantly' }[A.mobilityChange] || 'changed';
  return `Starting from ${start}, your economic situation has ${change}. Chetty's research shows intergenerational mobility has fallen sharply since 1940, when 92% of children out-earned their parents.`;
}

function educationContext() {
  const edLabels = {
    nodiploma: 'High school dropouts earn $25,000/year on average — 60% less than bachelor\'s holders over a lifetime.',
    highschool:'HS diploma holders earn ~$38,000/year. The bachelor\'s premium has grown to 84% over a lifetime.',
    somecollege:'Some college without a degree yields limited earnings premium vs. HS. Completion dramatically changes outcomes.',
    associates:'Associate\'s holders earn ~$46,000/year. Strong returns in technical and health fields.',
    bachelors: 'Bachelor\'s degree holders earn a median of $69,000/year — the single biggest earnings lever available.',
    graduate:  'Graduate/professional degree holders earn a median of $83,000+/year, with far higher peaks.',
  };
  return edLabels[A.education] || '';
}

function housingContext() {
  if (A.housingStatus === 'ownoutright') return 'Full homeownership is the gold standard — no mortgage payment frees up significant cash flow and provides complete housing security.';
  if (A.housingStatus === 'ownmortgage') return 'Mortgaged homeownership is the most common wealth-building path. Home equity is the #1 source of net worth for middle-class Americans.';
  if (A.housingStatus === 'rent') return 'Renters accumulate housing wealth at ~$0 vs. homeowners who averaged $225,000 in home equity (Fed SCF, 2022). But renting may be strategic at certain life stages.';
  return 'Unstable housing severely limits all other financial progress. Stable housing is the foundation for economic mobility.';
}

function financialContext() {
  const efLabels = { none:'No emergency fund is the single highest-risk financial position. 56% of Americans share this.', '1to3':'1–3 months covers minor emergencies but not job loss.', '3to6':'The recommended 3–6 month cushion. Covers most unexpected events.', over6:'6+ months provides strong resilience against job loss or health crises.' };
  return efLabels[A.emergencyFund] || 'Financial resilience protects upward mobility gains from being wiped out by setbacks.';
}

function healthContext() {
  if (A.insurance === 'uninsured') return 'Being uninsured exposes you to medical bankruptcy risk — the leading cause of personal financial collapse in the U.S.';
  if (A.healthAfford === 'avoid') return 'Delaying care due to cost often leads to worse health outcomes and higher eventual costs — a mobility trap.';
  return 'Healthcare costs are a major driver of downward mobility. Employer-sponsored coverage provides the strongest protection.';
}

// ── Insights generator ────────────────────────────────
function generateInsights(scores, total) {
  const insights = [];

  // Mobility insight
  if (A.parentsClass === 'poor' && scores.mobility >= 75) {
    insights.push({ type:'positive', icon:'🌟', text:`Rising from poverty to your current position is the quintessential American Dream. Raj Chetty's research finds fewer than 8% of children born in the bottom income quintile reach the top — you are beating the odds.` });
  } else if (['muchworse','worse'].includes(A.mobilityChange)) {
    insights.push({ type:'negative', icon:'📉', text:`Downward mobility from your starting point is the key driver of your score. This is increasingly common — Chetty's research shows the probability of out-earning your parents has fallen from 92% (for those born in 1940) to just 50% (born in 1984).` });
  }

  // Income relative to median
  if (['under25','25to40'].includes(A.income)) {
    insights.push({ type:'negative', icon:'💰', text:`Income below $40,000 creates severe constraints on saving, homeownership, and retirement. At this level, even modest financial shocks can derail mobility progress entirely.` });
  } else if (['150to250','over250'].includes(A.income)) {
    insights.push({ type:'positive', icon:'💰', text:`Your income places you in the top 15–20% of U.S. households, removing most structural barriers to wealth accumulation and homeownership.` });
  }

  // Housing
  if (A.housingStatus === 'ownoutright' || (A.housingStatus === 'ownmortgage' && ['20to50','over50'].includes(A.homeEquity))) {
    insights.push({ type:'positive', icon:'🏠', text:`Homeowners hold a median net worth of $255,000 vs. $6,300 for renters (Fed SCF, 2022) — a 40:1 wealth gap. Building equity is the most reliable wealth-building tool available to middle-class Americans.` });
  } else if (A.housingStatus === 'rent' && A.housingCostPct === 'over45') {
    insights.push({ type:'negative', icon:'🏠', text:`Spending over 45% of income on housing leaves almost nothing for savings or investment. HUD defines this as "severely cost burdened" — a state that makes upward mobility extremely difficult.` });
  }

  // Emergency fund
  if (A.emergencyFund === 'none') {
    insights.push({ type:'negative', icon:'⚠️', text:`Without an emergency fund, a single job loss, car repair, or medical bill can force you into high-interest debt — the most common trigger of sustained downward mobility.` });
  } else if (A.emergencyFund === 'over6') {
    insights.push({ type:'positive', icon:'🛡️', text:`A 6+ month emergency fund puts you in the top ~20% of Americans by financial resilience. This cushion protects all the other gains you've built.` });
  }

  // Retirement
  if (A.retirement === 'notsaving') {
    insights.push({ type:'negative', icon:'📅', text:`Not saving for retirement means relying entirely on Social Security (~$1,800/month average). Starting at 35 vs. 25 requires saving nearly twice as much per month to reach the same outcome.` });
  } else if (A.retirement === 'ahead') {
    insights.push({ type:'positive', icon:'📅', text:`Being ahead on retirement savings puts you among the financially most-prepared Americans. Compound growth means early savings have disproportionate long-term impact.` });
  }

  // Health
  if (A.insurance === 'uninsured') {
    insights.push({ type:'negative', icon:'🏥', text:`Medical bankruptcy accounts for ~66% of all personal bankruptcies. Being uninsured is the single largest catastrophic financial risk an American can carry.` });
  }

  // Geography
  if (scores.geography >= 78) {
    insights.push({ type:'positive', icon:'📍', text:`${STATE_DATA[A.state]?.name || 'Your state'} is among the highest-opportunity states in Chetty's Opportunity Atlas. Children growing up here have significantly above-average chances of reaching the top income quintile.` });
  } else if (scores.geography <= 38) {
    insights.push({ type:'negative', icon:'📍', text:`${STATE_DATA[A.state]?.name || 'Your state'} is among the lowest-mobility states in the country. Geographic opportunity is a structural factor — research shows moving to a higher-opportunity area before age 13 meaningfully improves lifetime outcomes.` });
  }

  // Overall
  if (total >= 75) {
    insights.push({ type:'positive', icon:'🇺🇸', text:`Your overall score places you significantly above the estimated national median of ~51. You've built the kind of broad-based financial foundation the American Dream was designed to represent.` });
  } else if (total < 35) {
    insights.push({ type:'negative', icon:'🇺🇸', text:`Your score reflects the broader story of eroding mobility in America. Targeted improvements in your two lowest-scoring dimensions would have a disproportionate impact on your overall trajectory.` });
  }

  return insights.slice(0, 5);  // cap at 5
}

// ── National context stats ────────────────────────────
function getNationalStats(scores, total) {
  const stats = [];

  // Income comparison
  const incomePercentile = { under25: '12th', '25to40': '26th', '40to60': '43rd', '60to80': '54th', '80to100': '65th', '100to150': '77th', '150to250': '88th', over250: '96th' }[A.income] || '50th';
  stats.push({ num: incomePercentile, label: 'Income percentile vs. all U.S. households', sub: 'Median household income: $74,580' });

  // Homeownership
  if (A.housingStatus === 'ownoutright' || A.housingStatus === 'ownmortgage') {
    stats.push({ num: '65.6%', label: 'of Americans own their home', sub: 'You are a homeowner ✓' });
  } else {
    stats.push({ num: '34.4%', label: 'of Americans rent — you are among them', sub: 'First-time buyer rate near 50-yr low' });
  }

  // Emergency fund
  const efPct = { none: '56%', '1to3': '25%', '3to6': '12%', over6: '7%' }[A.emergencyFund] || '—';
  const efLabel = { none: 'of Americans also have less than 1 month saved', '1to3': 'of Americans have 1–3 months saved', '3to6': 'have exactly 3–6 months saved', over6: 'have 6+ months — you\'re in the top tier' }[A.emergencyFund] || '';
  stats.push({ num: efPct, label: efLabel, sub: 'Source: Bankrate Emergency Savings Report, 2024' });

  // Retirement
  const retPct = { ahead: '~15%', ontrack: '~28%', slightlybehind: '~22%', significantlybehind: '~20%', notsaving: '~25%' }[A.retirement] || '—';
  const retLabel = { ahead: 'of Americans are ahead on retirement savings — you\'re one', ontrack: 'are roughly on track', slightlybehind: 'are slightly behind', significantlybehind: 'are significantly behind', notsaving: 'have no retirement savings at all' }[A.retirement] || '';
  stats.push({ num: retPct, label: retLabel, sub: 'Source: Federal Reserve SCF, 2022' });

  return stats;
}

// ── Tips generator ────────────────────────────────────
function generateTips(scores) {
  const allTips = [
    {
      key: 'emergency', score: scores.financial,
      cond: () => A.emergencyFund === 'none' || A.emergencyFund === '1to3',
      title: 'Build a 3–6 month emergency fund',
      body: 'Open a high-yield savings account (currently 4–5% APY) and automate $50–200/month. This single change protects everything else you\'ve built. Even $1,000 in savings dramatically reduces the likelihood of taking on high-interest debt.',
      potential: '↑ Up to +12 points on Financial Security score',
    },
    {
      key: 'retirement', score: scores.financial,
      cond: () => ['significantlybehind','notsaving'].includes(A.retirement),
      title: 'Capture your employer\'s 401(k) match immediately',
      body: 'If your employer offers any 401(k) match and you\'re not contributing enough to capture it, you\'re leaving free money on the table. Even 1% contributions can trigger matching that equals a 50–100% instant return.',
      potential: '↑ Up to +16 points on Financial Security score',
    },
    {
      key: 'homebuying', score: scores.housing,
      cond: () => A.housingStatus === 'rent',
      title: 'Build toward homeownership strategically',
      body: 'The median homeowner has 40x the net worth of a renter. Investigate FHA loans (3.5% down), USDA loans (0% down in rural areas), and first-time buyer programs in your state. Even a modest home in a growing area is a wealth-building machine.',
      potential: '↑ Up to +35 points on Housing score',
    },
    {
      key: 'housing-cost', score: scores.housing,
      cond: () => ['35to45','over45'].includes(A.housingCostPct),
      title: 'Reduce housing cost burden',
      body: 'Spending 35%+ on housing leaves little room for savings or investment. Options: negotiate rent, take on a roommate, move to a lower-cost area, or refinance if you own. Research shows that even a 10% rent reduction frees capital that compounds meaningfully over time.',
      potential: '↑ Up to +22 points on Housing score',
    },
    {
      key: 'education', score: scores.education,
      cond: () => ['nodiploma','highschool','somecollege'].includes(A.education),
      title: 'Consider a certificate, associate\'s, or bachelor\'s degree',
      body: 'Community college is often under $4,000/year. In-demand fields like healthcare, tech, and skilled trades offer credentials that pay back quickly. A bachelor\'s adds $900,000+ in lifetime earnings. Research your specific field — ROI varies dramatically by major and institution.',
      potential: '↑ Up to +35 points on Education score',
    },
    {
      key: 'debt', score: scores.financial,
      cond: () => ['20to35','35to50','over50'].includes(A.debtRatio),
      title: 'Aggressively reduce high-interest consumer debt',
      body: 'Credit card debt at 20–25% APR is a mobility trap. The debt avalanche method (highest interest first) mathematically minimizes total interest paid. Consider balance transfer cards (0% intro APR) to accelerate payoff. Every dollar of consumer debt eliminated is a guaranteed high-return investment.',
      potential: '↑ Up to +18 points on Financial Security score',
    },
    {
      key: 'health', score: scores.health,
      cond: () => A.insurance === 'uninsured',
      title: 'Get health insurance coverage immediately',
      body: 'Healthcare.gov marketplace plans may cost less than you think — many qualify for subsidies under the ACA. Medicaid is free for low-income individuals. A single hospitalization without insurance averages $30,000. This is the highest-leverage risk mitigation available.',
      potential: '↑ Up to +60 points on Health score',
    },
    {
      key: 'geo', score: scores.geography,
      cond: () => scores.geography < 45,
      title: 'Consider geographic mobility as a long-term strategy',
      body: 'Chetty\'s research shows that children who move to higher-opportunity counties before age 13 earn 10%+ more as adults. For yourself, high-opportunity metros with growing industries (Minneapolis, Salt Lake City, Seattle, Austin, Raleigh) offer structurally better economic environments.',
      potential: '↑ Structural long-term impact on all dimensions',
    },
  ];

  return allTips.filter(t => t.cond()).slice(0, 4);
}

