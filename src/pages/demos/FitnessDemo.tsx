import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Dumbbell, Clock, Users, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const schedule = [
  { time: "07:00", name: "Утренняя йога", trainer: "Анна К.", level: "Начинающий" },
  { time: "09:00", name: "CrossFit", trainer: "Дмитрий В.", level: "Продвинутый" },
  { time: "11:00", name: "Пилатес", trainer: "Мария С.", level: "Средний" },
  { time: "14:00", name: "Силовая тренировка", trainer: "Алексей П.", level: "Средний" },
  { time: "17:00", name: "Бокс", trainer: "Руслан И.", level: "Все уровни" },
  { time: "19:00", name: "Растяжка", trainer: "Анна К.", level: "Начинающий" },
];

const plans = [
  { name: "Старт", price: "2 500", period: "/мес", features: ["Тренажёрный зал", "Раздевалка", "Вода"] },
  { name: "Про", price: "4 500", period: "/мес", features: ["Всё из «Старт»", "Групповые занятия", "Сауна", "Консультация тренера"], popular: true },
  { name: "Элит", price: "7 000", period: "/мес", features: ["Всё из «Про»", "Персональный тренер", "Питание", "Бассейн", "Массаж"] },
];

const trainers = [
  { name: "Дмитрий В.", role: "CrossFit тренер", img: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=200&h=200&fit=crop&crop=face" },
  { name: "Анна К.", role: "Йога & Растяжка", img: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=200&h=200&fit=crop&crop=face" },
  { name: "Алексей П.", role: "Силовые тренировки", img: "https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=200&h=200&fit=crop&crop=face" },
];

const fade = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

const FitnessDemo = () => (
  <div className="min-h-screen bg-gray-950 text-gray-50">
    <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-xl border-b border-green-900/20">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/#gallery" className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors">
          <ArrowLeft className="w-4 h-4" /><span className="text-sm">Назад</span>
        </Link>
        <span className="text-xl font-bold tracking-tight text-green-400">💪 FitClub</span>
        <div className="flex gap-6 text-sm text-gray-400">
          <a href="#schedule" className="hover:text-gray-200 transition-colors">Расписание</a>
          <a href="#pricing" className="hover:text-gray-200 transition-colors">Абонементы</a>
          <a href="#trainers" className="hover:text-gray-200 transition-colors">Тренеры</a>
        </div>
      </div>
    </nav>

    {/* Hero */}
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&h=900&fit=crop" alt="Gym" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent" />
      </div>
      <motion.div {...fade} className="relative container mx-auto px-4 max-w-2xl">
        <h1 className="text-5xl md:text-8xl font-bold mb-6 tracking-tight">Тренируйся<br /><span className="text-green-400">мощнее</span></h1>
        <p className="text-xl text-gray-300 mb-8">Современный фитнес-клуб с профессиональными тренерами</p>
        <Button className="bg-green-500 hover:bg-green-400 text-gray-950 font-bold rounded-xl px-8 py-3 text-lg">Записаться</Button>
      </motion.div>
    </section>

    {/* Schedule */}
    <section id="schedule" className="py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.h2 {...fade} className="text-3xl md:text-5xl font-bold text-center mb-16">Расписание</motion.h2>
        <div className="space-y-3">
          {schedule.map((s, i) => (
            <motion.div key={s.time} {...fade} transition={{ delay: i * 0.08 }}
              className="bg-gray-900/60 border border-gray-800/40 rounded-xl p-4 flex items-center justify-between hover:border-green-500/30 transition-colors">
              <div className="flex items-center gap-4">
                <span className="text-green-400 font-mono font-bold w-14">{s.time}</span>
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-gray-400 text-sm">{s.trainer}</div>
                </div>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-green-500/15 text-green-400">{s.level}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Pricing */}
    <section id="pricing" className="py-24 px-4 bg-gray-900/30">
      <div className="container mx-auto max-w-5xl">
        <motion.h2 {...fade} className="text-3xl md:text-5xl font-bold text-center mb-16">Абонементы</motion.h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p, i) => (
            <motion.div key={p.name} {...fade} transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-8 border ${p.popular ? 'bg-green-500/10 border-green-500/30 scale-[1.03]' : 'bg-gray-900/60 border-gray-800/40'}`}>
              {p.popular && <div className="text-green-400 text-xs font-bold mb-4 uppercase tracking-wider">Популярный</div>}
              <h3 className="text-2xl font-bold mb-2">{p.name}</h3>
              <div className="mb-6"><span className="text-4xl font-bold text-green-400">{p.price} ₽</span><span className="text-gray-400">{p.period}</span></div>
              <ul className="space-y-3 mb-8">
                {p.features.map(f => <li key={f} className="flex items-center gap-2 text-gray-300"><Check className="w-4 h-4 text-green-400" />{f}</li>)}
              </ul>
              <Button className={`w-full rounded-xl ${p.popular ? 'bg-green-500 hover:bg-green-400 text-gray-950' : 'bg-gray-800 hover:bg-gray-700'}`}>Выбрать</Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Trainers */}
    <section id="trainers" className="py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.h2 {...fade} className="text-3xl md:text-5xl font-bold text-center mb-16">Наши тренеры</motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {trainers.map((t, i) => (
            <motion.div key={t.name} {...fade} transition={{ delay: i * 0.1 }} className="text-center">
              <img src={t.img} alt={t.name} className="w-32 h-32 rounded-full mx-auto mb-4 object-cover ring-2 ring-green-500/30" />
              <h3 className="font-semibold text-lg">{t.name}</h3>
              <p className="text-gray-400 text-sm">{t.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <footer className="py-12 px-4 border-t border-gray-800/30 text-center text-gray-500 text-sm">
      <p>© 2026 FitClub. Демо-сайт создан на Help Hand.</p>
    </footer>
  </div>
);

export default FitnessDemo;
