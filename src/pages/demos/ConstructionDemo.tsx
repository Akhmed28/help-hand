import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2, Hammer, Ruler, HardHat, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  { icon: Building2, title: "Строительство", desc: "Жилые и коммерческие объекты под ключ" },
  { icon: Hammer, title: "Капитальный ремонт", desc: "Реконструкция зданий и помещений" },
  { icon: Ruler, title: "Проектирование", desc: "Архитектурные и инженерные решения" },
];

const stats = [
  { value: "20+", label: "Лет опыта" },
  { value: "500+", label: "Объектов" },
  { value: "150+", label: "Сотрудников" },
  { value: "98%", label: "Довольных клиентов" },
];

const portfolio = [
  { img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&h=350&fit=crop", title: "БЦ «Меридиан»" },
  { img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&h=350&fit=crop", title: "ЖК «Парковый»" },
  { img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&h=350&fit=crop", title: "ТЦ «Галерея»" },
  { img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500&h=350&fit=crop", title: "Склад «Логистик»" },
];

const fade = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

const ConstructionDemo = () => (
  <div className="min-h-screen bg-slate-950 text-slate-50">
    <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/#gallery" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" /><span className="text-sm">Назад</span>
        </Link>
        <span className="text-xl font-bold tracking-tight">🏗 СтройГрупп</span>
        <div className="flex gap-6 text-sm text-slate-400">
          <a href="#services" className="hover:text-slate-200 transition-colors">Услуги</a>
          <a href="#portfolio" className="hover:text-slate-200 transition-colors">Портфолио</a>
          <a href="#contact" className="hover:text-slate-200 transition-colors">Контакты</a>
        </div>
      </div>
    </nav>

    {/* Hero */}
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&h=900&fit=crop" alt="Construction" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
      </div>
      <motion.div {...fade} className="relative container mx-auto px-4 max-w-2xl">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">Строим<br /><span className="text-sky-400">будущее</span></h1>
        <p className="text-xl text-slate-300 mb-8">Надёжное строительство жилых и коммерческих объектов с 2004 года</p>
        <Button className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl px-8 py-3">Получить смету</Button>
      </motion.div>
    </section>

    {/* Stats */}
    <section className="py-16 px-4 bg-slate-900/50">
      <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...fade} transition={{ delay: i * 0.1 }}>
            <div className="text-4xl md:text-5xl font-bold text-sky-400">{s.value}</div>
            <div className="text-slate-400 mt-2">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Services */}
    <section id="services" className="py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.h2 {...fade} className="text-3xl md:text-5xl font-bold text-center mb-16">Наши услуги</motion.h2>
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((s, i) => (
            <motion.div key={s.title} {...fade} transition={{ delay: i * 0.1 }}
              className="bg-slate-900/60 border border-slate-800/40 rounded-2xl p-8 hover:-translate-y-1 transition-transform text-center">
              <s.icon className="w-12 h-12 text-sky-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">{s.title}</h3>
              <p className="text-slate-400">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Portfolio */}
    <section id="portfolio" className="py-24 px-4 bg-slate-900/30">
      <div className="container mx-auto max-w-5xl">
        <motion.h2 {...fade} className="text-3xl md:text-5xl font-bold text-center mb-16">Портфолио</motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {portfolio.map((p, i) => (
            <motion.div key={p.title} {...fade} transition={{ delay: i * 0.1 }} className="group relative rounded-2xl overflow-hidden">
              <img src={p.img} alt={p.title} className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end p-6">
                <span className="font-semibold text-lg">{p.title}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Contact */}
    <section id="contact" className="py-24 px-4">
      <div className="container mx-auto max-w-lg text-center">
        <motion.h2 {...fade} className="text-3xl md:text-5xl font-bold mb-6">Свяжитесь с нами</motion.h2>
        <motion.p {...fade} className="text-slate-400 mb-8">Оставьте заявку и мы подготовим индивидуальную смету</motion.p>
        <motion.div {...fade} className="bg-slate-900/60 border border-slate-800/40 rounded-3xl p-8 space-y-4">
          <input type="text" placeholder="Имя" className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-3 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:border-sky-500" />
          <input type="tel" placeholder="Телефон" className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-3 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:border-sky-500" />
          <textarea placeholder="Описание проекта" rows={3} className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-3 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 resize-none" />
          <Button className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl py-3">Отправить заявку</Button>
        </motion.div>
      </div>
    </section>

    <footer className="py-12 px-4 border-t border-slate-800/30 text-center text-slate-500 text-sm">
      <p>© 2026 СтройГрупп. Демо-сайт создан на Help Hand.</p>
    </footer>
  </div>
);

export default ConstructionDemo;
