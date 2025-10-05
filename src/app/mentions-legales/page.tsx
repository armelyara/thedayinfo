export default function MentionsLegalesPage() {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Mentions Légales</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>Éditeur du site</h2>
          <p>
            <strong>Nom :</strong> The Day Info<br />
            <strong>Responsable de publication :</strong> Armel Yara<br />
            <strong>Email :</strong> armelyara@thedayinfo.com
          </p>
  
          <h2>Hébergement</h2>
          <p>
            <strong>Hébergeur :</strong> Firebase App Hosting (Google LLC)<br />
            <strong>Adresse :</strong> 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA
          </p>
  
          <h2>Propriété intellectuelle</h2>
          <p>
            L'ensemble du contenu de ce site (textes, images, vidéos) est protégé par le droit d'auteur.
            Toute reproduction, même partielle, est interdite sans autorisation préalable.
          </p>
        </div>
      </div>
    );
  }