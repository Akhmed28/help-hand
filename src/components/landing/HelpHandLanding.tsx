import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, LogOut, Zap, Shield, Globe, BarChart2, Database, Building2, Scan, Rocket, ClipboardList, Megaphone, GraduationCap, Microscope, Users, MessageSquare, Palette, Battery } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const navLinks = ["Сообщество", "Для бизнеса", "Ресурсы", "Карьера", "Цены"];
const trustLogos = ["Google", "Microsoft", "Shopify", "Stripe", "Vercel", "Linear"];
const stats = [
  { value: "4M+", label: "Параметров", sub: "в нашей модели" },
  { value: "98%", label: "Меньше ошибок", sub: "по сравнению с традиционными инструментами" },
  { value: "1000×", label: "Больше контекста", sub: "чем у конкурентов" },
];
const features = [
  { Icon: Database, color: "#8b5cf6", title: "Неограниченные базы данных", desc: "Базы данных PostgreSQL разворачиваются мгновенно. Ваши данные сохраняются, масштабируются и автоматически резервируются без какой-либо настройки." },
  { Icon: Shield, color: "#6366f1", title: "Auth и управление пользователями", desc: "Встроена аутентификация через email, OAuth, magic link и passkey. Role-based access control включён по умолчанию." },
  { Icon: Globe, color: "#06b6d4", title: "Собственные домены", desc: "Публикуйте на своём домене в один клик. SSL-сертификаты выпускаются и продлеваются автоматически. Deploy без простоя." },
  { Icon: Zap, color: "#f59e0b", title: "SEO-оптимизация", desc: "Server-side rendering, meta tags, structured data и sitemap генерируются автоматически для каждой страницы и route." },
  { Icon: BarChart2, color: "#10b981", title: "Встроенная аналитика", desc: "Отслеживайте посетителей, конверсии, воронки и поведение пользователей без подключения сторонних tracking-скриптов." },
  { Icon: Building2, color: "#ec4899", title: "Инфраструктура уровня Enterprise", desc: "Готовность к SOC 2 Type II, GDPR и HIPAA. 99.99% uptime SLA, выделенная поддержка и индивидуальные контракты." },
];
const personas = [
  { icon: Rocket, tag: "Предприниматели", name: "Запускайте MVP за считанные часы", desc: "Переходите от идеи к работающему продукту раньше, чем остынет ваш кофе. Сооснователь или CTO не нужны.", color: "#8b5cf6" },
  { icon: ClipboardList, tag: "Продакт-менеджеры", name: "Прототипируйте без инженеров", desc: "Создавайте интерактивные прототипы, которые действительно работают. Лучше показать, чем объяснять на следующей встрече.", color: "#6366f1" },
  { icon: Megaphone, tag: "Маркетологи", name: "Быстро запускайте landing pages", desc: "Создавайте кампании и микросайты с высокой конверсией, не дожидаясь очереди у команды разработки.", color: "#06b6d4" },
  { icon: Building2, tag: "Агентства", name: "Увеличьте клиентскую отдачу в 10×", desc: "Сдавайте polished-проекты для клиентов за долю прежнего времени. Подходит для white-label по умолчанию.", color: "#f59e0b" },
  { icon: GraduationCap, tag: "Студенты и создатели", name: "Учитесь, создавая реальные вещи", desc: "Лучший способ учиться — делать что-то настоящее. Переходите от tutorial к задеплоенному приложению уже в первый день.", color: "#10b981" },
  { icon: Microscope, tag: "Исследователи", name: "Мгновенно визуализируйте данные", desc: "Превращайте сложные наборы данных в интерактивные dashboards и инструменты для исследований за считанные минуты.", color: "#ec4899" },
];
const testimonials = [
  { text: "HelpHand сократил время нашего цикла разработки с недель до дней. Это буквально изменило наш бизнес.", author: "Алексей М.", role: "CTO, TechStart" },
  { text: "Я запустила свой первый SaaS за выходные. Без знания кода. HelpHand — это магия.", author: "Диана К.", role: "Основатель, CreativeFlow" },
  { text: "Наша команда из 5 маркетологов теперь запускает лендинги самостоятельно. Разработчики счастливы.", author: "Сергей Л.", role: "VP Marketing, GrowthCo" },
];

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
.hh {
  --p1: #8b5cf6;
  --p2: #6366f1;
  --p3: #06b6d4;
  --glow: rgba(139,92,246,0.45);
  --glow-c: rgba(6,182,212,0.3);
  --bg: #07070e;
  --bg2: #0c0c18;
  --bg3: #10101e;
  --glass: rgba(255,255,255,0.035);
  --glass2: rgba(255,255,255,0.06);
  --border: rgba(255,255,255,0.07);
  --border2: rgba(255,255,255,0.12);
  --text: #e8e8f8;
  --muted: #6b6b8a;
  --muted2: #9090b0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  overflow-x: hidden;
}
.hh * { box-sizing: border-box; margin: 0; padding: 0; }
.hh button { font-family: inherit; cursor: pointer; }
.hh a { text-decoration: none; }

/* ─── NAV ─────────────────────────────────────── */
.hh-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  height: 64px; display: flex; align-items: center; justify-content: space-between;
  padding: 0 clamp(20px,5vw,56px);
  background: rgba(7,7,14,0.75);
  backdrop-filter: blur(28px) saturate(180%);
  border-bottom: 1px solid var(--border);
  transition: background 0.3s;
}
.hh-brand { display: flex; align-items: center; gap: 10px; }
.hh-logo-box {
  width: 34px; height: 34px; border-radius: 10px; overflow: hidden;
  background: transparent; display: grid; place-items: center;
}
.hh-logo-box img { width: 100%; height: 100%; object-fit: contain; mix-blend-mode: screen; }
.hh-brand-name {
  font-size: 1.15rem; font-weight: 800; letter-spacing: -0.035em;
  background: linear-gradient(135deg,#fff 40%,#b39ddb);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.hh-nav-links { display: flex; align-items: center; gap: 2px; list-style: none; }
.hh-nav-links a {
  padding: 6px 14px; border-radius: 8px; font-size: .84rem; font-weight: 500;
  color: var(--muted); transition: color .2s, background .2s;
}
.hh-nav-links a:hover { color: var(--text); background: var(--glass2); }
.hh-nav-actions { display: flex; align-items: center; gap: 10px; }
.hh-ghost {
  padding: 7px 16px; border-radius: 9px; font-size: .84rem; font-weight: 500;
  color: var(--muted); background: transparent; border: 0; transition: color .2s, background .2s;
}
.hh-ghost:hover { color: var(--text); background: var(--glass2); }
.hh-pill {
  padding: 8px 20px; border-radius: 10px; font-size: .84rem; font-weight: 600;
  color: #fff; border: 0; background: linear-gradient(135deg,var(--p1),var(--p2));
  box-shadow: 0 0 22px rgba(139,92,246,0.4);
  transition: transform .2s, box-shadow .2s;
}
.hh-pill:hover { transform: translateY(-2px); box-shadow: 0 4px 32px rgba(139,92,246,0.6); }
.hh-user-email {
  font-size: .78rem; color: var(--muted); max-width: 160px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ─── HERO ────────────────────────────────────── */
.hh-hero {
  min-height: 100vh; display: flex; flex-direction: column; align-items: center;
  justify-content: center; text-align: center; padding: 120px clamp(20px,5vw,40px) 80px;
  position: relative; overflow: hidden;
}
.hh-hero-bg {
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
}
.hh-grid-lines {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(139,92,246,.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139,92,246,.07) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 90%);
}
.hh-orb-a {
  position: absolute; border-radius: 50%; pointer-events: none;
  top: -180px; left: 50%; transform: translateX(-52%);
  width: 760px; height: 700px;
  background: radial-gradient(ellipse, rgba(139,92,246,.28) 0%, rgba(99,102,241,.08) 50%, transparent 70%);
  filter: blur(2px);
  animation: hh-float 8s ease-in-out infinite;
}
.hh-orb-b {
  position: absolute; border-radius: 50%; pointer-events: none;
  top: 60px; left: 58%; width: 560px; height: 480px;
  background: radial-gradient(ellipse, rgba(6,182,212,.14) 0%, transparent 65%);
  filter: blur(4px);
  animation: hh-float 10s ease-in-out infinite reverse;
}
.hh-hero-content { position: relative; z-index: 1; max-width: 900px; }
.hh-badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 16px 6px 8px; border-radius: 999px;
  border: 1px solid rgba(139,92,246,.4); background: rgba(139,92,246,.1);
  color: #c4b5fd; font-size: .78rem; font-weight: 600; margin-bottom: 36px;
  backdrop-filter: blur(12px);
  animation: hh-badge-in .6s cubic-bezier(.16,1,.3,1) both;
}
.hh-badge-pill {
  width: 22px; height: 22px; border-radius: 50%;
  background: linear-gradient(135deg,var(--p1),var(--p3));
  box-shadow: 0 0 12px var(--glow); display: grid; place-items: center;
  font-size: .65rem;
}
.hh-badge-live {
  display: inline-block; width: 7px; height: 7px; border-radius: 50%;
  background: #4ade80; box-shadow: 0 0 8px rgba(74,222,128,.8);
  animation: hh-blink 1.5s ease-in-out infinite;
}
.hh-h1 {
  font-size: clamp(3.2rem,8.5vw,6.5rem); font-weight: 900;
  letter-spacing: -0.055em; line-height: .95; margin-bottom: 28px;
  background: linear-gradient(145deg,#ffffff 0%,#e8d8ff 25%,#a78bfa 48%,#6366f1 65%,#06b6d4 82%,#ffffff 100%);
  background-size: 300% 300%; -webkit-background-clip: text;
  -webkit-text-fill-color: transparent; background-clip: text;
  animation: hh-grad 7s ease-in-out infinite, hh-hero-in .8s cubic-bezier(.16,1,.3,1) .1s both;
}
.hh-sub {
  font-size: clamp(1rem,2.2vw,1.22rem); color: var(--muted2);
  max-width: 580px; margin: 0 auto 52px; line-height: 1.8;
  animation: hh-hero-in .8s cubic-bezier(.16,1,.3,1) .2s both;
}
.hh-hero-ctas {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  flex-wrap: wrap; margin-bottom: 72px;
  animation: hh-hero-in .8s cubic-bezier(.16,1,.3,1) .3s both;
}
.hh-cta-main {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 16px 34px; border-radius: 14px; border: 0;
  background: linear-gradient(135deg,var(--p1),var(--p2));
  color: #fff; font-size: 1.02rem; font-weight: 700;
  box-shadow: 0 0 32px rgba(139,92,246,.5), 0 8px 32px rgba(139,92,246,.25);
  transition: transform .2s, box-shadow .2s;
  position: relative; overflow: hidden;
}
.hh-cta-main::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg,rgba(255,255,255,.15),transparent 60%);
  pointer-events: none;
}
.hh-cta-main:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 0 56px rgba(139,92,246,.65), 0 16px 48px rgba(139,92,246,.3); }
.hh-cta-ghost {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 15px 28px; border-radius: 14px; border: 1px solid var(--border2);
  background: var(--glass); color: var(--muted2); font-size: 1rem; font-weight: 600;
  backdrop-filter: blur(10px); transition: color .2s, border-color .2s, background .2s;
}
.hh-cta-ghost:hover { color: var(--text); border-color: rgba(139,92,246,.4); background: rgba(139,92,246,.06); }
.hh-trust { display: flex; flex-direction: column; align-items: center; gap: 14px; animation: hh-hero-in .8s cubic-bezier(.16,1,.3,1) .5s both; }
.hh-trust-label { font-size: .72rem; color: #2e2e48; text-transform: uppercase; letter-spacing: .14em; }
.hh-trust-logos { display: flex; gap: 32px; flex-wrap: wrap; justify-content: center; }
.hh-trust-logo { font-size: .82rem; font-weight: 800; color: #252540; letter-spacing: .06em; text-transform: uppercase; }

/* ─── MOCKUP ──────────────────────────────────── */
.hh-mockup-wrap {
  position: relative; max-width: 820px; margin: 0 auto 100px;
  animation: hh-hero-in .9s cubic-bezier(.16,1,.3,1) .4s both;
}
.hh-mockup {
  background: rgba(12,12,24,.9); border: 1px solid rgba(139,92,246,.2);
  border-radius: 20px; overflow: hidden;
  box-shadow: 0 40px 100px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04), 0 0 60px rgba(139,92,246,.12);
  backdrop-filter: blur(20px);
}
.hh-mockup-bar {
  background: rgba(7,7,18,.8); border-bottom: 1px solid var(--border);
  padding: 12px 18px; display: flex; align-items: center; gap: 14px;
}
.hh-dots { display: flex; gap: 7px; }
.hh-dot { width: 11px; height: 11px; border-radius: 50%; }
.hh-dot.r { background: #ef4444; }
.hh-dot.y { background: #f59e0b; }
.hh-dot.g { background: #22c55e; }
.hh-tab-bar { display: flex; gap: 4px; margin-left: 8px; }
.hh-tab {
  padding: 4px 14px; border-radius: 7px; font-size: .76rem; color: #9090b0;
  background: rgba(255,255,255,.04); border: 1px solid var(--border);
}
.hh-tab.active { color: #c4b5fd; background: rgba(139,92,246,.12); border-color: rgba(139,92,246,.3); }
.hh-mockup-body {
  display: grid; grid-template-columns: 1fr 1fr; min-height: 220px;
}
.hh-chat-pane {
  padding: 20px 18px; border-right: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 12px;
}
.hh-msg {
  padding: 10px 14px; border-radius: 12px; font-size: .8rem; line-height: 1.55; max-width: 88%;
}
.hh-msg.user { background: rgba(139,92,246,.18); border: 1px solid rgba(139,92,246,.3); color: #c4b5fd; align-self: flex-end; border-radius: 12px 12px 4px 12px; }
.hh-msg.ai { background: rgba(255,255,255,.04); border: 1px solid var(--border); color: var(--text); border-radius: 12px 12px 12px 4px; }
.hh-typing { display: flex; gap: 5px; align-items: center; padding: 10px 14px; }
.hh-typing span {
  width: 7px; height: 7px; border-radius: 50%; background: var(--p1);
  animation: hh-typing 1.2s ease-in-out infinite;
}
.hh-typing span:nth-child(2) { animation-delay: .2s; }
.hh-typing span:nth-child(3) { animation-delay: .4s; }
.hh-preview-pane {
  padding: 18px; display: flex; flex-direction: column; gap: 10px;
}
.hh-preview-bar {
  height: 6px; border-radius: 3px; background: linear-gradient(90deg,rgba(139,92,246,.4),rgba(6,182,212,.3));
}
.hh-preview-card {
  background: rgba(255,255,255,.03); border: 1px solid var(--border); border-radius: 10px; padding: 12px;
  display: flex; flex-direction: column; gap: 6px;
}
.hh-preview-line { height: 8px; border-radius: 4px; background: rgba(255,255,255,.07); }
.hh-preview-line.s { width: 60%; }
.hh-preview-btn {
  height: 28px; border-radius: 7px; margin-top: 4px;
  background: linear-gradient(135deg,rgba(139,92,246,.5),rgba(99,102,241,.5));
  border: 1px solid rgba(139,92,246,.4);
}
.hh-mockup-glow {
  position: absolute; inset: -40px; z-index: -1; border-radius: 60px;
  background: radial-gradient(ellipse at 50% 80%, rgba(139,92,246,.18) 0%, transparent 65%);
  filter: blur(30px); pointer-events: none;
}

/* ─── STATS ───────────────────────────────────── */
.hh-stats {
  background: var(--bg2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
}
.hh-stats-inner {
  max-width: 1120px; margin: 0 auto;
  display: grid; grid-template-columns: repeat(3,1fr);
}
.hh-stat {
  padding: 56px 40px; text-align: center;
  border-right: 1px solid var(--border); position: relative; overflow: hidden;
  transition: background .3s;
}
.hh-stat:last-child { border-right: 0; }
.hh-stat::before {
  content: ''; position: absolute; inset: 0; opacity: 0; transition: opacity .3s;
  background: radial-gradient(ellipse at 50% 0%, rgba(139,92,246,.1) 0%, transparent 70%);
}
.hh-stat:hover::before { opacity: 1; }
.hh-stat-value {
  font-size: clamp(2.6rem,5.5vw,4rem); font-weight: 900; letter-spacing: -0.05em; line-height: 1;
  background: linear-gradient(135deg,#fff 20%,#a78bfa 65%,#06b6d4 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.hh-stat-label { font-size: .95rem; font-weight: 600; color: var(--text); margin-top: 10px; }
.hh-stat-sub { font-size: .78rem; color: var(--muted); margin-top: 5px; }

/* ─── SECTIONS ────────────────────────────────── */
.hh-section { padding: clamp(80px,12vw,140px) clamp(20px,5vw,40px); }
.hh-container { max-width: 1120px; margin: 0 auto; }
.hh-divider { max-width: 1120px; margin: 0 auto; height: 1px; background: linear-gradient(90deg,transparent,rgba(139,92,246,.25),transparent); }
.hh-row { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(40px,7vw,96px); align-items: center; }
.hh-row.flip { direction: rtl; }
.hh-row.flip > * { direction: ltr; }
.hh-eyebrow {
  display: inline-flex; align-items: center; gap: 7px; padding: 5px 14px; border-radius: 999px;
  border: 1px solid var(--border2); background: var(--glass2); color: var(--muted2);
  font-size: .72rem; text-transform: uppercase; letter-spacing: .1em; font-weight: 600; margin-bottom: 20px;
}
.hh-title {
  font-size: clamp(2.1rem,4.8vw,3.4rem); font-weight: 800;
  letter-spacing: -0.045em; line-height: 1.08; margin-bottom: 20px; color: var(--text);
}
.hh-grad {
  background: linear-gradient(135deg,#fff 0%,#a78bfa 50%,#06b6d4 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.hh-body { font-size: 1.05rem; color: var(--muted2); max-width: 520px; line-height: 1.8; }
.hh-actions { margin-top: 36px; display: flex; gap: 14px; flex-wrap: wrap; }
.hh-btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 13px 26px; border-radius: 12px; border: 0;
  background: linear-gradient(135deg,var(--p1),var(--p2));
  color: #fff; font-size: .92rem; font-weight: 700;
  box-shadow: 0 0 22px rgba(139,92,246,.4); transition: transform .2s, box-shadow .2s;
}
.hh-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 32px rgba(139,92,246,.6); }
.hh-btn-outline {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 22px; border-radius: 12px; border: 1px solid var(--border2);
  background: var(--glass); color: var(--muted2); font-size: .9rem; font-weight: 600;
  backdrop-filter: blur(8px); transition: color .2s, border-color .2s, background .2s;
}
.hh-btn-outline:hover { color: var(--text); border-color: rgba(139,92,246,.4); background: rgba(139,92,246,.06); }

/* ─── CARD ────────────────────────────────────── */
.hh-card {
  border-radius: 24px; background: var(--bg3); border: 1px solid var(--border);
  overflow: hidden; position: relative;
  box-shadow: 0 24px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.025);
  transition: border-color .3s, box-shadow .3s;
}
.hh-card:hover { border-color: rgba(139,92,246,.25); box-shadow: 0 32px 100px rgba(0,0,0,.55), 0 0 0 1px rgba(139,92,246,.1); }
.hh-card-glow { position: absolute; border-radius: 50%; filter: blur(60px); pointer-events: none; z-index: 0; }
.hh-card-inner { position: relative; z-index: 1; padding: 30px; }

/* editor mockup */
.hh-editor {
  background: #06060f; border-radius: 14px; border: 1px solid rgba(255,255,255,.06);
  overflow: hidden; font-family: 'JetBrains Mono','Fira Code',monospace;
}
.hh-editor-bar {
  background: #0b0b18; padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,.05);
  display: flex; align-items: center; gap: 14px;
}
.hh-editor-body { padding: 18px 20px; color: #d0d4ff; font-size: .79rem; line-height: 1.8; }
.kw { color: #c084fc; } .fn { color: #22d3ee; } .str { color: #f9a8d4; }
.num { color: #86efac; } .cm { color: #555572; }
.hh-build-ok {
  margin-top: 14px; display: flex; align-items: center; gap: 10px; padding: 12px 16px;
  border: 1px solid rgba(74,222,128,.2); background: rgba(74,222,128,.06); border-radius: 12px; color: #d1fae5; font-size: .82rem;
}
.hh-green-dot { width: 9px; height: 9px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 10px rgba(74,222,128,.7); flex-shrink: 0; }

/* big stat card */
.hh-bigstat { padding: 52px 34px; text-align: center; }
.hh-bigstat-value { font-size: clamp(4rem,9vw,7rem); font-weight: 900; line-height: .92; }
.hh-bigstat-sub { font-size: 1rem; color: var(--muted); max-width: 360px; margin: 16px auto 28px; line-height: 1.7; }
.hh-mini-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
.hh-mini-card {
  background: rgba(255,255,255,.025); border: 1px solid var(--border); border-radius: 14px; padding: 16px;
  transition: border-color .2s, background .2s;
}
.hh-mini-card:hover { background: rgba(139,92,246,.05); border-color: rgba(139,92,246,.2); }
.hh-mini-card strong { display: block; font-size: 1.1rem; color: #fff; font-weight: 800; letter-spacing: -0.03em; }
.hh-mini-card span { font-size: .76rem; color: var(--muted); }

/* design system card */
.hh-ds-stack { display: flex; flex-direction: column; gap: 14px; }
.hh-swatch-row,.hh-token-row { display: flex; gap: 10px; flex-wrap: wrap; }
.hh-swatch,.hh-token { padding: 9px 14px; border-radius: 10px; font-size: .82rem; font-weight: 600; }
.hh-typo {
  display: flex; justify-content: space-between; gap: 12px; align-items: center;
  padding: 13px 16px; background: rgba(255,255,255,.025); border: 1px solid var(--border); border-radius: 11px;
}
.hh-typo label { color: var(--muted); text-transform: uppercase; letter-spacing: .08em; font-size: .7rem; }
.hh-typo span { color: var(--text); font-size: .88rem; font-weight: 500; }
.hh-icon-row {
  background: rgba(255,255,255,.02); border: 1px solid var(--border); border-radius: 11px;
  padding: 13px 16px; display: flex; gap: 14px; align-items: center;
}
.hh-icon-sq { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg,#8b5cf6,#06b6d4); box-shadow: 0 0 12px rgba(139,92,246,.4); flex-shrink: 0; }
.hh-icon-synced { margin-left: auto; font-size: .7rem; color: #4ade80; font-weight: 600; }

/* ─── FEATURES ────────────────────────────────── */
.hh-features-head { max-width: 680px; margin-bottom: 48px; }
.hh-feature-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; }
.hh-feature {
  background: linear-gradient(160deg,rgba(255,255,255,.04),rgba(255,255,255,.015));
  border: 1px solid var(--border); border-radius: 22px; padding: 28px;
  backdrop-filter: blur(16px); transition: transform .28s, border-color .28s, box-shadow .28s;
  position: relative; overflow: hidden;
}
.hh-feature::before {
  content: ''; position: absolute; inset: 0; border-radius: 22px; opacity: 0;
  background: linear-gradient(160deg,rgba(139,92,246,.08),transparent);
  transition: opacity .28s;
}
.hh-feature:hover { transform: translateY(-6px); border-color: rgba(139,92,246,.4); box-shadow: 0 16px 48px rgba(139,92,246,.15); }
.hh-feature:hover::before { opacity: 1; }
.hh-feature-icon-wrap {
  width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center;
  margin-bottom: 18px;
}
.hh-feature h3 { font-size: 1.02rem; font-weight: 700; margin-bottom: 10px; color: var(--text); }
.hh-feature p { font-size: .83rem; color: var(--muted); line-height: 1.68; }

/* ─── PERSONAS ────────────────────────────────── */
.hh-personas-head { padding: 0 clamp(20px,5vw,40px); margin-bottom: 48px; }
.hh-personas-track {
  display: flex; gap: 18px; overflow-x: auto; scrollbar-width: none;
  padding: 0 clamp(20px,5vw,40px) clamp(24px,4vw,44px);
  scroll-snap-type: x mandatory;
}
.hh-personas-track::-webkit-scrollbar { display: none; }
.hh-persona {
  flex: 0 0 268px; scroll-snap-align: start; background: var(--bg3); border: 1px solid var(--border);
  border-radius: 22px; padding: 30px 26px; position: relative; overflow: hidden;
  transition: transform .3s, border-color .3s, box-shadow .3s;
}
.hh-persona::after {
  content: ''; position: absolute; inset: 0; opacity: 0; border-radius: 22px;
  background: linear-gradient(160deg,rgba(139,92,246,.08),transparent);
  transition: opacity .3s;
}
.hh-persona:hover { transform: translateY(-6px); border-color: rgba(139,92,246,.35); box-shadow: 0 16px 48px rgba(139,92,246,.14); }
.hh-persona:hover::after { opacity: 1; }
.hh-persona-emoji { font-size: 2.4rem; margin-bottom: 16px; display: block; }
.hh-persona-tag { font-size: .71rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; margin-bottom: 8px; }
.hh-persona h3 { font-size: 1.02rem; font-weight: 700; margin-bottom: 10px; color: var(--text); }
.hh-persona p { font-size: .83rem; color: var(--muted); line-height: 1.65; }

/* ─── TESTIMONIALS ────────────────────────────── */
.hh-testimonials { padding: clamp(80px,12vw,130px) clamp(20px,5vw,40px); background: var(--bg2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.hh-testi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 52px; }
.hh-testi {
  background: var(--bg3); border: 1px solid var(--border); border-radius: 20px; padding: 28px;
  position: relative; transition: border-color .3s, box-shadow .3s;
}
.hh-testi:hover { border-color: rgba(139,92,246,.3); box-shadow: 0 12px 40px rgba(139,92,246,.1); }
.hh-testi::before { content: '"'; position: absolute; top: 16px; right: 20px; font-size: 4rem; color: rgba(139,92,246,.12); font-family: serif; line-height: 1; }
.hh-testi-text { font-size: .9rem; color: var(--muted2); line-height: 1.75; margin-bottom: 20px; }
.hh-testi-author { display: flex; flex-direction: column; gap: 3px; }
.hh-testi-name { font-size: .88rem; font-weight: 700; color: var(--text); }
.hh-testi-role { font-size: .76rem; color: var(--muted); }
.hh-stars { display: flex; gap: 3px; margin-bottom: 14px; }
.hh-star { color: #f59e0b; font-size: .85rem; }

/* ─── CTA ─────────────────────────────────────── */
.hh-cta {
  padding: clamp(110px,15vw,170px) clamp(20px,5vw,40px);
  text-align: center; position: relative; overflow: hidden;
}
.hh-cta-orb-a {
  position: absolute; border-radius: 50%; pointer-events: none;
  bottom: -200px; left: 50%; transform: translateX(-50%);
  width: 800px; height: 700px;
  background: radial-gradient(ellipse, rgba(139,92,246,.22) 0%, transparent 65%);
  filter: blur(4px);
}
.hh-cta-orb-b {
  position: absolute; border-radius: 50%; pointer-events: none;
  top: -100px; left: 50%; transform: translateX(-50%);
  width: 500px; height: 400px;
  background: radial-gradient(ellipse, rgba(6,182,212,.1) 0%, transparent 65%);
  filter: blur(4px);
}
.hh-cta-content { position: relative; z-index: 1; }
.hh-cta-title {
  font-size: clamp(2.6rem,7vw,5rem); font-weight: 900; letter-spacing: -0.055em; line-height: .95;
  background: linear-gradient(145deg,#ffffff 0%,#e8d8ff 30%,#a78bfa 55%,#6366f1 72%,#06b6d4 88%,#ffffff 100%);
  background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  animation: hh-grad 7s ease-in-out infinite; margin-bottom: 20px;
}
.hh-cta-sub { font-size: 1.1rem; color: var(--muted); margin-bottom: 44px; }
.hh-cta-actions { display: flex; align-items: center; gap: 16px; justify-content: center; flex-wrap: wrap; }
.hh-cta-note { font-size: .8rem; color: #2e2e4a; display: flex; align-items: center; gap: 6px; }
.hh-cta-note::before { content: '✓'; color: #4ade80; }

/* ─── FOOTER ──────────────────────────────────── */
.hh-footer {
  background: var(--bg2); border-top: 1px solid var(--border);
  padding: 80px clamp(20px,5vw,56px) 40px;
}
.hh-footer-top {
  max-width: 1120px; margin: 0 auto 36px;
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px;
  padding-bottom: 60px; border-bottom: 1px solid var(--border);
}
.hh-footer-about { font-size: .84rem; color: var(--muted); margin-top: 16px; max-width: 240px; line-height: 1.75; }
.hh-footer-col h5 {
  font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .14em; color: #2e2e4a;
  margin-bottom: 20px;
}
.hh-footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 14px; }
.hh-footer-col a { color: var(--muted); font-size: .84rem; transition: color .2s; }
.hh-footer-col a:hover { color: var(--text); }
.hh-footer-bottom {
  max-width: 1120px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
}
.hh-copy { font-size: .76rem; color: #22223a; }
.hh-legal { display: flex; gap: 22px; }
.hh-legal a { font-size: .76rem; color: #22223a; transition: color .2s; }
.hh-legal a:hover { color: var(--muted); }

/* ─── REVEAL ──────────────────────────────────── */
.hh-reveal {
  opacity: 0; transform: translateY(32px);
  transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1);
}
.hh-reveal.visible { opacity: 1; transform: none; }
.hh-d1 { transition-delay: .1s; }
.hh-d2 { transition-delay: .2s; }
.hh-d3 { transition-delay: .3s; }
.hh-d4 { transition-delay: .4s; }
.hh-d5 { transition-delay: .5s; }

/* ─── KEYFRAMES ───────────────────────────────── */
@keyframes hh-grad {
  0%,100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
@keyframes hh-float {
  0%,100% { transform: translateX(-52%) translateY(0px); }
  50% { transform: translateX(-52%) translateY(-24px); }
}
@keyframes hh-hero-in {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: none; }
}
@keyframes hh-badge-in {
  from { opacity: 0; transform: scale(.92); }
  to { opacity: 1; transform: none; }
}
@keyframes hh-blink {
  0%,100% { opacity: 1; } 50% { opacity: .3; }
}
@keyframes hh-typing {
  0%,100% { transform: translateY(0); opacity: .4; }
  50% { transform: translateY(-5px); opacity: 1; }
}

/* ─── RESPONSIVE ──────────────────────────────── */
@media (max-width: 980px) {
  .hh-nav-links { display: none; }
  .hh-row, .hh-stats-inner, .hh-feature-grid, .hh-testi-grid, .hh-footer-top { grid-template-columns: 1fr; }
  .hh-stat { border-right: 0; border-bottom: 1px solid var(--border); }
  .hh-stat:last-child { border-bottom: 0; }
  .hh-mockup-body { grid-template-columns: 1fr; }
  .hh-preview-pane { display: none; }
}
@media (max-width: 640px) {
  .hh-pill { display: none; }
  .hh-mini-grid { grid-template-columns: 1fr 1fr; }
}
`;

const HelpHandLanding = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".hh-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleStart = () => navigate(user ? "/editor" : "/auth");

  return (
    <div className="hh">
      <style>{styles}</style>

      {/* ── NAV ── */}
      <nav className="hh-nav">
        <a href="#top" className="hh-brand">
          <div className="hh-logo-box" aria-hidden="true">
            <img src="/helphand-logo.jpeg" alt="HelpHand logo" />
          </div>
          <span className="hh-brand-name">HelpHand</span>
        </a>
        <ul className="hh-nav-links">
          {navLinks.map((l) => <li key={l}><a href="#">{l}</a></li>)}
        </ul>
        <div className="hh-nav-actions">
          {user ? (
            <>
              <span className="hh-user-email">{user.email}</span>
              <button className="hh-ghost" type="button" onClick={() => signOut()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <LogOut size={14} /> Выйти
              </button>
              <button className="hh-pill" type="button" onClick={handleStart}>Редактор</button>
            </>
          ) : (
            <>
              <button className="hh-ghost" type="button" onClick={() => navigate("/auth")}>Войти</button>
              <button className="hh-pill" type="button" onClick={() => navigate("/auth")}>Начать</button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hh-hero" id="top">
        <div className="hh-hero-bg">
          <div className="hh-grid-lines" />
          <div className="hh-orb-a" />
          <div className="hh-orb-b" />
        </div>
        <div className="hh-hero-content">
          <div className="hh-badge">
            <span className="hh-badge-pill"><Zap size={14} /></span>
            <span className="hh-badge-live" />
            AI-платформа нового поколения — vibe coding
          </div>
          <h1 className="hh-h1">
            Что вы<br />создадите сегодня?
          </h1>
          <p className="hh-sub">
            Создавайте впечатляющие приложения и сайты, общаясь с AI — без опыта программирования. От идеи до продакшена за минуты.
          </p>
          <div className="hh-hero-ctas">
            <button className="hh-cta-main" type="button" onClick={handleStart}>
              Начать бесплатно <ArrowRight size={18} />
            </button>
            <button className="hh-cta-ghost" type="button" onClick={() => window.open('/ar.html', '_blank')}>
              <Scan size={18} /> AR режим
            </button>
            <button className="hh-cta-ghost" type="button" onClick={handleStart}>
              Смотреть демо ▸
            </button>
          </div>
        </div>
      </section>

      {/* ── PRODUCT MOCKUP ── */}
      <div style={{ padding: "0 clamp(20px,5vw,40px)", position: "relative", zIndex: 1, marginTop: -20, marginBottom: 0 }}>
        <div className="hh-mockup-wrap">
          <div className="hh-mockup">
            <div className="hh-mockup-bar">
              <div className="hh-dots">
                <span className="hh-dot r" /><span className="hh-dot y" /><span className="hh-dot g" />
              </div>
              <div className="hh-tab-bar">
                <span className="hh-tab active">Редактор</span>
                <span className="hh-tab">Превью</span>
                <span className="hh-tab">Deploy</span>
              </div>
            </div>
            <div className="hh-mockup-body">
              <div className="hh-chat-pane">
                <div className="hh-msg user">Создай красивый лендинг для SaaS-продукта с hero, фичами и CTA</div>
                <div className="hh-msg ai">Конечно! Создаю полноценный лендинг с glassmorphism-дизайном, анимациями и адаптивной вёрсткой...</div>
                <div className="hh-typing"><span /><span /><span /></div>
              </div>
              <div className="hh-preview-pane">
                <div className="hh-preview-bar" />
                <div className="hh-preview-card">
                  <div className="hh-preview-line" />
                  <div className="hh-preview-line s" />
                  <div className="hh-preview-btn" />
                </div>
                <div className="hh-preview-card">
                  <div className="hh-preview-line s" />
                  <div className="hh-preview-line" />
                </div>
              </div>
            </div>
          </div>
          <div className="hh-mockup-glow" />
        </div>
      </div>

      {/* ── TRUST ── */}
      <div style={{ textAlign: "center", paddingBottom: 80, position: "relative", zIndex: 1 }}>
        <div className="hh-trust">
          <div className="hh-trust-label">Команды из этих компаний доверяют нам</div>
          <div className="hh-trust-logos">
            {trustLogos.map((l) => <span key={l} className="hh-trust-logo">{l}</span>)}
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <section className="hh-stats">
        <div className="hh-stats-inner">
          {stats.map((s, i) => (
            <div key={s.label} className={`hh-stat hh-reveal ${i ? `hh-d${i}` : ""}`}>
              <div className="hh-stat-value">{s.value}</div>
              <div className="hh-stat-label">{s.label}</div>
              <div className="hh-stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION: 98% fewer errors ── */}
      <section className="hh-section">
        <div className="hh-container hh-row">
          <div className="hh-reveal">
            <div className="hh-eyebrow"><Zap size={14} style={{ display: "inline", verticalAlign: "-2px" }} /> Для тех, кто создаёт</div>
            <h2 className="hh-title">
              <span className="hh-grad">На 98% меньше ошибок.</span><br />
              Запускайте с уверенностью.
            </h2>
            <p className="hh-body">
              AI от HelpHand находит ошибки ещё до того, как они произойдут. Получайте production-ready код, который работает с первого раза — каждый раз.
            </p>
            <div className="hh-actions">
              <button className="hh-btn-primary" type="button" onClick={handleStart}>Начать бесплатно <ArrowRight size={16} /></button>
              <button className="hh-btn-outline" type="button">Посмотреть, как это работает</button>
            </div>
          </div>
          <div className="hh-card hh-reveal hh-d2">
            <div className="hh-card-glow" style={{ width: 240, height: 240, background: "rgba(139,92,246,.2)", top: -60, right: -60 }} />
            <div className="hh-card-inner">
              <div className="hh-editor">
                <div className="hh-editor-bar">
                  <div className="hh-dots"><span className="hh-dot r" /><span className="hh-dot y" /><span className="hh-dot g" /></div>
                  <span style={{ fontSize: ".76rem", color: "#8b8baa" }}>app.ts — HelpHand workspace</span>
                </div>
                <div className="hh-editor-body">
                  <div><span className="kw">const</span> <span className="fn">createApp</span> = <span className="kw">async</span> () =&gt; {'{'}</div>
                  <div>&nbsp; <span className="kw">const</span> app = <span className="kw">await</span> <span className="fn">HelpHand</span>.<span className="fn">generate</span>({'{'}</div>
                  <div>&nbsp;&nbsp;&nbsp; prompt: <span className="str">"Todo app with auth"</span>,</div>
                  <div>&nbsp;&nbsp;&nbsp; backend: <span className="num">true</span>, deploy: <span className="num">true</span>,</div>
                  <div>&nbsp; {'}'}; <span className="cm">// ✓ 0 ошибок найдено</span></div>
                  <div>&nbsp; <span className="kw">return</span> app.<span className="fn">url</span>;</div>
                  <div>{'}'};</div>
                </div>
              </div>
              <div className="hh-build-ok">
                <span className="hh-green-dot" />
                <span>Сборка успешна — опубликовано в production за 8 с</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="hh-divider" />

      {/* ── SECTION: 1000× context ── */}
      <section className="hh-section">
        <div className="hh-container hh-row flip">
          <div className="hh-reveal">
            <div className="hh-eyebrow"><Rocket size={14} style={{ display: "inline", verticalAlign: "-2px" }} /> Масштабируйтесь смело</div>
            <h2 className="hh-title">
              Масштабируйтесь без<br /><span className="hh-grad">поломок.</span>
            </h2>
            <p className="hh-body">
              Работайте с кодовыми базами в 1000× больше, чем у любого другого AI-инструмента. HelpHand понимает весь контекст проекта, а не только файл, который вы редактируете.
            </p>
            <div className="hh-actions">
              <button className="hh-btn-primary" type="button" onClick={handleStart}>Попробовать бесплатно <ArrowRight size={16} /></button>
            </div>
          </div>
          <div className="hh-card hh-reveal hh-d2">
            <div className="hh-card-glow" style={{ width: 300, height: 300, background: "rgba(6,182,212,.1)", bottom: -80, left: -80 }} />
            <div className="hh-bigstat">
              <div className="hh-bigstat-value hh-grad">1000×</div>
              <div className="hh-bigstat-sub">Более широкий контекст, чем у любого другого AI-инструмента для кода</div>
              <div className="hh-mini-grid">
                <div className="hh-mini-card"><strong>128k</strong><span>Контекст токенов</span></div>
                <div className="hh-mini-card"><strong>∞</strong><span>Итерации</span></div>
                <div className="hh-mini-card"><strong>0ms</strong><span>Холодный старт</span></div>
                <div className="hh-mini-card"><strong>99.9%</strong><span>SLA доступности</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="hh-divider" />

      {/* ── SECTION: design system ── */}
      <section className="hh-section">
        <div className="hh-container hh-row">
          <div className="hh-reveal">
            <div className="hh-eyebrow"><Palette size={14} style={{ display: "inline", verticalAlign: "-2px" }} /> Ваш бренд</div>
            <h2 className="hh-title">
              Создавайте со своей<br /><span className="hh-grad">design system.</span>
            </h2>
            <p className="hh-body">
              Импортируйте ваши макеты из Figma, бренд-токены и библиотеку компонентов. HelpHand свободно говорит на языке вашего дизайна — pixel perfect каждый раз.
            </p>
            <div className="hh-actions">
              <button className="hh-btn-primary" type="button" onClick={handleStart}>Импортировать из Figma <ArrowRight size={16} /></button>
            </div>
          </div>
          <div className="hh-card hh-reveal hh-d2">
            <div className="hh-card-glow" style={{ width: 220, height: 220, background: "rgba(139,92,246,.15)", top: 0, right: -40 }} />
            <div className="hh-card-inner hh-ds-stack">
              <div className="hh-swatch-row">
                <div className="hh-swatch" style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff" }}>Основной</div>
                <div className="hh-swatch" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", color: "#9090b0" }}>Поверхность</div>
                <div className="hh-swatch" style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)", color: "#fff" }}>Акцент</div>
              </div>
              <div className="hh-typo">
                <label>типографика</label>
                <span>Inter — Aa Bb Cc</span>
              </div>
              <div className="hh-token-row">
                <div className="hh-token" style={{ background: "rgba(139,92,246,.12)", border: "1px solid rgba(139,92,246,.3)", color: "#a78bfa" }}>Кнопка</div>
                <div className="hh-token" style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", color: "#9090b0" }}>Поле ввода</div>
                <div className="hh-token" style={{ background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.25)", color: "#4ade80" }}>Badge</div>
                <div className="hh-token" style={{ background: "rgba(6,182,212,.08)", border: "1px solid rgba(6,182,212,.25)", color: "#06b6d4" }}>Tag</div>
              </div>
              <div className="hh-icon-row">
                <div className="hh-icon-sq" />
                <div>
                  <div style={{ fontSize: ".76rem", fontWeight: 600 }}>Набор иконок совпал</div>
                  <div style={{ fontSize: ".68rem", color: "#6b6b8a" }}>128 иконок импортировано из Figma</div>
                </div>
                <div className="hh-icon-synced">✓ синхронизировано</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="hh-section" style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="hh-container">
          <div className="hh-features-head hh-reveal">
            <div className="hh-eyebrow"><Battery size={14} style={{ display: "inline", verticalAlign: "-2px" }} /> Full-stack</div>
            <h2 className="hh-title">Всё, что вам нужно.<br /><span className="hh-grad">Сразу из коробки.</span></h2>
            <p className="hh-body" style={{ marginTop: 16 }}>
              HelpHand генерирует полноценные приложения — а не только UI-макеты. Каждое приложение готово к production.
            </p>
          </div>
          <div className="hh-feature-grid hh-reveal hh-d1">
            {features.map(({ Icon, color, title, desc }) => (
              <article key={title} className="hh-feature">
                <div className="hh-feature-icon-wrap" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon size={22} color={color} />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERSONAS ── */}
      <section className="hh-section" style={{ paddingBottom: 0 }}>
        <div className="hh-personas-head hh-reveal">
          <div className="hh-eyebrow"><Users size={14} style={{ display: "inline", verticalAlign: "-2px" }} /> Для всех</div>
          <h2 className="hh-title">Кто создаёт с HelpHand?</h2>
          <p className="hh-body" style={{ marginTop: 14 }}>От начинающих основателей до команд Fortune 500 — HelpHand подстраивается под ваш стиль работы.</p>
        </div>
      </section>
      <div style={{ paddingBottom: 100, overflow: "hidden" }}>
        <div className="hh-personas-track">
          {personas.map((p, i) => (
            <article key={p.name} className={`hh-persona hh-reveal ${i ? `hh-d${Math.min(i, 5)}` : ""}`}>
              <span className="hh-persona-emoji" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><p.icon size={24} color={p.color} /></span>
              <div className="hh-persona-tag" style={{ color: p.color }}>{p.tag}</div>
              <h3>{p.name}</h3>
              <p>{p.desc}</p>
            </article>
          ))}
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <section className="hh-testimonials">
        <div className="hh-container">
          <div className="hh-reveal">
            <div className="hh-eyebrow"><MessageSquare size={14} style={{ display: "inline", verticalAlign: "-2px" }} /> Отзывы</div>
            <h2 className="hh-title">Что говорят пользователи</h2>
          </div>
          <div className="hh-testi-grid">
            {testimonials.map((t, i) => (
              <div key={t.author} className={`hh-testi hh-reveal hh-d${i + 1}`}>
                <div className="hh-stars">
                  {[...Array(5)].map((_, j) => <span key={j} className="hh-star">★</span>)}
                </div>
                <p className="hh-testi-text">{t.text}</p>
                <div className="hh-testi-author">
                  <span className="hh-testi-name">{t.author}</span>
                  <span className="hh-testi-role">{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="hh-cta">
        <div className="hh-cta-orb-a" />
        <div className="hh-cta-orb-b" />
        <div className="hh-cta-content">
          <h2 className="hh-cta-title hh-reveal">Начните создавать бесплатно</h2>
          <p className="hh-cta-sub hh-reveal hh-d1">Банковская карта не нужна. Ваше первое приложение будет онлайн уже через несколько минут.</p>
          <div className="hh-cta-actions hh-reveal hh-d2">
            <button className="hh-cta-main" type="button" onClick={handleStart}>
              Начать бесплатно <ArrowRight size={18} />
            </button>
            <div className="hh-cta-note">Банковская карта не нужна</div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="hh-footer">
        <div className="hh-footer-top">
          <div>
            <div className="hh-brand">
              <div className="hh-logo-box" style={{ width: 28, height: 28 }}>
                <img src="/helphand-logo.jpeg" alt="HelpHand logo" />
              </div>
              <span className="hh-brand-name" style={{ fontSize: "1.05rem" }}>HelpHand</span>
            </div>
            <p className="hh-footer-about">Full-stack платформа для современной веб-разработки на базе AI. Создавайте, запускайте и масштабируйте быстрее, чем когда-либо.</p>
          </div>
          <div className="hh-footer-col">
            <h5>Ресурсы</h5>
            <ul>
              <li><a href="#">Документация</a></li>
              <li><a href="#">Блог</a></li>
              <li><a href="#">Changelog</a></li>
              <li><a href="#">Статус</a></li>
              <li><a href="#">Центр помощи</a></li>
            </ul>
          </div>
          <div className="hh-footer-col">
            <h5>Компания</h5>
            <ul>
              <li><a href="#">О нас</a></li>
              <li><a href="#">Карьера</a></li>
              <li><a href="#">Enterprise</a></li>
              <li><a href="#">Цены</a></li>
              <li><a href="#">Безопасность</a></li>
            </ul>
          </div>
          <div className="hh-footer-col">
            <h5>Сообщество</h5>
            <ul>
              <li><a href="#">Discord</a></li>
              <li><a href="#">Twitter / X</a></li>
              <li><a href="#">YouTube</a></li>
              <li><a href="#">GitHub</a></li>
              <li><a href="#">Reddit</a></li>
            </ul>
          </div>
        </div>
        <div className="hh-footer-bottom">
          <span className="hh-copy">© 2026 HelpHand — Все права защищены.</span>
          <div className="hh-legal">
            <a href="#">Политика конфиденциальности</a>
            <a href="#">Условия использования</a>
            <a href="#">Cookie</a>
          </div>
        </div>
      </footer>

      {isMounted ? null : <Sparkles style={{ display: "none" }} />}
    </div>
  );
};

export default HelpHandLanding;
