import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Compagnie } from '../../model/compagnie';
import { Licence } from '../../model/licence';
import { CreateLicenceRequest } from '../../model/create-licence-request';
import { LicenceSettings } from '../../model/licence-settings';
import { CompagnieService } from '../../service/compagnie.service';
import { LicenceService } from '../../service/licence.service';
import { AuthService } from '../../../auth/auth.service';
import { copyToClipboard as copierDansPressePapiers } from '../../../shared/clipboard.util';

declare var $: any;

// Miroir des labels lisibles pour les codes reels de Modulesecurite (voir
// ModuleLicence.java cote backend) - "photocophie" reflete une coquille
// historique presente en base, conservee intentionnellement.
const MODULE_LABELS: Record<string, string> = {
  securite: 'Sécurité',
  administration: 'Administration',
  stock: 'Stock',
  vente: 'Vente',
  facturation: 'Facturation',
  comptabilite: 'Comptabilité',
  parametrage: 'Paramétrage',
  photocophie: 'Photocopie'
};

@Component({
  selector: 'app-licence',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './licence.component.html',
  styleUrls: ['./licence.component.css']
})
export class LicenceComponent implements OnInit {
  compagnies: Compagnie[] = [];
  loading = false;

  selectedCompagnie: Compagnie | null = null;
  currentLicence: Licence | null = null;
  licenceLoading = false;
  cleGeneree: string | null | undefined = null;

  // Modules applicables a la compagnie selectionnee (dependant de son typeCommerce,
  // voir LicenceService.getModulesDisponibles cote backend) - vide tant qu'aucune
  // compagnie n'est selectionnee.
  moduleOptions: string[] = [];
  form: CreateLicenceRequest = this.emptyForm();

  // Parametres de l'essai gratuit (SUPER_ADMIN uniquement) - catalogue complet,
  // non filtre par compagnie puisque ces parametres sont globaux.
  parametresEssai: LicenceSettings | null = null;
  modulesCatalogue: string[] = [];
  savingParametres = false;

  constructor(
    private compagnieService: CompagnieService,
    private licenceService: LicenceService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadCompagnies();
    if (this.isSuperAdmin) {
      this.loadParametresEssai();
      this.loadModulesCatalogue();
    }
  }

  loadParametresEssai(): void {
    this.licenceService.getParametres().subscribe({
      next: (data) => (this.parametresEssai = data),
      error: (error) => console.error(error)
    });
  }

  loadModulesCatalogue(): void {
    this.licenceService.getModulesCatalogue().subscribe({
      next: (data) => (this.modulesCatalogue = data),
      error: (error) => console.error(error)
    });
  }

  labelModule(code: string): string {
    return MODULE_LABELS[code] ?? code;
  }

  toggleModuleEssai(module: string): void {
    if (!this.parametresEssai) { return; }
    const index = this.parametresEssai.essaiModules.indexOf(module);
    if (index >= 0) {
      this.parametresEssai.essaiModules.splice(index, 1);
    } else {
      this.parametresEssai.essaiModules.push(module);
    }
  }

  enregistrerParametresEssai(): void {
    if (!this.parametresEssai) { return; }
    this.savingParametres = true;
    this.licenceService.updateParametres(this.parametresEssai).subscribe({
      next: (data) => {
        this.parametresEssai = data;
        this.savingParametres = false;
        this.toastr.success("Paramètres de l'essai gratuit enregistrés.");
      },
      error: (error) => {
        this.savingParametres = false;
        this.toastr.error(error?.error?.message || "Erreur lors de l'enregistrement des paramètres.");
      }
    });
  }

  get currentRole(): string | undefined {
    return this.authService.currentUserValue?.usersDTO?.role?.name;
  }

  get isSuperAdmin(): boolean {
    return this.currentRole === 'SUPER_ADMIN';
  }

  loadCompagnies(): void {
    this.loading = true;
    this.compagnieService.getAll().subscribe({
      next: (data) => {
        this.compagnies = data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error('Impossible de charger la liste des compagnies.');
        console.error(error);
      }
    });
  }

  openModal(compagnie: Compagnie): void {
    this.selectedCompagnie = compagnie;
    this.currentLicence = null;
    this.moduleOptions = [];
    this.form = this.emptyForm();
    this.form.compagnieId = compagnie.id!;

    this.licenceService.getModulesDisponibles(compagnie.id!).subscribe({
      next: (modules) => (this.moduleOptions = modules),
      error: () => (this.moduleOptions = [])
    });

    this.licenceLoading = true;
    this.licenceService.getByCompagnie(compagnie.id!).subscribe({
      next: (licence) => {
        this.currentLicence = licence;
        this.licenceLoading = false;
        // Pre-remplit avec les valeurs actuelles : "renouveler" doit permettre
        // d'ajuster (quotas, modules) sans tout ressaisir depuis zero.
        // Normalise/filtre les modules : les licences generees avant l'alignement
        // sur les vrais codes Modulesecurite stockent l'ancien format fictif en
        // majuscules (ex. "VENTE", "CAISSE", "CLIENTS") - on relance en minuscule
        // et on ne garde que ce qui correspond a un module reel, sinon le
        // renouvellement echoue avec "Module de licence inconnu".
        const modulesNormalises = (licence.modules || [])
          .map(m => m.toLowerCase())
          .filter(m => MODULE_LABELS.hasOwnProperty(m));
        this.form = {
          compagnieId: compagnie.id!,
          dateExpiration: licence.dateExpiration ? new Date(licence.dateExpiration) : this.emptyForm().dateExpiration,
          maxUtilisateurs: licence.maxUtilisateurs ?? this.emptyForm().maxUtilisateurs,
          maxBoutiques: licence.maxBoutiques ?? this.emptyForm().maxBoutiques,
          modules: modulesNormalises
        };
      },
      error: () => {
        // Pas de licence existante pour cette compagnie - c'est un etat normal.
        this.currentLicence = null;
        this.licenceLoading = false;
      }
    });

    $('#licenceModal').modal('show');
  }

  toggleModule(module: string): void {
    const index = this.form.modules.indexOf(module);
    if (index >= 0) {
      this.form.modules.splice(index, 1);
    } else {
      this.form.modules.push(module);
    }
  }

  generer(): void {
    if (!this.form.dateExpiration || !this.form.maxUtilisateurs || !this.form.maxBoutiques) {
      this.toastr.warning("La date d'expiration, le nombre max d'utilisateurs et de boutiques sont obligatoires.");
      return;
    }

    this.licenceService.generer(this.form).subscribe({
      next: (licence) => {
        this.currentLicence = licence;
        this.cleGeneree = licence.cle;
        this.loadCompagnies();
        $('#licenceModal').modal('hide');
        $('#cleGenereeModal').modal('show');
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Erreur lors de la generation de la licence.');
        console.error(error);
      }
    });
  }

  resynchroniserModules(): void {
    if (!this.selectedCompagnie) { return; }
    this.compagnieService.resynchroniserModulesAdmin(this.selectedCompagnie.id!).subscribe({
      next: () => this.toastr.success("Modules/menus resynchronises pour l'administrateur de cette compagnie."),
      error: (error) => this.toastr.error(error?.error?.message || 'Erreur lors de la resynchronisation des modules.')
    });
  }

  copierCle(cle: string | null | undefined): void {
    if (!cle) { return; }
    copierDansPressePapiers(cle).then(succes => {
      if (succes) {
        this.toastr.success('Cle copiee dans le presse-papiers.');
      } else {
        this.toastr.error('Copie automatique impossible - selectionnez le texte et copiez-le manuellement.');
      }
    });
  }

  fermerCleGeneree(): void {
    $('#cleGenereeModal').modal('hide');
    if (this.selectedCompagnie) {
      $('#licenceModal').modal('show');
    }
  }

  revoquer(): void {
    if (!this.selectedCompagnie) { return; }
    this.licenceService.revoquer(this.selectedCompagnie.id!).subscribe({
      next: (licence) => {
        this.currentLicence = licence;
        this.toastr.success('Licence revoquee.');
      },
      error: (error) => this.toastr.error(error?.error?.message || 'Erreur lors de la revocation.')
    });
  }

  suspendre(): void {
    if (!this.selectedCompagnie) { return; }
    this.licenceService.suspendre(this.selectedCompagnie.id!).subscribe({
      next: (licence) => {
        this.currentLicence = licence;
        this.toastr.success('Licence suspendue.');
      },
      error: (error) => this.toastr.error(error?.error?.message || 'Erreur lors de la suspension.')
    });
  }

  reactiver(): void {
    if (!this.selectedCompagnie) { return; }
    this.licenceService.reactiver(this.selectedCompagnie.id!).subscribe({
      next: (licence) => {
        this.currentLicence = licence;
        this.toastr.success('Licence reactivee.');
      },
      error: (error) => this.toastr.error(error?.error?.message || 'Erreur lors de la reactivation.')
    });
  }

  private emptyForm(): CreateLicenceRequest {
    return {
      compagnieId: 0,
      dateExpiration: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      maxUtilisateurs: 5,
      maxBoutiques: 1,
      modules: []
    };
  }
}
