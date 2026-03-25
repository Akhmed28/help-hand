import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Phone, Coffee, Cake, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const menu = [
  { name: "Эспрессо", price: "150 ₽", icon: Coffee, desc: "Классический крепкий кофе" },
  { name: "Капучино", price: "250 ₽", icon: Coffee, desc: "С нежной молочной пенкой" },
  { name: "Латте", price: "280 ₽", icon: Coffee, desc: "Мягкий вкус с молоком" },
  { name: "Раф", price: "300 ₽", icon: Coffee, desc: "Сливочный кофейный напиток" },
  { name: "Чизкейк", price: "350 ₽", icon: Cake, desc: "Нью-Йорк стиль" },
  { name: "Круассан", price: "200 ₽", icon: Sun, desc: "Свежая выпечка каждое утро" },
];

const fade = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

const CoffeeDemo = () => (
  <div className="min-h-screen bg-amber-950 text-amber-50">
    {/* Navbar */}
    <nav className="fixed top-0 w-full z-50 bg-amber-950/80 backdrop-blur-xl border-b border-amber-800/30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/#gallery" className="flex items-center gap-2 text-amber-200 hover:text-amber-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Назад</span>
        </Link>
        <span className="text-xl font-bold tracking-tight text-amber-100">☕ Арома</span>
        <div className="flex gap-6 text-sm text-amber-300">
          <a href="#menu" className="hover:text-amber-100 transition-colors">Меню</a>
          <a href="#about" className="hover:text-amber-100 transition-colors">О нас</a>
          <a href="#booking" className="hover:text-amber-100 transition-colors">Бронь</a>
        </div>
      </div>
    </nav>

    {/* Hero */}
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&h=900&fit=crop" alt="Coffee" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/70 via-amber-950/50 to-amber-950" />
      </div>
      <motion.div {...fade} className="relative text-center px-4 max-w-3xl">
        <h1 className="text-5xl md:text-8xl font-bold mb-6 tracking-tight">Кофейня<br /><span className="text-amber-400">Арома</span></h1>
        <p className="text-xl md:text-2xl text-amber-200/80 mb-8">Уютное место для лучшего кофе в городе</p>
        <div className="flex flex-wrap justify-center gap-6 text-amber-300">
          <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> 8:00 – 22:00</span>
          <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> ул. Пушкина, 12</span>
          <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> +7 (999) 123-45-67</span>
        </div>
      </motion.div>
    </section>

    {/* Menu */}
    <section id="menu" className="py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.h2 {...fade} className="text-3xl md:text-5xl font-bold text-center mb-16">Наше меню</motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menu.map((item, i) => (
            <motion.div key={item.name} {...fade} transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-amber-900/40 border border-amber-800/30 rounded-2xl p-6 hover:-translate-y-1 transition-transform">
              <item.icon className="w-8 h-8 text-amber-400 mb-4" />
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <span className="text-amber-400 font-bold">{item.price}</span>
              </div>
              <p className="text-amber-200/60 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* About */}
    <section id="about" className="py-24 px-4 bg-amber-900/20">
      <div className="container mx-auto max-w-5xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div {...fade}>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">О нашей<br />кофейне</h2>
            <p className="text-amber-200/70 text-lg leading-relaxed mb-4">Мы открылись в 2018 году с простой идеей — создать место, где каждая чашка кофе станет маленьким праздником.</p>
            <p className="text-amber-200/70 text-lg leading-relaxed">Наши бариста обжаривают зёрна каждое утро, а выпечку готовят по авторским рецептам из натуральных ингредиентов.</p>
          </motion.div>
          <motion.div {...fade} transition={{ duration: 0.6, delay: 0.2 }}>
            <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop" alt="Interior" className="rounded-3xl shadow-2xl" />
          </motion.div>
        </div>
      </div>
    </section>

    {/* Booking */}
    <section id="booking" className="py-24 px-4">
      <div className="container mx-auto max-w-lg">
        <motion.h2 {...fade} className="text-3xl md:text-5xl font-bold text-center mb-12">Забронировать столик</motion.h2>
        <motion.div {...fade} className="bg-amber-900/40 border border-amber-800/30 rounded-3xl p-8 space-y-4">
          <input type="text" placeholder="Ваше имя" className="w-full bg-amber-900/50 border border-amber-800/40 rounded-xl px-4 py-3 text-amber-50 placeholder:text-amber-400/40 focus:outline-none focus:border-amber-500" />
          <input type="tel" placeholder="Телефон" className="w-full bg-amber-900/50 border border-amber-800/40 rounded-xl px-4 py-3 text-amber-50 placeholder:text-amber-400/40 focus:outline-none focus:border-amber-500" />
          <input type="date" className="w-full bg-amber-900/50 border border-amber-800/40 rounded-xl px-4 py-3 text-amber-50 focus:outline-none focus:border-amber-500" />
          <select className="w-full bg-amber-900/50 border border-amber-800/40 rounded-xl px-4 py-3 text-amber-50 focus:outline-none focus:border-amber-500">
            <option>2 гостя</option><option>3 гостя</option><option>4 гостя</option><option>5+ гостей</option>
          </select>
          <Button className="w-full bg-amber-600 hover:bg-amber-500 text-amber-950 font-bold rounded-xl py-3">Забронировать</Button>
        </motion.div>
      </div>
    </section>

    {/* Footer */}
    <footer className="py-12 px-4 border-t border-amber-800/30 text-center text-amber-400/60 text-sm">
      <p>© 2026 Кофейня Арома. Демо-сайт создан на Help Hand.</p>
    </footer>
  </div>
);

export default CoffeeDemo;
