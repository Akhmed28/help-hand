import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const reviews = [
  {
    name: "Алмас Бекенов",
    role: "Владелец кофейни",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    text: "Сделал сайт для своей кофейни за 2 минуты. Клиенты теперь бронируют столики онлайн!",
  },
  {
    name: "Динара Касымова",
    role: "Фрилансер-дизайнер",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    text: "Идеальный инструмент для быстрых прототипов. Экспортирую код и дорабатываю в своём редакторе.",
  },
  {
    name: "Тимур Ахметов",
    role: "CEO строительной компании",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    text: "Раньше платили 500 000 ₸ за сайт. Теперь обновляем его сами за минуты. Экономия огромная.",
  },
];

const Testimonials = () => (
  <section className="py-16 md:py-32 px-4">
    <div className="container mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10 md:mb-20"
      >
        <h2 className="text-2xl md:text-5xl font-bold mb-4 md:mb-5 tracking-tight">Отзывы</h2>
        <p className="text-muted-foreground text-lg">Что говорят наши пользователи</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {reviews.map((r, i) => (
          <motion.div
            key={r.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            className="glass-card rounded-2xl p-5 md:p-7 flex flex-col"
          >
            <Quote size={28} className="text-primary/30 mb-5" />
            <p className="text-sm text-muted-foreground flex-1 mb-7 leading-relaxed">{r.text}</p>
            <div className="flex items-center gap-3">
              <img
                src={r.avatar}
                alt={r.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                loading="lazy"
              />
              <div>
                <p className="text-sm font-semibold">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
