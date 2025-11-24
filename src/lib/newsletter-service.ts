
// src/lib/newsletter-service.ts
'use server';

import { Resend } from 'resend';
import type { Article, Subscriber } from './data-types';

const resend = new Resend(process.env.RESEND_API_KEY_NEW);

/**
 * Envoie une notification par email aux abonnés actifs concernant un nouvel article ou une mise à jour.
 * @param article L'objet article concerné.
 * @param allSubscribers La liste de tous les abonnés.
 * @param isUpdate Indique s'il s'agit d'une mise à jour d'un article existant.
 */
export async function sendNewsletterNotification(
  article: Article,
  allSubscribers: Subscriber[],
  isUpdate: boolean = false
) {
  if (!process.env.RESEND_API_KEY_NEW) {
    console.warn("RESEND_API_KEY_NEW non configurée. Impossible d'envoyer la newsletter.");
    return;
  }
  
  if (!article || !article.title || !article.slug) {
    console.error("Données de l'article invalides pour la newsletter.");
    return;
  }
  
  try {
    const activeSubscribers = allSubscribers.filter(sub => sub.status === 'active');

    if (activeSubscribers.length === 0) {
      console.log('Aucun abonné actif. Aucune newsletter envoyée.');
      return;
    }

    const subject = isUpdate 
      ? `📝 Article mis à jour : ${article.title}`
      : `📰 Nouvel article : ${article.title}`;

    const articleUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/article/${article.slug}`;

    // Créer un email personnalisé pour CHAQUE subscriber avec son propre token
    const emailPromises = activeSubscribers.map(subscriber => {
      // Lien de désabonnement unique avec le token du subscriber
      const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${subscriber.unsubscribeToken}`;

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 30px 20px; }
              .article-card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
              .footer { background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
              .footer a { color: #667eea; text-decoration: none; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>🗞️ The Day Info</h1>
              <p>${isUpdate ? 'Un article a été mis à jour' : 'Nouvel article publié'}</p>
          </div>
          
          <div class="content">
              <div class="article-card">
                  <h2 style="margin-top: 0; color: #333;">${article.title}</h2>
                  <p style="color: #666; margin: 10px 0;">
                      ${isUpdate ? '📝 Article mis à jour' : '✨ Nouvel article'} par <strong>${article.author}</strong>
                  </p>
                  <p style="color: #555; line-height: 1.8;">
                      ${isUpdate 
                        ? 'Un article que vous pourriez avoir lu a été mis à jour avec de nouvelles informations.'
                        : 'Un nouvel article vient d\'être publié sur The Day Info.'
                      } 
                      Cliquez sur le lien ci-dessous pour le lire.
                  </p>
                  <a href="${articleUrl}" class="btn">
                      ${isUpdate ? 'Voir les modifications' : 'Lire l\'article'}
                  </a>
              </div>
          </div>
          
          <div class="footer">
              <p>Vous recevez cet email car vous êtes abonné aux notifications de The Day Info.</p>
              <p>
                  <a href="${articleUrl}">Lire sur le site</a> | 
                  <a href="${unsubscribeUrl}">Se désabonner</a>
              </p>
          </div>
      </body>
      </html>`;

      const textContent = `
      ${subject}

      ${isUpdate ? 'Article mis à jour' : 'Nouvel article'} par ${article.author}

      ${isUpdate 
        ? 'Un article que vous pourriez avoir lu a été mis à jour avec de nouvelles informations.'
        : 'Un nouvel article vient d\'être publié sur The Day Info.'
      }

      Lire l'article : ${articleUrl}

      ---
      Vous recevez cet email car vous êtes abonné aux notifications de The Day Info.
      Se désabonner : ${unsubscribeUrl}
      `;

      return resend.emails.send({
        from: 'The Day Info <armelyara@thedayinfo.com>',
        to: subscriber.email,
        subject: subject,
        html: htmlContent,
        text: textContent,
      });
    });

    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    console.log(`Newsletter envoyée: ${successful} succès, ${failed} échecs.`);
    
    return {
      message: `Newsletter envoyée à ${successful} abonnés.`,
      successful,
      failed,
      total: activeSubscribers.length
    };

  } catch (error) {
    console.error('Erreur lors de l\'envoi de la newsletter:', error);
    throw error;
  }
}
