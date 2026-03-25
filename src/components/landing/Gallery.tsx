import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const projects = [
  {
    title: "Кофейня «Арома»",
    category: "Лендинг",
    color: "from-amber-900/40 to-amber-700/20",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=400&fit=crop",
    description: "Уютный лендинг с онлайн-меню и бронированием столиков",
    link: "/demo/coffee",
  },
  {
    title: "СтройГрупп",
    category: "Бизнес",
    color: "from-slate-800/40 to-slate-600/20",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop",
    description: "Корпоративный сайт строительной компании с портфолио объектов",
    link: "/demo/construction",
  },
  {
    title: "TechStore",
    category: "Магазин",
    color: "from-blue-900/40 to-blue-700/20",
    image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&h=400&fit=crop",
    description: "Интернет-магазин электроники с каталогом и корзиной",
    link: "/demo/techstore",
  },
  {
    title: "Фитнес-клуб",
    category: "Бизнес",
    color: "from-green-900/40 to-green-700/20",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop",
    description: "Сайт фитнес-клуба с расписанием тренировок и абонементами",
    link: "/demo/fitness",
  },
  {
    title: "Блог путешественника",
    category: "Блог",
    color: "from-orange-900/40 to-orange-700/20",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=400&fit=crop",
    description: "Блог с фотографиями и маршрутами путешествий по миру",
    link: "/demo/travel",
  },
  {
    title: "Студия дизайна",
    category: "Агентство",
    color: "from-purple-900/40 to-purple-700/20",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop",
    description: "Портфолио дизайн-студии с кейсами и отзывами клиентов",
    link: "/demo/design",
  },
];

const Gallery = () => (
  <section id="gallery" className="py-16 md:py-32 px-4">
    <div className="container mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10 md:mb-20"
      >
        <h2 className="text-2xl md:text-5xl font-bold mb-4 md:mb-5 tracking-tight">Примеры сайтов</h2>
        <p className="text-muted-foreground text-lg">Созданы на Help Hand за считанные секунды</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p, i) => (
          <Link to={p.link} key={p.title}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group glass-card rounded-3xl overflow-hidden cursor-pointer h-full"
          >
            <div className="h-48 md:h-64 overflow-hidden relative">
              <img
                src={p.image}
                alt={p.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            </div>
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-semibold">{p.title}</span>
                <span className="text-xs px-3 py-1 rounded-full bg-primary/15 text-primary font-medium">{p.category}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
            </div>
          </motion.div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default Gallery;
