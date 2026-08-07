import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { 
  FormBuilder, 
  FormGroup, 
  FormsModule, 
  ReactiveFormsModule, 
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { ClientService } from '../../service/client.service';
import { ToastrService } from 'ngx-toastr';

import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbModalModule
  ],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientFormComponent implements OnInit, OnDestroy {
  clientForm!: FormGroup;
  isEditing = false;
  chargement = false;
  clientId: number | null = null;
  formCompletion = 0;
  errorsCount = 0;
  
  private destroy$ = new Subject<void>();

  private validationMessages = {
    code: {
      required: 'Code requis et unique',
      pattern: 'Code invalide'
    },
    nom: {
      required: 'Nom requis',
      minlength: 'Minimum 3 caractères'
    },
    email: {
      required: 'Email requis',
      email: 'Format email invalide'
    },
    telephone: {
      required: 'Téléphone requis',
      pattern: 'Format téléphone invalide'
    },
    adresse: {
      required: 'Adresse requise',
      minlength: 'Minimum 5 caractères'
    },
    ville: {
      required: 'Ville requise'
    },
    region: {
      required: 'Région requise'
    }
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService,
    private toastr: ToastrService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.detectEditMode();
    
    // Mettre à jour le compteur d'erreurs en temps réel
    this.clientForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateErrorsCount();
        this.updateFormCompletion();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.clientForm = this.fb.group({
      code: [
        '',
        [Validators.required],
        [this.codeUniqueValidator.bind(this)]
      ],
      nom: [
        '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(100)]
      ],
      email: [
        '',
        [Validators.required, Validators.email]
      ],
      telephone: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[\d\s\+\-\(\)]{8,}$/)
        ]
      ],
      fax: ['', [Validators.pattern(/^[\d\s\+\-\(\)]*$/)]],
      adresse: [
        '',
        [Validators.required, Validators.minLength(5), Validators.maxLength(200)]
      ],
      quartier: ['', [Validators.maxLength(50)]],
      ville: [
        '',
        [Validators.required, Validators.minLength(2)]
      ],
      region: [
        '',
        [Validators.required, Validators.minLength(2)]
      ],
      bp: ['', [Validators.maxLength(20)]],
      indicatifPays: ['', [Validators.pattern(/^\+?[\d]{1,5}$/)]],
      statut: ['ACTIF', [Validators.required]],
      fidelite: [false]
    });
  }

  private detectEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== '0') {
      this.clientId = +id;
      this.isEditing = true;
      this.loadClient(this.clientId);
    }
  }

  private loadClient(id: number): void {
    this.chargement = true;
    this.clientService.getClientById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (client) => {
          this.clientForm.patchValue(client);
          this.clientForm.get('code')?.disable();
          this.updateFormCompletion();
          this.chargement = false;
        },
        error: (error) => {
          this.toastr.error('Erreur lors du chargement du client');
          this.chargement = false;
          this.retour();
        }
      });
  }

  private codeUniqueValidator(control: AbstractControl): Promise<ValidationErrors | null> {
    if (!control.value) {
      return Promise.resolve(null);
    }

    if (this.isEditing) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      this.clientService.searchClients(control.value)
        .pipe(
          debounceTime(300),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (clients) => {
            resolve(clients.length > 0 ? { codeExists: true } : null);
          },
          error: () => resolve(null)
        });
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.clientForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.clientForm.get(fieldName);
    return !!(field && field.valid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.clientForm.get(fieldName);
    if (!control || !control.errors) {
      return '';
    }

    const errors = control.errors;
    const messages = this.validationMessages[fieldName as keyof typeof this.validationMessages] || {};

    for (const errorKey in errors) {
      if (messages[errorKey as keyof typeof messages]) {
        return messages[errorKey as keyof typeof messages];
      }
    }

    return 'Champ invalide';
  }

  updateErrorsCount(): void {
    let count = 0;
    Object.keys(this.clientForm.controls).forEach(key => {
      const control = this.clientForm.get(key);
      if (control?.invalid && (control.dirty || control.touched)) {
        count++;
      }
    });
    this.errorsCount = count;
  }

  updateFormCompletion(): void {
    const total = Object.keys(this.clientForm.controls).length;
    let filled = 0;

    Object.keys(this.clientForm.controls).forEach(key => {
      const control = this.clientForm.get(key);
      if (control?.value && control.value !== '') {
        filled++;
      }
    });

    this.formCompletion = Math.round((filled / total) * 100);
  }

  getFormErrors(): string[] {
    const errors: string[] = [];
    
    Object.keys(this.clientForm.controls).forEach(fieldName => {
      const control = this.clientForm.get(fieldName);
      if (control?.invalid && (control.dirty || control.touched)) {
        errors.push(`${fieldName}: ${this.getErrorMessage(fieldName)}`);
      }
    });

    return errors;
  }

  sauvegarder(): void {
    if (!this.clientForm.valid) {
      this.toastr.error('Veuillez corriger les erreurs du formulaire');
      this.markFormGroupTouched(this.clientForm);
      return;
    }

    this.chargement = true;
    const clientData = this.clientForm.getRawValue();

    const operation$ = this.isEditing && this.clientId
      ? this.clientService.updateClient(this.clientId, clientData)
      : this.clientService.createClient(clientData);

    operation$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const message = this.isEditing
            ? 'Client mis à jour avec succès'
            : 'Client créé avec succès';
          this.toastr.success(message);
          this.retour();
        },
        error: (error) => {
          this.toastr.error(error?.error?.message || 'Erreur lors de la sauvegarde');
          this.chargement = false;
        }
      });
  }

  resetForm(): void {
    this.clientForm.reset({
      statut: 'ACTIF',
      fidelite: false
    });
    this.markFormGroupPristine(this.clientForm);
    this.formCompletion = 0;
    this.errorsCount = 0;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private markFormGroupPristine(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsPristine();
      control?.markAsUntouched();

      if (control instanceof FormGroup) {
        this.markFormGroupPristine(control);
      }
    });
  }

  retour(): void {
    this.router.navigate(['/clients']);
  }
}