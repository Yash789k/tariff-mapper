"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  Cpu,
  ListOrdered,
  PenLine,
  Search,
} from "lucide-react";
import type {
  MappingDirection,
  MappingResponse,
  MatchBasis,
  MatchType,
  SearchMode,
  TariffMatch,
} from "@/lib/types";

const CHIPS: Record<SearchMode, string[]> = {
  description: [
    "crude palm oil",
    "laptop computer",
    "EV battery cells",
    "woven cotton fabric",
    "smartphone",
  ],
  hs_code: ["151110", "847130", "854360", "870380", "520811"],
  local_code: ["1511100000", "8471301000", "8507600090", "5208110010"],
};

const INPUT_LABELS: Record<
  SearchMode,
  Record<MappingDirection, string>
> = {
  description: {
    china_to_indonesia: "Product Description",
    indonesia_to_china: "Product Description",
  },
  hs_code: {
    china_to_indonesia: "HS Code (6-digit)",
    indonesia_to_china: "HS Code (6-digit)",
  },
  local_code: {
    china_to_indonesia: "China CCC Code",
    indonesia_to_china: "Indonesia BTKI Code",
  },
};

const PLACEHOLDERS: Record<SearchMode, string[]> = {
  description: [
    "crude palm oil",
    "EV battery cells",
    "laptop computer",
    "woven cotton fabric",
  ],
  hs_code: ["151110", "847130", "854360", "870380"],
  local_code: ["1511100000", "8471301000", "8507600090"],
};

const DIR_UI = {
  china_to_indonesia: {
    btnCnId: true,
    btnIdCn: false,
    labels: {
      src: "🇨🇳 China",
      tgt: "🇮🇩 Indonesia",
      srcSch: "CCC 2024",
      tgtSch: "BTKI 2022",
    },
  },
  indonesia_to_china: {
    btnCnId: false,
    btnIdCn: true,
    labels: {
      src: "🇮🇩 Indonesia",
      tgt: "🇨🇳 China",
      srcSch: "BTKI 2022",
      tgtSch: "CCC 2024",
    },
  },
} as const;

const TYPE_META: Record<
  MatchType,
  { cls: string; cbCls: string; fillCls: string; label: string }
> = {
  exact: {
    cls: "ex",
    cbCls: "cb-ex",
    fillCls: "cb-fill-ex",
    label: "Exact Match",
  },
  likely: {
    cls: "lk",
    cbCls: "cb-lk",
    fillCls: "cb-fill-lk",
    label: "Likely Match",
  },
  partial: {
    cls: "pt",
    cbCls: "cb-pt",
    fillCls: "cb-fill-pt",
    label: "Partial Match",
  },
  manual_review: {
    cls: "mr",
    cbCls: "cb-mr",
    fillCls: "cb-fill-mr",
    label: "Manual Review",
  },
};

const BASIS_LABEL: Record<MatchBasis, string> = {
  hs_digits: "Shared HS digit prefix",
  semantic: "Semantic description similarity",
  tariff_structure: "Chapter / heading structure",
  ahtn_extension: "ASEAN AHTN extension logic",
};

const MARQUEE_ITEMS = [
  "WCO HS 2022",
  "China CCC 2024",
  "Indonesia BTKI 2022",
  "ASEAN AHTN 2022",
  "Bea Cukai Indonesia",
  "China Customs",
  "ACFTA Schedule",
  "RCEP Tariffs",
  "HS Nomenclature 2022",
  "China GB/T",
  "INSW Portal",
  "MFN Rates",
  "WTO ITA Agreement",
];

function rkClass(i: number): string {
  if (i === 0) return "rk-1";
  if (i === 1) return "rk-2";
  return "rk-3";
}

export default function TariffMapperApp() {
  const [direction, setDirection] =
    useState<MappingDirection>("china_to_indonesia");
  const [searchMode, setSearchMode] = useState<SearchMode>("description");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MappingResponse | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [navTab, setNavTab] = useState(0);

  const queryRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const segRef = useRef<HTMLDivElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const resultsPanelRef = useRef<HTMLDivElement>(null);

  const [navInd, setNavInd] = useState({ left: 0, width: 0 });
  const [segInd, setSegInd] = useState({ left: 0, width: 0 });

  const measureNav = useCallback(() => {
    const nav = navRef.current;
    const active = nav?.querySelector(".nav-tab.active") as HTMLElement | null;
    if (nav && active) {
      setNavInd({ left: active.offsetLeft, width: active.offsetWidth });
    }
  }, []);

  const measureSeg = useCallback(() => {
    const seg = segRef.current;
    const active = seg?.querySelector(".seg-btn.active") as HTMLElement | null;
    if (seg && active) {
      setSegInd({ left: active.offsetLeft, width: active.offsetWidth });
    }
  }, []);

  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      measureNav();
      measureSeg();
    });
  }, [measureNav, measureSeg, navTab, searchMode]);

  useEffect(() => {
    const onResize = () => {
      measureNav();
      measureSeg();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measureNav, measureSeg]);

  /* Cursor glow */
  useEffect(() => {
    const panels = [searchPanelRef.current, resultsPanelRef.current].filter(
      Boolean
    ) as HTMLDivElement[];
    const handlers: { el: HTMLDivElement; move: (e: MouseEvent) => void; leave: () => void }[] = [];
    panels.forEach((el) => {
      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      };
      const leave = () => {
        el.style.setProperty("--mx", "-100%");
        el.style.setProperty("--my", "-100%");
      };
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      handlers.push({ el, move, leave });
    });
    return () => {
      handlers.forEach(({ el, move, leave }) => {
        el.removeEventListener("mousemove", move);
        el.removeEventListener("mouseleave", leave);
      });
    };
  }, []);

  /* Stats counter (hero) */
  useEffect(() => {
    const els = document.querySelectorAll("[data-count-target]");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const target = parseInt(el.dataset.countTarget || "0", 10);
          const dur = 900;
          const start = performance.now();
          function step(now: number) {
            const t = Math.min((now - start) / dur, 1);
            const ease = 1 - Math.pow(1 - t, 3);
            el.textContent = String(Math.round(ease * target));
            if (t < 1) requestAnimationFrame(step);
            else el.textContent = String(target);
          }
          requestAnimationFrame(step);
          obs.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* GPT-4o label reveal */
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal-text]");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          const t = el.dataset.revealText;
          if (t) el.textContent = t;
          obs.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* Placeholder cycling */
  useEffect(() => {
    let idx = 0;
    const phs = PLACEHOLDERS[searchMode];
    const t = setInterval(() => {
      const inp = queryRef.current;
      if (!inp || document.activeElement === inp) return;
      idx = (idx + 1) % phs.length;
      inp.style.opacity = "0";
      setTimeout(() => {
        inp.placeholder = phs[idx];
        inp.style.opacity = "1";
      }, 280);
    }, 2800);
    return () => clearInterval(t);
  }, [searchMode]);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setExpanded({});

    try {
      const res = await fetch("/api/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          direction,
          searchMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setResult(data as MappingResponse);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [query, direction, searchMode]);

  /* Keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inp = queryRef.current;
      if (e.key === "/" && document.activeElement !== inp) {
        e.preventDefault();
        inp?.focus();
      }
      if (e.key === "Escape" && inp && document.activeElement === inp) {
        setQuery("");
        inp.blur();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inp?.focus();
      }
      if (e.key === "Enter" && document.activeElement === inp) {
        void runSearch();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [runSearch]);

  function toggleExpand(i: number) {
    setExpanded((p) => ({ ...p, [i]: !p[i] }));
  }

  const ui = DIR_UI[direction];
  const tally =
    result?.matches.reduce(
      (acc, m) => {
        acc[m.matchType] = (acc[m.matchType] || 0) + 1;
        return acc;
      },
      {} as Partial<Record<MatchType, number>>
    ) ?? {};
  const mrCount = tally.manual_review ?? 0;

  return (
    <>
      <header className="hdr">
        <div className="hdr-i">
          <a className="logo" href="/">
            <div className="logo-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </div>
            <div>
              <div className="logo-name">TariffMapper</div>
              <span className="logo-sub">China ↔ Indonesia</span>
            </div>
          </a>
          <nav className="nav" ref={navRef}>
            <div
              className="nav-ind"
              style={{ left: navInd.left, width: navInd.width }}
            />
            {["Overview", "China CCC", "Indonesia BTKI", "HS Reference"].map(
              (label, i) => (
                <button
                  key={label}
                  type="button"
                  className={`nav-tab ${navTab === i ? "active" : ""}`}
                  onClick={() => setNavTab(i)}
                >
                  {label}
                </button>
              )
            )}
          </nav>
          <div className="gpt-wrap">
            <div className="gpt-inner">
              <span className="gpt-dot" />
              GPT-4o
            </div>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-mesh" />
        <div className="hero-i">
          <div className="hero-eye">
            <span className="badge badge-ai">AI-Powered</span>
            <span className="badge badge-ver">Prototype v1.0</span>
          </div>
          <h1 className="hero-h1">Tariff Code Mapping</h1>
          <div className="hero-sub">
            <span className="cn">China</span>
            <span className="hero-arrow">
              <svg
                width="28"
                height="20"
                viewBox="0 0 28 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 10h24M18 4l6 6-6 6M10 4L4 10l6 6" />
              </svg>
            </span>
            <span className="id">Indonesia</span>
          </div>
          <p className="hero-desc">
            Map customs product classifications between China (CCC 2024) and
            Indonesia (BTKI/AHTN 2022). Search by product description, HS code,
            or national tariff code — receive top 5 matches ranked by AI
            confidence with traceable match logic.
          </p>
          <div className="stats">
            <div className="stat">
              <div className="stat-n" data-count-target="3">
                0
              </div>
              <div className="stat-l">Tariff Schedules</div>
            </div>
            <div className="stat">
              <div className="stat-n" data-count-target="4">
                0
              </div>
              <div className="stat-l">Match Types</div>
            </div>
            <div className="stat">
              <div className="stat-n" data-count-target="5">
                0
              </div>
              <div className="stat-l">Results per Query</div>
            </div>
            <div className="stat">
              <div
                className="stat-n"
                style={{ fontSize: 22 }}
                data-reveal-text="GPT-4o"
              >
                —
              </div>
              <div className="stat-l">AI Engine</div>
            </div>
          </div>
        </div>
      </section>

      <div className="mq">
        <div className="mq-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, i) => (
            <span key={`${t}-${i}`} className="mq-item">
              <span className="mq-dot" />
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="disc">
        <div className="disc-card">
          <AlertTriangle className="disc-ico" width={15} height={15} />
          <p className="disc-txt">
            <strong>Research and informational use only.</strong> This tool
            does not constitute a binding tariff ruling or legal customs advice.
            Always verify classifications with official customs authorities (China
            Customs, Direktorat Jenderal Bea dan Cukai Indonesia) before
            importation or exportation.
          </p>
        </div>
      </div>

      <div className="layout">
        <div className="panel sp p-z" ref={searchPanelRef}>
          <div className="sp-head p-z">
            <div className="sp-lbl">Classification Search</div>
            <div className="sp-title">Find Tariff Codes</div>
            <div className="sp-sub">
              Select direction, input type, and enter your query.
            </div>
          </div>
          <div className="divider" />
          <div className="sp-body p-z">
            <div className="sec">
              <div className="sec-lbl">Mapping Direction</div>
              <div className="dir-grid">
                <button
                  type="button"
                  className={`dir-btn cn-id ${ui.btnCnId ? "active" : ""}`}
                  onClick={() => {
                    setDirection("china_to_indonesia");
                    setResult(null);
                    setError(null);
                  }}
                >
                  <span className="dir-flag">🇨🇳</span>
                  <svg
                    className="dir-arr"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span className="dir-flag">🇮🇩</span>
                  <span style={{ fontSize: 10, marginLeft: 2, opacity: 0.7 }}>
                    Indonesia
                  </span>
                </button>
                <button
                  type="button"
                  className={`dir-btn id-cn ${ui.btnIdCn ? "active" : ""}`}
                  onClick={() => {
                    setDirection("indonesia_to_china");
                    setResult(null);
                    setError(null);
                  }}
                >
                  <span className="dir-flag">🇮🇩</span>
                  <svg
                    className="dir-arr"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span className="dir-flag">🇨🇳</span>
                  <span style={{ fontSize: 10, marginLeft: 2, opacity: 0.7 }}>
                    China
                  </span>
                </button>
              </div>
            </div>

            <div className="sec">
              <div className="sec-lbl">Input Type</div>
              <div className="seg" ref={segRef}>
                <div
                  className="seg-ind"
                  style={{ left: segInd.left, width: segInd.width }}
                />
                {(
                  [
                    ["description", "Description"],
                    ["hs_code", "HS Code"],
                    ["local_code", "Local Code"],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    className={`seg-btn ${searchMode === mode ? "active" : ""}`}
                    onClick={() => {
                      setSearchMode(mode);
                      setQuery("");
                      setResult(null);
                      setError(null);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sec">
              <div className="sec-lbl">
                {INPUT_LABELS[searchMode][direction]}
              </div>
              <div className="inp-wrap">
                <input
                  ref={queryRef}
                  className="inp"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={PLACEHOLDERS[searchMode][0]}
                />
                <Search className="inp-ico" width={16} height={16} />
                <span className="inp-shortcut">⌘K</span>
              </div>
              <div className="chips">
                {CHIPS[searchMode].map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    className="chip"
                    style={{ animationDelay: `${i * 50}ms` }}
                    onClick={() => setQuery(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="sec" style={{ marginBottom: 0 }}>
              <button
                type="button"
                className={`srch-btn ${loading ? "loading" : ""}`}
                disabled={loading || !query.trim()}
                onClick={() => void runSearch()}
              >
                <Search className="btn-ico" width={16} height={16} />
                <span className="btn-lbl">Find Tariff Matches</span>
                <div className="srch-spin" />
              </button>
            </div>

            <div className="sources">
              <div className="sources-ttl">Reference Sources</div>
              <div className="src-item">
                <span className="src-dot" />
                WCO HS 2022 Nomenclature
              </div>
              <div className="src-item">
                <span className="src-dot" />
                China CCC Tariff Schedule 2024
              </div>
              <div className="src-item">
                <span className="src-dot" />
                Indonesia BTKI 2022 (AHTN-based)
              </div>
              <div className="src-item">
                <span className="src-dot" />
                ASEAN AHTN 2022
              </div>
              <div className="src-item">
                <span className="src-dot" />
                ACFTA / RCEP Preferential Schedules
              </div>
            </div>
          </div>
        </div>

        <div className="panel rp p-z" ref={resultsPanelRef}>
          <ResultsPanel
            loading={loading}
            error={error}
            result={result}
            dirLabels={ui.labels}
            expanded={expanded}
            onToggleExpand={toggleExpand}
            tally={tally}
            mrCount={mrCount}
          />
        </div>
      </div>

      <section className="hiw">
        <div className="sec-eye">How it works</div>
        <div className="sec-h">Three steps to a tariff match</div>
        <div className="sec-sub">
          From raw query to classified, cited, confidence-ranked output.
        </div>
        <div className="hiw-grid">
          <div className="hiw-card">
            <div className="hiw-n">01</div>
            <div className="hiw-ico">
              <PenLine width={18} height={18} />
            </div>
            <div className="hiw-t">Enter Your Query</div>
            <div className="hiw-d">
              Input a product description, 6-digit international HS code, or
              full national tariff code (China CCC or Indonesia BTKI).
            </div>
          </div>
          <div className="hiw-card">
            <div className="hiw-n">02</div>
            <div className="hiw-ico">
              <Brain width={18} height={18} />
            </div>
            <div className="hiw-t">AI Anchors to HS</div>
            <div className="hiw-d">
              GPT-4o resolves the input to a 6-digit international HS anchor,
              handling ambiguous, incomplete, and multi-chapter descriptions.
            </div>
          </div>
          <div className="hiw-card">
            <div className="hiw-n">03</div>
            <div className="hiw-ico">
              <BarChart3 width={18} height={18} />
            </div>
            <div className="hiw-t">Top 5 Returned</div>
            <div className="hiw-d">
              Target-country national codes ranked by confidence %, with tariff
              rates, traceable match logic, divergence notes, and source
              citations.
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="foot-i">
          <div className="foot-l">
            <span className="foot-brand">TariffMapper</span>
            <span className="foot-m">
              Tsunami Advisors · HS 2022 · CCC 2024 · BTKI 2022 · AHTN 2022
            </span>
          </div>
          <span className="foot-m">
            Research use only · Not legal customs advice
          </span>
        </div>
      </footer>
    </>
  );
}

function ResultsPanel({
  loading,
  error,
  result,
  dirLabels,
  expanded,
  onToggleExpand,
  tally,
  mrCount,
}: {
  loading: boolean;
  error: string | null;
  result: MappingResponse | null;
  dirLabels: {
    src: string;
    tgt: string;
    srcSch: string;
    tgtSch: string;
  };
  expanded: Record<number, boolean>;
  onToggleExpand: (i: number) => void;
  tally: Partial<Record<MatchType, number>>;
  mrCount: number;
}) {
  if (loading) {
    return (
      <div className="p-z" style={{ padding: 16 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="sk-card">
            <div className="sk-row">
              <div
                className="sk"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  className="sk"
                  style={{ width: 160, height: 18, marginBottom: 8 }}
                />
                <div
                  className="sk"
                  style={{ width: 240, height: 13, marginBottom: 6 }}
                />
                <div className="sk" style={{ width: 200, height: 13 }} />
              </div>
              <div>
                <div
                  className="sk"
                  style={{
                    width: 90,
                    height: 22,
                    borderRadius: 20,
                    marginBottom: 8,
                  }}
                />
                <div
                  className="sk"
                  style={{ width: 90, height: 8, borderRadius: 4 }}
                />
              </div>
            </div>
          </div>
        ))}
        <div
          style={{
            textAlign: "center",
            padding: "8px 0",
            fontSize: 12,
            color: "var(--faint)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              border: "2px solid rgba(255,255,255,.1)",
              borderTopColor: "var(--accent)",
              borderRadius: "50%",
              animation: "spin .7s linear infinite",
            }}
          />
          Querying GPT-4o mapping engine… typically 5–15 seconds
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-z" style={{ padding: 16 }}>
        <div className="err-card">
          <div className="err-ico">
            <AlertTriangle width={18} height={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#fecaca", marginBottom: 4 }}>
              Error
            </div>
            <div style={{ fontSize: 13, color: "#fca5a5" }}>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="empty p-z">
        <div className="empty-ico">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <div className="empty-title">Ready to map your first code</div>
        <div className="empty-desc">
          Enter a product description or tariff code on the left — results come
          from OpenAI GPT-4o via your configured API key.
        </div>
        <div className="steps3">
          <div className="step3">
            <div className="s3-n">01</div>
            <div className="s3-ico">
              <PenLine width={14} height={14} />
            </div>
            <div className="s3-t">Enter Your Query</div>
            <div className="s3-d">
              Product description, 6-digit HS code, or national code (CCC or
              BTKI).
            </div>
          </div>
          <div className="step3">
            <div className="s3-n">02</div>
            <div className="s3-ico">
              <Cpu width={14} height={14} />
            </div>
            <div className="s3-t">AI Anchors to HS</div>
            <div className="s3-d">
              GPT-4o resolves the input to a 6-digit international HS anchor.
            </div>
          </div>
          <div className="step3">
            <div className="s3-n">03</div>
            <div className="s3-ico">
              <ListOrdered width={14} height={14} />
            </div>
            <div className="s3-t">Top 5 Returned</div>
            <div className="s3-d">
              Ranked codes with confidence %, tariff rates, match logic, and
              citations.
            </div>
          </div>
        </div>
        <div className="tiers">
          <div className="tier ex">
            <div className="tier-n">Exact</div>
            <div className="tier-r">85–100%</div>
            <div className="tier-d">Direct HS + national code match</div>
          </div>
          <div className="tier lk">
            <div className="tier-n">Likely</div>
            <div className="tier-r">65–84%</div>
            <div className="tier-d">HS match, minor sub-heading ambiguity</div>
          </div>
          <div className="tier pt">
            <div className="tier-n">Partial</div>
            <div className="tier-r">40–64%</div>
            <div className="tier-d">Adjacent HS or chapter-level only</div>
          </div>
          <div className="tier mr">
            <div className="tier-n">Review</div>
            <div className="tier-r">0–39%</div>
            <div className="tier-d">Ambiguous — consult specialist</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-z" style={{ padding: 16 }}>
      <div className="ctx">
        <div className="ctx-band">
          <div className="ctx-dir">
            <span>{dirLabels.src}</span>
            <span className="ctx-sch">{dirLabels.srcSch}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--faint)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <span className="ctx-sch">{dirLabels.tgtSch}</span>
            <span>{dirLabels.tgt}</span>
          </div>
          {result.cached ? (
            <span className="cached-tag">⚡ cached</span>
          ) : null}
        </div>
        <div className="ctx-body">
          <div>
            <div className="ctx-qlbl">Query</div>
            <div className="ctx-q">&ldquo;{result.query}&rdquo;</div>
          </div>
          <div className="hs-box">
            <div className="hs-lbl">HS Anchor</div>
            <div className="hs-code">{result.hsAnchor}</div>
            <div className="hs-desc">{result.hsAnchorDescription}</div>
          </div>
        </div>
        {result.processingNote ? (
          <div className="ctx-note">
            <strong>AI Note: </strong>
            {result.processingNote}
          </div>
        ) : null}
        <div className="ctx-tally">
          <span className="tl">Results:</span>
          {tally.exact ? (
            <span className="tb tb-ex">{tally.exact} Exact</span>
          ) : null}
          {tally.likely ? (
            <span className="tb tb-lk">{tally.likely} Likely</span>
          ) : null}
          {tally.partial ? (
            <span className="tb tb-pt">{tally.partial} Partial</span>
          ) : null}
          {tally.manual_review ? (
            <span className="tb tb-mr">{tally.manual_review} Review</span>
          ) : null}
          {mrCount > 0 ? (
            <span className="tb-warn" style={{ marginLeft: "auto" }}>
              ⚠ {mrCount} require{mrCount === 1 ? "s" : ""} manual review
            </span>
          ) : null}
        </div>
      </div>

      {result.matches.map((m, i) => (
        <ResultCardRow
          key={`${m.code}-${i}`}
          m={m}
          index={i}
          expanded={!!expanded[i]}
          onToggle={() => onToggleExpand(i)}
        />
      ))}
    </div>
  );
}

function ResultCardRow({
  m,
  index,
  expanded,
  onToggle,
}: {
  m: TariffMatch;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const t = TYPE_META[m.matchType] ?? TYPE_META.likely;
  const basis =
    BASIS_LABEL[m.matchBasis] ?? String(m.matchBasis);

  return (
    <div className={`rc ${t.cls}`}>
      <div className="rc-main">
        <div className={`rc-rank ${rkClass(index)}`}>{index + 1}</div>
        <div className="rc-body">
          <div className="rc-row">
            <span className="rc-code">{m.code}</span>
            {index === 0 ? (
              <span className="crown">⭐ Best Match</span>
            ) : null}
            {m.tariffRate && m.tariffRate !== "N/A" ? (
              <span className="rate-tag">{m.tariffRate}</span>
            ) : null}
          </div>
          <div className="rc-desc">{m.description}</div>
          <div className="rc-expl">{m.explanation}</div>
          <div className="rc-meta">
            <span className="mtag">📐 {basis}</span>
            <span className="mtag">📚 {m.sourceReference}</span>
          </div>
        </div>
        <div className="rc-conf">
          <div className={`${t.cbCls} cb`}>{t.label}</div>
          <div className="cb-bar">
            <div className="cb-track">
              <div
                className={`${t.fillCls} cb-fill`}
                style={{ width: `${m.confidence}%` }}
              />
            </div>
            <span className="cb-pct">{m.confidence}%</span>
          </div>
        </div>
      </div>
      <button type="button" className="rc-expand" onClick={onToggle}>
        <span>
          {expanded
            ? "Hide details"
            : "Show tariff & divergence details"}
        </span>
        <svg
          className={`chev ${expanded ? "open" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div className={`rc-details ${expanded ? "open" : ""}`}>
        {m.tariffNote && m.tariffNote !== "N/A" ? (
          <div className="db">
            <div className="db-lbl">💰 Tariff Notes</div>
            <div className="db-val">{m.tariffNote}</div>
          </div>
        ) : null}
        {m.divergenceNote && m.divergenceNote !== "N/A" ? (
          <div className="db">
            <div className="db-lbl">⚠ Divergence Note</div>
            <div className="db-val warn">{m.divergenceNote}</div>
          </div>
        ) : null}
        <div className="db full">
          <div className="db-lbl">📝 Full Explanation</div>
          <div className="db-val">{m.explanation}</div>
        </div>
      </div>
    </div>
  );
}
