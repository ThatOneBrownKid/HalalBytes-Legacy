
import { Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="py-12 border-t">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2">
            <img src="/HB_LOGO.svg" alt="HalalBytes Logo" className="h-8" />
            <span className="font-display font-bold text-foreground">
              HalalBytes
            </span>
          </a>
          <p className="text-muted-foreground text-sm flex items-center gap-1.5">
            © {new Date().getFullYear()} HalalBytes. Made with <Heart className="h-4 w-4 text-red-500" /> for the Muslim community.
          </p>
        </div>
      </div>
    </footer>
  );
};
