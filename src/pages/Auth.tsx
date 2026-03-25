import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Eye, EyeOff, Loader2, Zap, Shield, Globe, Sparkles } from "lucide-react";

type Mode = "login" | "register";

const features = [
  { icon: <Zap size={16} />, text: "Генерация полных приложений за секунды" },
  { icon: <Shield size={16} />, text: "Встроенная аутентификация и безопасность" },
  { icon: <Globe size={16} />, text: "Deploy на ваш домен в один клик" },
  { icon: <Sparkles size={16} />, text: "AI-ассистент для любой задачи" },
];

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from ?? "/editor";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: name } },
        });
        if (error) throw error;
        setSuccess("Письмо с подтверждением отправлено на вашу почту. Проверьте входящие.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const msg: Record<string, string> = {
        "Invalid login credentials": "Неверный email или пароль.",
        "Email not confirmed": "Подтвердите email перед входом.",
        "User already registered": "Пользователь с таким email уже существует.",
        "Password should be at least 6 characters": "Пароль должен содержать минимум 6 символов.",
      };
      setError(msg[err.message] ?? err.message ?? "Произошла ошибка. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      fontFamily: "'Inter', -apple-system, sans-serif",
      background: "#07070e",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes floatA {
          0%,100% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(-20px); }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
        }
        .auth-input::placeholder { color: #2e2e48; }
        .auth-input:focus { outline: none; border-color: rgba(139,92,246,.6) !important; box-shadow: 0 0 0 3px rgba(139,92,246,.14) !important; background: rgba(139,92,246,.05) !important; }
        .auth-tab:hover { color: #e8e8f8; }
        .auth-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 40px rgba(139,92,246,.6) !important; }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div style={{
        width: "48%", background: "linear-gradient(160deg,#0d0d1e 0%,#0a0a18 100%)",
        borderRight: "1px solid rgba(255,255,255,.06)",
        padding: "64px 56px", display: "flex", flexDirection: "column", justifyContent: "space-between",
        position: "relative", overflow: "hidden",
      }} className="auth-left-panel">
        {/* decorative orbs */}
        <div style={{
          position: "absolute", top: -160, left: "50%",
          width: 600, height: 600, borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(ellipse, rgba(139,92,246,.22) 0%, transparent 65%)",
          filter: "blur(2px)", animation: "floatA 9s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: -120, right: -80,
          width: 400, height: 400, borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(ellipse, rgba(6,182,212,.12) 0%, transparent 65%)",
          filter: "blur(4px)", animation: "floatB 11s ease-in-out infinite reverse",
        }} />
        {/* grid lines */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(139,92,246,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.055) 1px,transparent 1px)",
          backgroundSize: "52px 52px",
          maskImage: "radial-gradient(ellipse 90% 80% at 50% 20%,black 30%,transparent 90%)",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* logo */}
          <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 64 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden", background: "transparent", display: "grid", placeItems: "center" }}>
              <img src="/helphand-logo.jpeg" alt="" style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "screen" }} />
            </div>
            <span style={{
              fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.035em",
              background: "linear-gradient(135deg,#fff 40%,#b39ddb)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>HelpHand</span>
          </a>

          <h2 style={{
            fontSize: "clamp(1.8rem,3vw,2.6rem)", fontWeight: 900, letterSpacing: "-0.05em",
            lineHeight: 1.05, marginBottom: 16, color: "#fff",
          }}>
            Создавайте{" "}
            <span style={{
              background: "linear-gradient(135deg,#a78bfa,#06b6d4)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>быстрее</span>
            {" "}чем когда-либо
          </h2>
          <p style={{ fontSize: "1rem", color: "#6b6b8a", lineHeight: 1.75, maxWidth: 380, marginBottom: 48 }}>
            От идеи до полноценного приложения — за минуты, а не месяцы. Без написания кода вручную.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {features.map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 18px", borderRadius: 14,
                background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)",
                backdropFilter: "blur(8px)",
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center",
                  background: "linear-gradient(135deg,rgba(139,92,246,.3),rgba(99,102,241,.2))",
                  border: "1px solid rgba(139,92,246,.3)", color: "#c4b5fd", flexShrink: 0,
                }}>
                  {f.icon}
                </div>
                <span style={{ fontSize: ".88rem", color: "#9090b0" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 48 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: "50%", border: "2px solid #07070e",
                background: `linear-gradient(135deg,${["#8b5cf6","#6366f1","#06b6d4"][i]},${["#6366f1","#8b5cf6","#0891b2"][i]})`,
                marginLeft: i > 0 ? -12 : 0,
              }} />
            ))}
            <span style={{ fontSize: ".82rem", color: "#4a4a6a", marginLeft: 8 }}>
              Присоединились тысячи разработчиков
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "64px clamp(24px,5vw,64px)",
        position: "relative",
        background: "#07070e",
      }}>
        {/* subtle radial bg */}
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: 600, height: 600, borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(ellipse,rgba(139,92,246,.06) 0%,transparent 65%)",
        }} />

        <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
          {/* heading */}
          <h1 style={{
            fontSize: "1.9rem", fontWeight: 900, letterSpacing: "-0.045em",
            color: "#fff", marginBottom: 8,
          }}>
            {mode === "login" ? "Добро пожаловать" : "Создать аккаунт"}
          </h1>
          <p style={{ fontSize: ".88rem", color: "#6b6b8a", marginBottom: 32 }}>
            {mode === "login"
              ? "Войдите, чтобы продолжить создание сайтов."
              : "Зарегистрируйтесь и начните создавать бесплатно."}
          </p>

          {/* tab switcher */}
          <div style={{
            display: "flex", background: "rgba(255,255,255,.03)",
            border: "1px solid rgba(255,255,255,.07)", borderRadius: 14,
            padding: 4, marginBottom: 32, gap: 4,
          }}>
            {(["login", "register"] as Mode[]).map((m) => (
              <button key={m} type="button" className="auth-tab"
                onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 11, border: 0,
                  fontSize: ".87rem", fontWeight: 600, cursor: "pointer",
                  transition: "all .2s",
                  background: mode === m ? "linear-gradient(135deg,#8b5cf6,#6366f1)" : "transparent",
                  color: mode === m ? "#fff" : "#4a4a6a",
                  boxShadow: mode === m ? "0 0 20px rgba(139,92,246,.35)" : "none",
                }}>
                {m === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>

          {/* form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {mode === "register" && (
              <div>
                <label style={labelSt}>Имя</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ваше имя" required={mode === "register"}
                  className="auth-input" style={inputSt}
                />
              </div>
            )}

            <div>
              <label style={labelSt}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="auth-input" style={inputSt}
              />
            </div>

            <div>
              <label style={labelSt}>Пароль</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Минимум 6 символов" : "Ваш пароль"}
                  required minLength={6}
                  className="auth-input" style={{ ...inputSt, paddingRight: 48 }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: 0, cursor: "pointer", color: "#4a4a6a",
                  display: "flex", alignItems: "center", padding: 4, transition: "color .2s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#9090b0")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#4a4a6a")}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: "13px 16px", borderRadius: 12,
                background: "rgba(239,68,68,.09)", border: "1px solid rgba(239,68,68,.22)",
                color: "#fca5a5", fontSize: ".83rem", lineHeight: 1.5,
              }}>{error}</div>
            )}
            {success && (
              <div style={{
                padding: "13px 16px", borderRadius: 12,
                background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.22)",
                color: "#86efac", fontSize: ".83rem", lineHeight: 1.5,
              }}>{success}</div>
            )}

            <button type="submit" disabled={loading} className="auth-submit" style={{
              marginTop: 4, padding: "14px 0", borderRadius: 13, border: 0,
              background: "linear-gradient(135deg,#8b5cf6,#6366f1)",
              color: "#fff", fontSize: ".97rem", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 0 28px rgba(139,92,246,.4)",
              opacity: loading ? .72 : 1, transition: "all .2s",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(135deg,rgba(255,255,255,.14),transparent 55%)",
                pointerEvents: "none",
              }} />
              {loading
                ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                : mode === "login"
                  ? <><span>Войти</span><ArrowRight size={16} /></>
                  : <><span>Создать аккаунт</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p style={{ marginTop: 28, textAlign: "center", fontSize: ".82rem", color: "#3a3a56" }}>
            {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
            <button type="button"
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setSuccess(""); }}
              style={{
                background: "none", border: 0, cursor: "pointer",
                color: "#a78bfa", fontWeight: 700, fontSize: ".82rem", transition: "color .2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#c4b5fd")}
              onMouseLeave={e => (e.currentTarget.style.color = "#a78bfa")}
            >
              {mode === "login" ? "Зарегистрироваться" : "Войти"}
            </button>
          </p>

          <p style={{ marginTop: 40, textAlign: "center", fontSize: ".74rem", color: "#22223a" }}>
            Продолжая, вы соглашаетесь с{" "}
            <a href="#" style={{ color: "#3a3a56" }}>Условиями использования</a>
            {" "}и{" "}
            <a href="#" style={{ color: "#3a3a56" }}>Политикой конфиденциальности</a>.
          </p>
        </div>
      </div>

      {/* responsive: hide left panel on small screens */}
      <style>{`
        @media (max-width: 860px) { .auth-left-panel { display: none !important; } }
      `}</style>
    </div>
  );
}

const labelSt: React.CSSProperties = {
  display: "block", fontSize: ".78rem", fontWeight: 600,
  color: "#6b6b8a", marginBottom: 8, letterSpacing: ".025em",
};

const inputSt: React.CSSProperties = {
  width: "100%", padding: "12px 16px", borderRadius: 11,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.03)", color: "#e8e8f8",
  fontSize: ".92rem", transition: "all .2s", boxSizing: "border-box",
  fontFamily: "inherit",
};
