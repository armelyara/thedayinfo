// src/components/layout/footer.tsx
import Link from 'next/link';
import { Mail, Facebook, Twitter, Linkedin, Github } from 'lucide-react';
import { socialLinks, siteInfo, legalLinks } from '@/lib/social-config';

export function Footer() {
  return (
    <footer className="border-t bg-muted/50 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Accueil
                </Link>
              </li>
              <li>
                <Link 
                  href="/about" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  À propos
                </Link>
              </li>
              <li>
                <Link 
                  href="/category/technologie" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Catégories
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Légal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href={legalLinks.mentionsLegales} 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link 
                  href={legalLinks.politiqueConfidentialite} 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link 
                  href={legalLinks.contact} 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Suivez-nous */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Suivez-nous</h3>
            <div className="flex gap-4">
              {/* Email */}
              <a
                href={`mailto:${socialLinks.email}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Envoyer un email"
                title={socialLinks.email}
              >
                <Mail className="h-5 w-5" />
              </a>

              {/* Twitter */}
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Suivre sur Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>

              {/* Facebook */}
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Suivre sur Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>

              {/* LinkedIn */}
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Suivre sur LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>

              {/* GitHub */}
              <a
                href={socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Voir le code sur GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Recevez nos derniers articles par email
            </p>
          </div>
        </div>

        {/* Copyright section supprimée - Maintenant dans la sidebar */}
      </div>
    </footer>
  );
}