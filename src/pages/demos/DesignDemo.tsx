import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Palette, Globe, PenTool, Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const cases = [
  { title: "Ребрендинг SkyBank", cat: "Брендинг", img: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=350&fit=crop" },
  { title: "Сайт CloudOS", cat: "Веб-дизайн", img: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=500&h=350&fit=crop" },
  { title: "Упаковка EcoFood", cat: "Айдентика", img: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=500&h=350&fit=crop" },
  { title: "Приложение FinTrack", cat: "UX/UI", img: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=500&h=350&fit=crop" },
];

const services = [
  { icon: Palette, title: "Логотипы и брендинг", desc: "Создаём уникальную визуальную идентичность" },
  { icon: Globe, title: "Веб-дизайн", desc: "Современные сайты, которые конвертят" },
  { icon: PenTool, title: "UX/UI дизайн", desc: "Удобные и красивые интерфейсы приложений" },
];

const reviews = [
  { name: "Иван М.", company: "SkyBank", text: "Команда превзошла все ожидания. Наш ребрендинг стал событием года в отрасли.", rating: 5 },
  { name: "Ольга С.", company: "EcoFood", text: "Великолепная работа с упаковкой. Продажи выросли на 40% после запуска.", rating: 5 },
  { name: "Артём К.", company: "FinTrack", text: "Дизайн приложения получился интуитивно понятным. Пользователи в восторге.", rating: 5 },
];

const fade = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

const DesignDemo = () => (
  <div className="min-h-screen bg-violet-950 text-violet-50">
    <nav className="fixed top-0 w-full z-50 bg-violet-950/80 backdrop-blur-xl border-b border-violet-800/20">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/#gallery" className="flex items-center gap-2 text-violet-300 hover:text-violet-100 transition-colors">
          <ArrowLeft className="w-4 h-4" /><span className="text-sm">Назад</span>
        </Link>
        <span className="text-xl font-bold tracking-tight text-violet-300">✦ PixelCraft</span>
        <div className="flex gap-6 text-sm text-violet-400">
          <a href="#cases" className="hover:text-violet-200 transition-colors">Кейсы</a>
          <a href="#services" className="hover:text-violet-200 transition-colors">Услуги</a>
          <a href="#contact" className="hover:text-violet-200 transition-colors">Контакты</a>
        </div>
      </div>
    </nav>

    {/* Hero */}
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1600&h=900&fit=crop" alt="Design studio" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/70 via-violet-950/60 to-violet-950" />
      </div>
      <motion.div {...fade} className="relative text-center w-full px-4 max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-8xl font-bold mb-6 tracking-tight">Дизайн,<br /><span className="text-violet-400">который продаёт</span></h1>
        <p className="text-xl text-violet-200/80 mb-8">Создаём бренды, сайты и интерфейсы для амбициозных компаний</p>
        <Button className="bg-violet-500 hover:bg-violet-400 text-violet-950 font-bold rounded-xl px-8 py-3 text-lg">Обсудить проект</Button>
      </motion.div>
    </section>

    {/* Cases */}
    <section id="cases" className="py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.h2 {...fade} className="text-3xl md:text-5xl font-bold text-center mb-16">Портфолио</motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {cases.map((c, i) => (
            <motion.div key={c.title} {...fade} transition={{ delay: i * 0.1 }}
              className="group rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform">
              <div className="relative h-64 overflow-hidden">
                <img src={c.img} alt={c.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-violet-950/80 to-transparent flex items-end p-6">
                  <div>
                    <span className="text-xs text-violet-400 font-medium">{c.cat}</span>
                    <h3 className="font-semibold text-lg">{c.title}</h3>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Services */}
    <section id="services" className="py-24 px-4 bg-violet-900/20">
      <div className="container mx-auto max-w-4xl">
        <motion.h2 {...fade} className="text-3xl md:text-5xl font-bold text-center mb-16">Услуги</motion.h2>
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((s, i) => (
            <motion.div key={s.title} {...fade} transition={{ delay: i * 0.1 }}
              className="bg-violet-900/30 border border-violet-800/20 rounded-2xl p-8 text-center hover:-translate-y-1 transition-transform">
              <s.icon className="w-12 h-12 text-violet-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">{s.title}</h3>
              <p className="text-violet-300/60">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Reviews */}
    <section className="py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.h2 {...fade} className="text-3xl md:text-5xl font-bold text-center mb-16">Отзывы</motion.h2>
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <motion.div key={r.name} {...fade} transition={{ delay: i * 0.1 }}
              className="bg-violet-900/30 border border-violet-800/20 rounded-2xl p-6">
              <div className="flex gap-1 mb-4">{Array.from({length: r.rating}).map((_, j) => <Star key={j} className="w-4 h-4 fill-violet-400 text-violet-400" />)}</div>
              <p className="text-violet-200/70 mb-4 text-sm leading-relaxed">"{r.text}"</p>
              <div><div className="font-semibold text-sm">{r.name}</div><div className="text-violet-400/60 text-xs">{r.company}</div></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Contact */}
    <section id="contact" className="py-24 px-4 bg-violet-900/20">
      <div className="container mx-auto max-w-lg text-center">
        <motion.h2 {...fade} className="text-3xl md:text-5xl font-bold mb-6">Начнём проект?</motion.h2>
        <motion.div {...fade} className="bg-violet-900/30 border border-violet-800/20 rounded-3xl p-8 space-y-4">
          <input type="text" placeholder="Имя" className="w-full bg-violet-900/40 border border-violet-800/30 rounded-xl px-4 py-3 text-violet-50 placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500" />
          <input type="email" placeholder="Email" className="w-full bg-violet-900/40 border border-violet-800/30 rounded-xl px-4 py-3 text-violet-50 placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500" />
          <textarea placeholder="Расскажите о проекте" rows={3} className="w-full bg-violet-900/40 border border-violet-800/30 rounded-xl px-4 py-3 text-violet-50 placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500 resize-none" />
          <Button className="w-full bg-violet-500 hover:bg-violet-400 text-violet-950 font-bold rounded-xl py-3">Отправить <Send className="w-4 h-4 ml-2" /></Button>
        </motion.div>
      </div>
    </section>

    <footer className="py-12 px-4 border-t border-violet-800/20 text-center text-violet-400/50 text-sm">
      <p>© 2026 PixelCraft. Демо-сайт создан на Help Hand.</p>
    </footer>
  </div>
);

export default DesignDemo;
