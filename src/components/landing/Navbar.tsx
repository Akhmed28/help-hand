import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Примеры", href: "#gallery" },
  { label: "Тарифы", href: "#pricing" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-white/5">
      <nav className="container mx-auto flex items-center justify-between h-14 md:h-18 py-3 md:py-5 px-4">
        <a href="#" className="text-lg md:text-xl font-bold tracking-tight">
          Help <span className="text-primary">Hand</span>
        </a>

        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-[-4px] after:left-0 after:bg-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
            >
              {l.label}
            </a>
          ))}
          <Button
            onClick={() => navigate("/editor")}
            className="btn-premium rounded-full px-6 text-primary-foreground"
          >
            Начать <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <div className="flex md:hidden items-center gap-3">
          <Button
            onClick={() => navigate("/editor")}
            size="sm"
            className="btn-premium rounded-full px-4 text-primary-foreground text-xs"
          >
            Начать
          </Button>
          <button className="text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/80 backdrop-blur-2xl border-t border-white/5 overflow-hidden"
          >
            <div className="flex flex-col gap-4 p-6">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileOpen(false)}>
                  {l.label}
                </a>
              ))}
              <Button
                onClick={() => { setMobileOpen(false); navigate("/editor"); }}
                className="btn-premium rounded-full mt-2 text-primary-foreground w-full"
              >
                Начать создавать сайт <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
