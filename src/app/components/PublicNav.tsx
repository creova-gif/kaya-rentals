import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router";
import {
  Building2, Menu, X, LayoutDashboard, ChevronRight,
  LogOut, Home, Settings, ChevronDown, Sparkles,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

const G = "#0A7A52";
const GL = "#E5F4EE";
const TX = "#0E0F0C";
const MU = "#6B6A66";
const SANS = "'DM Sans', system-ui, sans-serif";
const SERIF = "'Instrument Serif', serif";

const NAV_LINKS = [
  { label: "Find a Home", to: "/search" },
  { label: "For Landlords", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Community", to: "/community" },
];

const MORE_LINKS = [
  { label: "Neighbourhoods", to: "/neighbourhood-insights" },
  { label: "About Kaya", to: "/about" },
  { label: "Help & FAQ", to: "/faq" },
  { label: "Contact us", to: "/contact" },
];

export function PublicNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive = (to: string) => location.pathname === to;

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  return (
    <>
      <style>{`
        @keyframes navDropIn { from { opacity:0; transform:translateY(-8px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes navFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes pillGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(10,122,82,0); } 50% { box-shadow: 0 0 20px 4px rgba(10,122,82,0.08); } }
        .kaya-nav-pill { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
        .kaya-nav-link { transition: color 0.15s, background 0.15s; }
        .kaya-nav-link:hover { color: ${TX} !important; background: rgba(0,0,0,0.05) !important; }
        .kaya-nav-link.active { color: ${TX} !important; font-weight: 600 !important; }
        .kaya-gs-btn { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
        .kaya-gs-btn:hover { transform: translateY(-1px) scale(1.02); box-shadow: 0 6px 20px rgba(10,122,82,0.32) !important; }
        .kaya-signin-btn { transition: all 0.15s; }
        .kaya-signin-btn:hover { background: rgba(0,0,0,0.05) !important; }
        @media (max-width: 880px) {
          .nav-desktop-links, .nav-lang-desktop, .nav-auth-btns { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .kaya-nav-pill { padding: 0 16px !important; }
        }
        @media (max-width: 1080px) {
          .nav-desktop-links a, .nav-desktop-links button { padding: 6px 9px !important; font-size: 12.5px !important; }
        }
      `}</style>

      {/* ── Floating pill container ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
        display: "flex", justifyContent: "center",
        padding: scrolled ? "10px 24px" : "14px 24px",
        pointerEvents: "none",
        transition: "padding 0.35s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <nav className="kaya-nav-pill" style={{
          width: "100%",
          maxWidth: scrolled ? 920 : 980,
          height: scrolled ? 52 : 58,
          padding: "0 10px 0 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderRadius: 100,
          background: scrolled
            ? "rgba(255,255,255,0.97)"
            : "rgba(250,249,246,0.82)",
          backdropFilter: "blur(28px) saturate(200%)",
          WebkitBackdropFilter: "blur(28px) saturate(200%)",
          border: scrolled
            ? "1px solid rgba(0,0,0,0.10)"
            : "1px solid rgba(0,0,0,0.07)",
          boxShadow: scrolled
            ? "0 4px 32px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)"
            : "0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
          pointerEvents: "auto",
        }}>

          {/* ── Logo ── */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: `linear-gradient(140deg, ${G} 0%, #054D32 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 10px rgba(10,122,82,0.28), inset 0 1px 0 rgba(255,255,255,0.18)",
              flexShrink: 0,
            }}>
              <Building2 size={15} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: SERIF, fontSize: 21, color: TX, letterSpacing: "-0.5px", lineHeight: 1 }}>
              Kaya<span style={{ color: G }}>.</span>
            </span>
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="nav-desktop-links" style={{ display: "flex", alignItems: "center", gap: 1 }}>
            {NAV_LINKS.map(({ label, to }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to} to={to}
                  className={`kaya-nav-link${active ? " active" : ""}`}
                  style={{
                    fontSize: 13, fontWeight: active ? 600 : 450,
                    color: active ? TX : MU,
                    textDecoration: "none",
                    padding: "6px 12px",
                    borderRadius: 100,
                    background: active ? "rgba(10,122,82,0.07)" : "transparent",
                    fontFamily: SANS,
                    position: "relative",
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  {active && (
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: G, display: "inline-block", flexShrink: 0 }} />
                  )}
                  {label}
                </Link>
              );
            })}

            {/* More dropdown */}
            <div ref={moreRef} style={{ position: "relative" }}>
              <button
                onClick={() => setMoreOpen(v => !v)}
                className="kaya-nav-link"
                style={{
                  fontSize: 13, fontWeight: 450, color: moreOpen ? TX : MU,
                  background: moreOpen ? "rgba(0,0,0,0.05)" : "transparent",
                  border: "none", cursor: "pointer",
                  padding: "6px 12px", borderRadius: 100,
                  display: "flex", alignItems: "center", gap: 4,
                  fontFamily: SANS,
                }}
              >
                More
                <ChevronDown size={12} style={{ transition: "transform 0.22s", transform: moreOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
              </button>

              {moreOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 12px)", left: "50%", transform: "translateX(-50%)",
                  background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 18,
                  padding: 6, minWidth: 196,
                  boxShadow: "0 12px 48px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                  zIndex: 1000, animation: "navDropIn 0.18s ease",
                }}>
                  {MORE_LINKS.map(({ label, to }) => (
                    <Link key={to} to={to} onClick={() => setMoreOpen(false)} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "9px 14px", borderRadius: 12,
                      fontSize: 13, color: TX, fontWeight: 500,
                      textDecoration: "none", transition: "background 0.12s", fontFamily: SANS,
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F5F4F1"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {label}
                      <ChevronRight size={13} color="#C0BDB7" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right side ── */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div className="nav-lang-desktop">
              <LanguageSwitcher />
            </div>

            {!loading && (
              user ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button onClick={() => navigate("/app")} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 14px",
                    background: GL, color: G,
                    border: `1px solid rgba(10,122,82,0.2)`,
                    borderRadius: 100,
                    fontSize: 12.5, fontWeight: 600,
                    cursor: "pointer", fontFamily: SANS, transition: "all 0.18s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#c8e6d8"; e.currentTarget.style.borderColor = "rgba(10,122,82,0.38)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = GL; e.currentTarget.style.borderColor = "rgba(10,122,82,0.2)"; }}
                  >
                    <LayoutDashboard size={13} />
                    Dashboard
                  </button>

                  <div ref={userMenuRef} style={{ position: "relative" }}>
                    <button onClick={() => setUserMenuOpen(!userMenuOpen)} style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: userMenuOpen ? G : "rgba(10,122,82,0.1)",
                      border: `2px solid ${userMenuOpen ? G : "rgba(10,122,82,0.2)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", fontSize: 11, fontWeight: 700,
                      color: userMenuOpen ? "#fff" : G,
                      fontFamily: SANS, transition: "all 0.2s",
                    }}>
                      {initials}
                    </button>

                    {userMenuOpen && (
                      <div style={{
                        position: "absolute", top: "calc(100% + 12px)", right: 0,
                        background: "#fff", border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: 18, padding: 8, minWidth: 218,
                        boxShadow: "0 12px 48px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.06)",
                        zIndex: 1000, animation: "navDropIn 0.18s ease",
                      }}>
                        <div style={{ padding: "10px 14px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)", marginBottom: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: TX }}>{user.name || "Landlord"}</div>
                          <div style={{ fontSize: 11, color: MU, marginTop: 2 }}>{user.email}</div>
                          <div style={{
                            display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8,
                            fontSize: 9, fontWeight: 700, color: G, background: GL,
                            padding: "3px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.5px",
                          }}>
                            <Sparkles size={8} /> PRO
                          </div>
                        </div>
                        {[
                          { label: "Dashboard", Icon: LayoutDashboard, path: "/app" },
                          { label: "Properties", Icon: Home, path: "/app/properties" },
                          { label: "Settings", Icon: Settings, path: "/app/settings" },
                        ].map(({ label, Icon, path }) => (
                          <button key={path} onClick={() => { navigate(path); setUserMenuOpen(false); }} style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 10,
                            padding: "9px 14px", background: "transparent",
                            border: "none", borderRadius: 12,
                            fontSize: 13, color: TX, fontWeight: 500,
                            cursor: "pointer", fontFamily: SANS, textAlign: "left", transition: "background 0.12s",
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = "#F5F4F1"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <Icon size={14} color={MU} /> {label}
                          </button>
                        ))}
                        <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", marginTop: 6, paddingTop: 6 }}>
                          <button onClick={async () => { await signOut(); setUserMenuOpen(false); navigate("/"); }} style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 10,
                            padding: "9px 14px", background: "transparent",
                            border: "none", borderRadius: 12,
                            fontSize: 13, color: "#C0392B", fontWeight: 500,
                            cursor: "pointer", fontFamily: SANS, textAlign: "left", transition: "background 0.12s",
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = "#FEF0EE"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <LogOut size={14} /> Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 5, alignItems: "center" }} className="nav-auth-btns">
                  <button onClick={() => navigate("/login")} className="kaya-signin-btn" style={{
                    padding: "7px 16px",
                    border: "none", borderRadius: 100,
                    background: "transparent",
                    fontSize: 13, fontWeight: 500, color: MU,
                    cursor: "pointer", fontFamily: SANS, whiteSpace: "nowrap",
                  }}>
                    Sign in
                  </button>
                  <button onClick={() => navigate("/signup")} className="kaya-gs-btn" style={{
                    padding: "8px 20px",
                    border: "none", borderRadius: 100,
                    background: `linear-gradient(135deg, ${G} 0%, #065E3C 100%)`,
                    fontSize: 13, fontWeight: 600, color: "#fff",
                    cursor: "pointer", fontFamily: SANS,
                    boxShadow: "0 3px 12px rgba(10,122,82,0.28)",
                    whiteSpace: "nowrap",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    Get started
                    <span style={{
                      width: 18, height: 18, borderRadius: "50%",
                      background: "rgba(255,255,255,0.22)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <ChevronRight size={11} color="#fff" strokeWidth={2.5} />
                    </span>
                  </button>
                </div>
              )
            )}

            <button className="nav-hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu" style={{
              display: "none", padding: "7px 9px",
              background: "rgba(0,0,0,0.05)", border: "none", borderRadius: 100,
              cursor: "pointer", alignItems: "center", justifyContent: "center", color: TX, transition: "all 0.15s",
            }}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>
      </div>

      {/* ── Spacer so page content starts below nav ── */}
      <div style={{ height: scrolled ? 72 : 86, transition: "height 0.35s cubic-bezier(0.4,0,0.2,1)" }} aria-hidden />

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: "fixed", inset: 0, zIndex: 997,
          background: "rgba(0,0,0,0.32)", backdropFilter: "blur(6px)",
          animation: "navFadeIn 0.2s ease",
        }} />
      )}

      {/* ── Mobile drawer ── */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 310, zIndex: 998,
        background: "#fff",
        boxShadow: "-12px 0 60px rgba(0,0,0,0.14)",
        display: "flex", flexDirection: "column",
        transform: mobileOpen ? "translateX(0)" : "translateX(110%)",
        transition: "transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
        overflowY: "auto",
        borderRadius: "20px 0 0 20px",
      }}>
        <div style={{
          padding: "18px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: `linear-gradient(140deg, ${G} 0%, #054D32 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Building2 size={14} color="#fff" strokeWidth={2.4} />
            </div>
            <span style={{ fontFamily: SERIF, fontSize: 20, color: TX }}>
              Kaya<span style={{ color: G }}>.</span>
            </span>
          </div>
          <button onClick={() => setMobileOpen(false)} style={{
            padding: 8, background: "#F5F4F1", border: "none", borderRadius: "50%",
            cursor: "pointer", color: MU, display: "flex",
          }}>
            <X size={16} />
          </button>
        </div>

        {user && (
          <div style={{ margin: "12px 16px", padding: "14px 16px", background: GL, borderRadius: 16, border: `1px solid rgba(10,122,82,0.14)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: `linear-gradient(135deg, ${G}, #054D32)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: "#fff",
              }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: TX }}>{user.name || "Landlord"}</div>
                <div style={{ fontSize: 11, color: MU }}>{user.email}</div>
              </div>
            </div>
            <button onClick={() => navigate("/app")} style={{
              marginTop: 12, width: "100%", padding: "10px 0",
              background: G, color: "#fff", border: "none", borderRadius: 12,
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SANS,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}>
              <LayoutDashboard size={14} /> Go to Dashboard
            </button>
          </div>
        )}

        <div style={{ flex: 1, padding: "8px 12px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#C0BDB7", textTransform: "uppercase", letterSpacing: "0.9px", padding: "10px 10px 6px" }}>
            Menu
          </div>
          {[...NAV_LINKS, ...MORE_LINKS].map(({ label, to }) => (
            <Link key={to} to={to} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "11px 12px", borderRadius: 12,
              fontSize: 13.5, fontWeight: 500,
              color: isActive(to) ? G : TX,
              background: isActive(to) ? GL : "transparent",
              textDecoration: "none", marginBottom: 2, transition: "all 0.15s",
            }}
              onMouseEnter={e => { if (!isActive(to)) e.currentTarget.style.background = "#F5F4F1"; }}
              onMouseLeave={e => { if (!isActive(to)) e.currentTarget.style.background = "transparent"; }}
            >
              {label}
              <ChevronRight size={14} color="#C0BDB7" />
            </Link>
          ))}
        </div>

        <div style={{ padding: "16px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ marginBottom: 10 }}>
            <LanguageSwitcher />
          </div>
          {user ? (
            <button onClick={async () => { await signOut(); setMobileOpen(false); navigate("/"); }} style={{
              width: "100%", padding: "11px 0", background: "#FEF0EE", color: "#C0392B",
              border: "none", borderRadius: 12, fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: SANS,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}>
              <LogOut size={14} /> Sign out
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => { navigate("/login"); setMobileOpen(false); }} style={{
                width: "100%", padding: "12px 0", background: "#F5F4F1", color: TX,
                border: "none", borderRadius: 12,
                fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: SANS,
              }}>
                Sign in
              </button>
              <button onClick={() => { navigate("/signup"); setMobileOpen(false); }} style={{
                width: "100%", padding: "12px 0",
                background: `linear-gradient(135deg, ${G} 0%, #065E3C 100%)`,
                color: "#fff",
                border: "none", borderRadius: 12, fontSize: 13.5, fontWeight: 600,
                cursor: "pointer", fontFamily: SANS,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                Get started <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
