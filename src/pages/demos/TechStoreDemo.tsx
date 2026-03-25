import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Truck, ShieldCheck, Headphones, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

const products = [
  { name: "MacBook Pro 16\"", price: "249 990 ₽", old: "279 990 ₽", img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop", tag: "Хит" },
  { name: "iPhone 16 Pro", price: "129 990 ₽", old: "139 990 ₽", img: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop", tag: "Новинка" },
  { name: "AirPods Pro 3", price: "24 990 ₽", old: null, img: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=300&fit=crop", tag: null },
  { name: "iPad Air M3", price: "79 990 ₽", old: "89 990 ₽", img: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop", tag: "Скидка" },
  { name: "Sony WH-1000XM5", price: "29 990 ₽", old: null, img: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=300&fit=crop", tag: null },
  { name: "Samsung Galaxy S25", price: "89 990 ₽", old: "99 990 ₽", img: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop", tag: "Акция" },
];

const advantages = [
  { icon: Truck, title: "Бесплатная доставка", desc: "По всей России от 5 000 ₽" },
  { icon: ShieldCheck, title: "Гарантия 2 года", desc: "Официальная гарантия на всё" },
  { icon: Headphones, title: "Поддержка 24/7", desc: "Ответим на любые вопросы" },
];

const fade = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

const TechStoreDemo = () => (
  <div className="min-h-screen bg-slate-950 text-slate-50">
    <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-blue-900/20">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/#gallery" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" /><span className="text-sm">Назад</span>
        </Link>
        <span className="text-xl font-bold tracking-tight text-blue-400">⚡ TechStore</span>
        <div className="flex items-center gap-6 text-sm text-slate-400">
          <a href="#catalog" className="hover:text-slate-200 transition-colors">Каталог</a>
          <a href="#sale" className="hover:text-slate-200 transition-colors">Акции</a>
          <ShoppingCart className="w-5 h-5 text-blue-400" />
        </div>
      </div>
    </nav>

    {/* Hero */}
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1600&h=900&fit=crop" alt="Tech" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/40" />
      </div>
      <motion.div {...fade} className="relative container mx-auto px-4 max-w-2xl">
        <div className="inline-block bg-blue-500/20 text-blue-400 text-sm font-medium px-4 py-1 rounded-full mb-6">🔥 Зимняя распродажа — скидки до 30%</div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">Техника<br /><span className="text-blue-400">будущего</span></h1>
        <p className="text-xl text-slate-300 mb-8">Лучшие гаджеты по выгодным ценам с доставкой по всей России</p>
        <Button className="bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl px-8 py-3">Смотреть каталог</Button>
      </motion.div>
    </section>

    {/* Catalog */}
    <section id="catalog" className="py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.h2 {...fade} className="text-3xl md:text-5xl font-bold text-center mb-16">Популярные товары</motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p, i) => (
            <motion.div key={p.name} {...fade} transition={{ delay: i * 0.08 }}
              className="bg-slate-900/60 border border-slate-800/40 rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform group">
              <div className="relative h-52 overflow-hidden bg-slate-800/30">
                <img src={p.img} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                {p.tag && <span className="absolute top-3 left-3 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">{p.tag}</span>}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-lg mb-2">{p.name}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-blue-400">{p.price}</span>
                  {p.old && <span className="text-sm text-slate-500 line-through">{p.old}</span>}
                </div>
                <Button className="w-full mt-4 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl" size="sm">В корзину</Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Advantages */}
    <section className="py-24 px-4 bg-slate-900/30">
      <div className="container mx-auto max-w-4xl">
        <div className="grid md:grid-cols-3 gap-8">
          {advantages.map((a, i) => (
            <motion.div key={a.title} {...fade} transition={{ delay: i * 0.1 }} className="text-center">
              <a.icon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">{a.title}</h3>
              <p className="text-slate-400">{a.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <footer className="py-12 px-4 border-t border-slate-800/30 text-center text-slate-500 text-sm">
      <p>© 2026 TechStore. Демо-сайт создан на Help Hand.</p>
    </footer>
  </div>
);

export default TechStoreDemo;
