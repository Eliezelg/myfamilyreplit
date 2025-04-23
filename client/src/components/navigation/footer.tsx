import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin,
  Heart
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/20 border-t">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Logo and description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-base">
                מ
              </div>
              <h2 className="font-bold text-xl text-primary">MyFamily</h2>
            </div>
            <p className="text-muted-foreground">
              Créez des liens durables entre les générations avec notre plateforme familiale innovante.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-medium text-base mb-4">Liens rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/features">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Fonctionnalités
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/pricing">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Tarifs
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    À propos
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/testimonials">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Témoignages
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Contact
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-medium text-base mb-4">Légal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Politique de confidentialité
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Conditions d'utilisation
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/cookies">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Politique des cookies
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-medium text-base mb-4">Restez informé</h3>
            <p className="text-muted-foreground mb-3">
              Inscrivez-vous à notre newsletter pour recevoir les dernières nouvelles et mises à jour.
            </p>
            <div className="flex gap-2 max-w-xs">
              <Input type="email" placeholder="Votre email" />
              <Button>S'inscrire</Button>
            </div>
          </div>
        </div>

        <div className="border-t mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} MyFamily. Tous droits réservés.
          </p>
          <p className="text-sm text-muted-foreground flex items-center">
            Conçu avec <Heart className="h-4 w-4 mx-1 text-red-500" /> pour toutes les familles
          </p>
        </div>
      </div>
    </footer>
  );
}