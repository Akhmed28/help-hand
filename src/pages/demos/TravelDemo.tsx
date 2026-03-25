import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Heart, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const articles = [
  { title: "Исландия: огонь и лёд", date: "15 фев 2026", img: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=500&h=350&fit=crop", tag: "Европа" },
  { title: "Бали за 7 дней", date: "28 янв 2026", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=500&h=350&fit=crop", tag: "Азия" },
  { title: "Грузия: горы и вино", date: "10 янв 2026", img: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=500&h=350&fit=crop", tag: "Кавказ" },
  { title: "Норвежские фьорды", date: "20 дек 2025", img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=350&fit=crop", tag: "Европа" },
];

const routes = [
  { name: "Золотое кольцо Исландии", days: "10 дней", difficulty: "Средний" },
  { name: "Транссибирская магистраль", days: "14 дней", difficulty: "Лёгкий" },
  { name: "Треккинг в Непале", days: "21 день", difficulty: "Сложный" },
  { name: "Camino de Santiago", days: "30 дней", difficulty: "Средний" },
];

const gallery = [
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=400&h=300&fit=crop",
];

const fade = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

const TravelDemo = () => (
  <div className="min-h-screen bg-orange-950 text-orange-50">
    <nav className="fixed top-0 w-full z-50 bg-orange-950/80 backdrop-blur-xl border-b border-orange-800/20">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/#gallery" className="flex items-center gap-2 text-orange-300 hover:text-orange-100 transition-colors">
          <ArrowLeft className="w-4 h-4" /><span className="text-sm">Назад</span>
        </Link>
        <span className="text-xl font-bold tracking-tight text-orange-300">🌍 WanderLog</span>
        <div className="flex gap-6 text-sm text-orange-400">
          <a href="#articles" className="hover:text-orange-200 transition-colors">Статьи</a>
          <a href="#routes" className="hover:text-orange-200 transition-colors">Маршруты</a>
          <a href="#gallery" className="hover:text-orange-200 transition-colors">Фото</a>
        </div>
      </div>
    </nav>

    {/* Hero */}
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&h=900&fit=crop" alt="Travel" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-orange-950/60 via-orange-950/40 to-orange-950" />
      </div>
      <motion.div {...fade} className="relative text-center w-full px-4 max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-8xl font-bold mb-6 tracking-tight">Открывай<br /><span className="text-orange-400">мир</span></h1>
        <p className="text-xl text-orange-200/80 mb-8">Истории, маршруты и фотографии из путешествий по всему свету</p>
      </motion.div>
    </section>

    {/* Articles */}
    <section id="articles" className="py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.h2 {...fade} className="text-3xl md:text-5xl font-bold text-center mb-16">Последние статьи</motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {articles.map((a, i) => (
            <motion.div key={a.title} {...fade} transition={{ delay: i * 0.1 }}
              className="bg-orange-900/30 border border-orange-800/20 rounded-2xl overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform">
              <div className="h-52 overflow-hidden relative">
                <img src={a.img} alt={a.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute top-3 left-3 bg-orange-500/90 text-white text-xs font-bold px-3 py-1 rounded-full">{a.tag}</span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-orange-400/60 text-sm mb-2"><Calendar className="w-3 h-3" />{a.date}</div>
                <h3 className="font-semibold text-lg">{a.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Routes */}
    <section id="routes" className="py-24 px-4 bg-orange-900/20">
      <div className="container mx-auto max-w-3xl">
        <motion.h2 {...fade} className="text-3xl md:text-5xl font-bold text-center mb-16">Популярные маршруты</motion.h2>
        <div className="space-y-4">
          {routes.map((r, i) => (
            <motion.div key={r.name} {...fade} transition={{ delay: i * 0.1 }}
              className="bg-orange-900/30 border border-orange-800/20 rounded-xl p-5 flex items-center justify-between hover:border-orange-500/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-orange-400" />
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-orange-300/50 text-sm">{r.days}</div>
                </div>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-orange-500/15 text-orange-400">{r.difficulty}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Gallery */}
    <section id="gallery" className="py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.h2 {...fade} className="text-3xl md:text-5xl font-bold text-center mb-16">Фотографии</motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {gallery.map((g, i) => (
            <motion.div key={i} {...fade} transition={{ delay: i * 0.08 }} className="rounded-xl overflow-hidden">
              <img src={g} alt={`Travel ${i+1}`} className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Subscribe */}
    <section className="py-24 px-4 bg-orange-900/20">
      <div className="container mx-auto max-w-md text-center">
        <motion.h2 {...fade} className="text-2xl font-bold mb-4">Подпишитесь на рассылку</motion.h2>
        <motion.p {...fade} className="text-orange-300/60 mb-6">Новые статьи и маршруты прямо на почту</motion.p>
        <motion.div {...fade} className="flex gap-2">
          <input type="email" placeholder="Ваш email" className="flex-1 bg-orange-900/40 border border-orange-800/30 rounded-xl px-4 py-3 text-orange-50 placeholder:text-orange-400/40 focus:outline-none focus:border-orange-500" />
          <Button className="bg-orange-500 hover:bg-orange-400 text-orange-950 font-bold rounded-xl px-6"><Send className="w-4 h-4" /></Button>
        </motion.div>
      </div>
    </section>

    <footer className="py-12 px-4 border-t border-orange-800/20 text-center text-orange-400/50 text-sm">
      <p>© 2026 WanderLog. Демо-сайт создан на Help Hand.</p>
    </footer>
  </div>
);

export default TravelDemo;
