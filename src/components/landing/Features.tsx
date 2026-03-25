import { motion } from "framer-motion";
import { Sparkles, Code, Globe, BarChart3, Users, Download } from "lucide-react";

const features = [
  { icon: Sparkles, title: "ИИ-генерация", desc: "Опишите идею — получите готовый сайт за секунды" },
  { icon: Code, title: "Чистый код", desc: "Экспортируйте HTML/CSS код и используйте где угодно" },
  { icon: Globe, title: "Свой домен", desc: "Подключите собственный домен в один клик" },
  { icon: BarChart3, title: "Аналитика", desc: "Отслеживайте посещаемость и поведение пользователей" },
  { icon: Users, title: "Команда агентов", desc: "4 ИИ-агента работают над вашим сайтом одновременно" },
  { icon: Download, title: "Экспорт проекта", desc: "Скачайте проект как ZIP-архив и разверните на своём хостинге" },
];

const Features = () => (
  <section className="py-16 md:py-32 px-4">
    <div className="container mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10 md:mb-20"
      >
        <h2 className="text-2xl md:text-5xl font-bold mb-4 md:mb-5 tracking-tight">Возможности</h2>
        <p className="text-muted-foreground text-lg">Всё, что нужно для создания идеального сайта</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="glass-card rounded-2xl p-5 md:p-7"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
              <f.icon size={22} className="text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2.5">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
