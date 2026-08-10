import { Injectable } from '@angular/core';
import { BarcodeService } from './barcode.service';

@Injectable({
  providedIn: 'root'
})
export class PrintService {
//afficherLoader!: boolean;
  constructor(private barcodeService:BarcodeService) { }

  /**
   * Imprime le PDF directement via l'API du navigateur
   */
  private async imprimerPDFDirectement(pdfBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Création d'une URL pour le blob
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        // Création d'un iframe invisible pour l'impression
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = pdfUrl;
        
        // Ajout de l'iframe au DOM
        document.body.appendChild(iframe);
        
        // Attendre que le PDF soit chargé puis imprimer
        iframe.onload = () => {
          try {
            // Impression directe via l'iframe
            iframe.contentWindow?.print();
            
            // Nettoyage après impression
            setTimeout(() => {
              document.body.removeChild(iframe);
              URL.revokeObjectURL(pdfUrl);
              resolve();
            }, 1000);
            
          } catch (printError) {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(pdfUrl);
            reject(printError);
          }
        };
        
        // Gestion des erreurs de chargement
        iframe.onerror = () => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(pdfUrl);
          reject(new Error('Erreur lors du chargement du PDF'));
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  
  /**
   * Alternative : Impression avec prévisualisation
   *
   * fenetrePreouverte (optionnel) : fenetre deja ouverte par l'appelant, de
   * facon SYNCHRONE au clic de l'utilisateur (ex. `window.open('', '_blank')`
   * avant un appel HTTP asynchrone). Necessaire car ouvrir la fenetre ICI,
   * apres l'attente reseau qui precede cet appel, se fait bloquer comme
   * popup par la plupart des navigateurs (window.open hors d'un geste
   * utilisateur direct).
   */
  async imprimerAvecPrevisualisation(pdfBlob: Blob, fenetrePreouverte?: Window | null): Promise<void> {
    try {
      this.afficherLoader(true);

      const pdfUrl = URL.createObjectURL(pdfBlob);

      const newWindow = fenetrePreouverte !== undefined ? fenetrePreouverte : window.open(pdfUrl, '_blank');

      if (newWindow) {
        if (fenetrePreouverte !== undefined) {
          newWindow.location.href = pdfUrl;
        }
        // Auto-impression après chargement
        newWindow.addEventListener('load', () => {
          setTimeout(() => {
            newWindow.print();
            URL.revokeObjectURL(pdfUrl);
          }, 500);
        });
      } else {
        throw new Error('Popup bloqué par le navigateur');
      }

    } catch (error) {
      console.error('Erreur lors de l\'impression avec prévisualisation:', error);
      this.afficherNotification('Erreur lors de l\'impression', 'error');
    } finally {
      this.afficherLoader(false);
    }
  }

  /**
   * Impression silencieuse (nécessite des permissions spéciales)
   */
  async impressionSilencieuse(pdfBlob:Blob): Promise<void> {
    try {
      this.afficherLoader(true);
      
      //const pdfBlob = await this.b(venteId);
      
      // Vérification du support de l'API Print
      if ('print' in window) {
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        // Création d'un élément d'impression caché
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.top = '-9999px';
        printFrame.style.left = '-9999px';
        printFrame.src = pdfUrl;
        
        document.body.appendChild(printFrame);
        
        printFrame.onload = () => {
          // Impression automatique
          printFrame.contentWindow?.print();
          
          // Nettoyage
          setTimeout(() => {
            document.body.removeChild(printFrame);
            URL.revokeObjectURL(pdfUrl);
          }, 2000);
        };
      } else {
        throw new Error('Impression non supportée par ce navigateur');
      }
      
    } catch (error) {
      console.error('Erreur impression silencieuse:', error);
      // Fallback vers méthode normale
      //await this.imprimerTicket(venteId);
    } finally {
      this.afficherLoader(false);
    }
  }

  /**
   * Télécharge et imprime directement un ticket
   */
  async imprimerTicket(pdfBlob:Blob): Promise<void> {
    try {
      // Affichage du loader
      this.afficherLoader(true);
      
      // Téléchargement du PDF
     // const pdfBlob = await this.telechargerTicketPDF(venteId);
      
      // Impression directe
      await this.imprimerPDFDirectement(pdfBlob);
      
      // Notification de succès
      this.afficherNotification('Ticket envoyé à l\'imprimante avec succès !', 'success');
      
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      this.afficherNotification('Erreur lors de l\'impression du ticket', 'error');
    } finally {
      this.afficherLoader(false);
    }
  }

  
/**
   * Téléchargement du ticket (pour sauvegarde)
   */
  async telechargerTicket(pdfBlob:Blob, numeroTicket: string): Promise<void> {
    try {
      this.afficherLoader(true);
      
      //const pdfBlob = await this.telechargerTicketPDF(venteId);
      
      // Création du lien de téléchargement
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `ticket-${numeroTicket}.pdf`;
      
      // Déclenchement du téléchargement
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Nettoyage
      URL.revokeObjectURL(downloadUrl);
      
      this.afficherNotification('Ticket téléchargé avec succès !', 'success');
      
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      this.afficherNotification('Erreur lors du téléchargement', 'error');
    } finally {
      this.afficherLoader(false);
    }
  }

  /**
   * Affiche une notification (à adapter selon votre système)
   */
  private afficherNotification(message: string, type: 'success' | 'error' | 'info'): void {
    // Implémentation selon votre système de notification (Toastr, Angular Material, etc.)
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Exemple avec une simple alerte (à remplacer)
    if (type === 'error') {
      alert(`Erreur: ${message}`);
    }
  }
 private afficherLoader(afficher: boolean): void {
    // Implémentation selon votre système de loader
    if (afficher) {
      // Afficher le spinner/loader
      console.log('Chargement en cours...');
    } else {
      // Cacher le spinner/loader
      console.log('Chargement terminé');
    }
  }
  

}
