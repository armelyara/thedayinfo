// src/components/layout/footer.tsx
import Link from 'next/link';
import { Mail, Facebook, Twitter, Linkedin, Github } from 'lucide-react';
import { socialLinks, legalLinks } from '@/lib/social-config';
import { SubscriptionModal } from '@/components/newsletter/subscription-modal';

export function Footer() {
  return (
    <footer className="border-t bg-muted/50 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-2">The Day Info</h3>
            <p className="text-sm text-muted-foreground">
              Résoudre des problèmes par la technologie. Promoteur du dev.
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              © {new Date().getFullYear()} Tous droits réservés.
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-foreground hover:text-primary transition-colors">Accueil</Link></li>
              <li><Link href="/projets" className="text-foreground hover:text-primary transition-colors">Projets</Link></li>
              <li><Link href="/blog" className="text-foreground hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="/about" className="text-foreground hover:text-primary transition-colors">À propos</Link></li>
            </ul>
          </div>

          {/* Légal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Légal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={legalLinks.mentionsLegales} className="text-foreground hover:text-primary transition-colors">Mentions légales</Link></li>
              <li><Link href={legalLinks.politiqueConfidentialite} className="text-foreground hover:text-primary transition-colors">Politique de confidentialité</Link></li>
              <li><Link href={legalLinks.contact} className="text-foreground hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Suivez-nous & Newsletter */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Contact & Newsletter</h3>
             <div className="flex gap-4">
              <a href={`mailto:${socialLinks.email}`} className="text-muted-foreground hover:text-foreground" aria-label="Email"><Mail className="h-5 w-5" /></a>
              <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Twitter"><Twitter className="h-5 w-5" /></a>
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Facebook"><Facebook className="h-5 w-5" /></a>
              <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="LinkedIn"><Linkedin className="h-5 w-5" /></a>
              <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="GitHub"><Github className="h-5 w-5" /></a>
            </div>
            <p className="text-xs text-muted-foreground">Abonnez-vous pour recevoir les dernières nouvelles.</p>
            <SubscriptionModal />
          </div>
        </div>
      </div>
    </footer>
  );
}
