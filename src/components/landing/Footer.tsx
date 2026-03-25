const columns = [
  {
    title: "Продукт",
    links: [
      { label: "Возможности", href: "#" },
      { label: "Примеры", href: "#gallery" },
      { label: "Тарифы", href: "#pricing" },
    ],
  },
  {
    title: "Компания",
    links: [
      { label: "О нас", href: "#" },
      { label: "Блог", href: "#" },
      { label: "Карьера", href: "#" },
    ],
  },
  {
    title: "Поддержка",
    links: [
      { label: "Документация", href: "#" },
      { label: "Связаться", href: "#" },
      { label: "FAQ", href: "#" },
    ],
  },
];

const Footer = () => (
  <footer className="border-t border-white/5 py-12 md:py-20 px-4">
    <div className="container mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-10 md:mb-14">
        <div className="col-span-2 md:col-span-1">
          <a href="#" className="text-xl font-bold tracking-tight">
            Help <span className="text-primary">Hand</span>
          </a>
          <p className="text-sm text-muted-foreground mt-4 max-w-[220px] leading-relaxed">
            Конструктор сайтов на базе ИИ. Создавайте за секунды.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="font-semibold text-sm mb-5 tracking-wide">{col.title}</h4>
            <ul className="space-y-3">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">© 2026 Help Hand. Все права защищены.</p>
        <div className="flex gap-8 text-xs text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors duration-300">Политика конфиденциальности</a>
          <a href="#" className="hover:text-foreground transition-colors duration-300">Условия использования</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
