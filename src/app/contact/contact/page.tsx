import { Mail, Twitter, Facebook, Linkedin } from 'lucide-react';
import { socialLinks } from '@/lib/social-config';

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Contactez-nous</h1>
      
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Par email</h2>
          <a 
            href={`mailto:${socialLinks.email}`}
            className="text-lg text-primary hover:underline flex items-center gap-2"
          >
            <Mail className="h-5 w-5" />
            {socialLinks.email}
          </a>
          <p className="mt-4 text-muted-foreground">
            Nous répondons généralement sous 48 heures.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Sur les réseaux sociaux</h2>
          <div className="space-y-3">
            <a 
              href={socialLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Twitter className="h-5 w-5" />
              Twitter
            </a>
            <a 
              href={socialLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Facebook className="h-5 w-5" />
              Facebook
            </a>
            <a 
              href={socialLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Linkedin className="h-5 w-5" />
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}