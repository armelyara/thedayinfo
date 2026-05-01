export default function PolitiqueConfidentialitePage() {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Politique de Confidentialité</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>Collecte des données</h2>
          <p>
            Nous collectons les données suivantes :
          </p>
          <ul>
            <li><strong>Email</strong> : Pour la newsletter (optionnel)</li>
            <li><strong>Commentaires</strong> : Nom et commentaire (stockés localement)</li>
            
          </ul>
  
          <h2>Utilisation des données</h2>
          <p>
            Vos données sont utilisées uniquement pour :
          </p>
          <ul>
            <li>Vous envoyer la newsletter si vous êtes abonné</li>
            <li>Afficher vos commentaires sur les articles</li>
            
          </ul>
  
          <h2>Vos droits</h2>
          <p>
            Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression
            de vos données. Contactez-nous à : <strong>armelyara@thedayinfo.com</strong>
          </p>
  
          <h2>Cookies</h2>
          <p>
            Aucun cookie de tracking tiers n'est utilisé.
          </p>
        </div>
      </div>
    );
  }