import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { ConfirmationService } from 'primeng/api';
import { User } from '../../bookshoop/model/user';
import { Profil } from '../../bookshoop/model/profil';
import { Module } from '../../bookshoop/model/module';
import { IndicatifPays } from '../../bookshoop/model/indicatif-pays';
import { CommonModule } from '@angular/common';
import { UserService } from '../../bookshoop/service/user-service.service';
import { Role } from '../../bookshoop/model/role';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ContentHeaderComponent } from '../../content-header/content-header.component';
import { PickListModule } from 'primeng/picklist';
import { data } from 'jquery';
import { UserSession } from '../../model/user-session';
import { Boutique } from '../../bookshoop/model/boutique';
import { ReferenceDataService } from '../../bookshoop/service/reference-data.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PickListModule,
    ReactiveFormsModule,
    ToastrModule,
    NgbPaginationModule,
    ContentHeaderComponent
  ],
  providers: [],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  // Données
  users: User[] = [];
  filteredUsers: User[] = [];
  roles: Role[] = [];
  profils: Profil[] = [];
  modules: Module[] = [];
  indicatifs: IndicatifPays[] = [];

  // États
  loading = false;
  selectedUser: User | null = null;
  isEditMode = false;
  activeTab = 'userData';

  // Formulaires
  userForm!: FormGroup;
  passwordForm!: FormGroup;
  searchForm!: FormGroup;

  // Modules et Menus - Optimisé pour p-picklist
  availableModules: Module[] = [];
  selectedModules: Module[] = [];
  userModules: Module[] = [];

  selectedModuleForMenus: Module | null = null;
  availableMenus: any[] = [];
  selectedMenus: any[] = [];

  // Pagination et tri
  currentPage = 1;
  pageSize = 15;
  totalRecords = 0;
  sortField = '';
  sortOrder = 1;

  // Modales
  showUserModal = false;
  showPasswordModal = false;
  showDeleteModal = false;
  showPasswordChangeDialog = false;
  currentUser!: User;
  boutiques!: Boutique[];

  // Colonnes du tableau
  cols = [
    { field: 'matricule', header: 'Login', sortable: true, filterable: true },
    { field: 'nom', header: 'Nom', sortable: true, filterable: true },
    { field: 'prenom', header: 'Prénom', sortable: true, filterable: true },
    { field: 'compteActif', header: 'Actif', sortable: false, filterable: false }
  ];

  pageTitle: string = 'Utilisateurs';
  breadcrumbItems = [
    { label: 'Home', route: '/dashboard' },
    { label: 'Utilisateurs', active: true }
  ];
  private destroyRef = inject(DestroyRef);

  // Initialiser le signal avec une valeur par défaut
  private currentUserSignal = signal<User | null>(null);

  // Computed avec vérification de sécurité
  currentUserName?: string
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private toastr: ToastrService,
    private confirmationService: ConfirmationService,
    private authService: AuthService, private referenceDataService: ReferenceDataService
  ) {
    this.initForms();
  }

  ngOnInit(): void {

    this.loadInitialData();




  }




  private subscribeToUserChanges(): void {
    // S'abonner aux changements du service
    this.authService.currentUser$.subscribe({
      next: (userSession) => {
        if (userSession?.usersDTO) {
          this.currentUserSignal.set(userSession.usersDTO);
          console.log('Signal mis à jour depuis observable:', userSession.usersDTO);
        }
      },
      error: (error) => {
        console.error('Erreur dans l\'observable:', error);
        this.currentUserSignal.set(null);
      }
    });
  }


  private initForms(): void {
    this.userForm = this.fb.group({
      userName: ['', [Validators.required]],
      nom: ['', [Validators.required]],
      prenom: [''],
      email: ['', [Validators.email, Validators.required]],
      telephone: [''],
      indicatifPays: [this.indicatifs[0]?.indicatif],
      codepays: [+237],
      compteActif: [true],
      autorisationDeletes: [false],
      role: [null],
      boutiqueid: [null],
      roleid: [null, [Validators.required]],
      profilid: [null, [Validators.required]],
      passwordNew: ['', [Validators.required, Validators.minLength(6)]],
      confirmPasswordNew: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidatorNew });

    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.searchForm = this.fb.group({
      globalFilter: ['']
    });


  }

  private passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  private passwordMatchValidatorNew(form: AbstractControl): ValidationErrors | null {
    const password = form.get('passwordNew')?.value;
    const confirmPassword = form.get('confirmPasswordNew')?.value;
    return password === confirmPassword ? null : { passwordMismatchNew: true };
  }

  private async loadInitialData(): Promise<void> {
    this.loading = true;
    try {
      const [users, roles, profils, modules, indicatifs, boutiques] = await Promise.all([
        this.userService.getUsers().toPromise(),
        this.userService.getRoles().toPromise(),
        this.userService.getProfils().toPromise(),
        this.userService.getModules().toPromise(),
        this.userService.getIndicatifsPays().toPromise(),
        this.referenceDataService.getBoutiques().toPromise()
      ]);

      this.users = users || [];
      this.filteredUsers = [...this.users];
      this.roles = roles || [];
      this.profils = profils || [];
      this.modules = modules || [];
      this.indicatifs = indicatifs || [];
      this.boutiques = boutiques || [];
      this.totalRecords = this.users.length;

      // Initialiser la liste des modules disponibles
      this.availableModules = [...this.modules];
      this.selectedModules = [];
      this.authService.currentUser$.subscribe(user => {
        if (user?.usersDTO) {
          this.currentUser = user.usersDTO;
        }
      });
      //console.log("dans le chargement "+ this.currentUser)
      //console.log("dans le stockrage "+ this.authService.getUserFromStorage)
    } catch (error) {
      this.toastr.error('Erreur lors du chargement des données');
      console.error('Erreur:', error);
    } finally {
      this.loading = false;
    }

  }

  // Gestion des utilisateurs
  openCreateModal(): void {
    this.selectedUser = null;
    this.isEditMode = false;
    this.userForm.reset();
    this.userForm.get('compteActif')?.setValue(true);
    this.resetModuleLists();
    this.showUserModal = true;
  }
  updateUser(user: User) {
    //console.log(user);
    // if(user){
    //this.selectedUser = user;
    //}

    this.isEditMode = true;
    // this.populateForm(user);
    this.chargeValueForm(user);
    this.showPasswordChangeDialog = true;
  }

openEditModal(user: User): void {
  console.log("boutique user", user.boutiqueid);
  this.selectedUser = user;
  this.isEditMode = true;
  this.populateForm(user);
  
  // Définir la boutique après que le formulaire soit populé
  const boutique = this.checkBoutique(user.boutiqueid ?? 0);
  console.log("boutique check", boutique);
  this.userForm.get('boutiqueid')?.setValue(boutique);

  if (user.id) {
    this.loadUserModules(user.id);
  }

  this.showPasswordChangeDialog = false;
  this.showUserModal = false;
}

  private populateForm(user: User): void {
    this.userForm.patchValue({
      userName: user.userName,
      nom: user.firstName,
      prenom: user.lastname,
      email: user?.email,
      telephone: user?.tel,
      indicatifPays: "+237",
      codepays: "+237",
      compteActif: user.isActive,
      autorisationDeletes: user.autorisationDeletes,
      roleid: user.role?.id,
      //role: user.role,
      profilid: user.profil?.id,
      boutiqueid: null

    });

    console.log('Formulaire populé avec:', this.userForm.value);

    // Gestion séparée des champs select pour un meilleur contrôle

    // Indicatif pays
    this.userForm.get('codepays')?.setValue(this.indicatifs[1]);

    // Profil - vérifier que la valeur existe dans les options
    // if (user.profil) {
    // console.log('Profil à assigner:', user.profil);
    //this.userForm.get('profilid')?.setValue(user.profil.id);
    // }

    // Rôle - vérifier que la valeur existe dans les options
    if (user.role) {
      console.log('Rôle à assigner:', user.role);
      this.userForm.get('role')?.setValue(user.role.id);
    }

    // Debug pour vérifier les valeurs assignées
    console.log('Valeurs du formulaire après population:', this.userForm.value);
  }

  onPasswordChangeChoice(changePassword: boolean): void {
    this.showPasswordChangeDialog = false;
    if (changePassword) {
      this.showPasswordModal = true;
    } else {
      //this.updateUserWithoutPassword();
    }
    //this.showUserModal = true;
  }

  checkBoutique(boutiqueid: number): Boutique | null {
  const result = this.boutiques.find(f => f.id === boutiqueid);
  console.log("boutique check", result);
  return result || null;
}
  async chargeValueForm(user: User): Promise<void> {

    const formValue = this.userForm.value;
     console.log("valeur affecter", formValue);
    const userData: User = {
      userName: formValue.userName,
      firstName: formValue.nom,
      lastname: formValue.prenom,
      isActive: formValue.compteActif,
      autorisationDeletes: formValue.autorisationDeletes,
      email: formValue.email,
      tel: formValue.telephone,
      indicatifPays: formValue.indicatifPays,
      codepays: "+237",
      roleid: formValue.roleid,
      profilid: formValue.profilid,
      id: user.id,
      boutiqueid: formValue.boutiqueid.id,
      boutique: formValue.boutiqueid,
    };
    this.selectedUser = userData;
    console.log("mise ajour")
    console.log(this.selectedUser)
  }

  async onSubmit(): Promise<void> {

    if (this.userForm.invalid) {
      this.markFormGroupTouched(this.userForm);
      return;
    }
 console.log(this.userForm.value);
    const formValue = this.userForm.value;
    const userData: User = {
      userName: formValue.userName,
      firstName: formValue.nom,
      lastname: formValue.prenom,
      isActive: formValue.compteActif,
      autorisationDeletes: formValue.autorisationDeletes,
      email: formValue.email,
      tel: formValue.telephone,
      indicatifPays: formValue.indicatifPays,
      codepays: formValue.indicatifPays,
      roleid: formValue.role?.id || formValue.roleid,
      profilid: formValue.profilid,
      boutique: formValue.boutique
    };

    try {
      if (this.isEditMode && this.selectedUser?.id) {
        userData.id = this.selectedUser.id;
        await this.userService.updateUser(userData).toPromise();
        this.toastr.success('Utilisateur modifié avec succès');
      } else {
        userData.password = this.userForm.get('passwordNew')?.value;
        await this.userService.createUser(userData).toPromise();
        this.toastr.success('Utilisateur créé avec succès');
      }

      this.closeModal();
      this.loadInitialData();
    } catch (error: unknown) {
      this.handleError(error, 'Erreur lors de la sauvegarde');
    }
  }

  async updateWithChangePassWord(): Promise<void> {
    this.showPasswordChangeDialog = false;
    this.showPasswordModal = false;
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    const formValue = this.userForm.value;
    const userData: User = {
      userName: formValue.userName,
      firstName: formValue.nom,
      lastname: formValue.prenom,
      isActive: formValue.compteActif,
      autorisationDeletes: formValue.autorisationDeletes,
      email: formValue.email,
      tel: formValue.telephone,
      indicatifPays: formValue.indicatifPays,
      codepays: formValue.indicatifPays,
      roleid: formValue.role?.id || formValue.roleid,
      profilid: formValue.profilid,
      boutiqueid: formValue.boutiqueid,
            boutique:formValue.boutique
    };

    try {
      if (this.isEditMode && this.selectedUser?.id) {
        userData.id = this.selectedUser.id;
        userData.password = this.passwordForm.get('password')?.value;
        await this.userService.updateUserDataAndPassWord(userData).toPromise();
        this.toastr.success('Utilisateur modifié avec succès');
      }
      /** else {
       
        await this.userService.createUser(userData).toPromise();
        this.toastr.success('Utilisateur créé avec succès');
      }*/

      this.closeModal();
      this.loadInitialData();
    } catch (error: unknown) {
      this.handleError(error, 'Erreur lors de la sauvegarde');
    }
  }

  async updateUserWithoutPassword(): Promise<void> {
    if (!this.selectedUser) return;
    this.showPasswordChangeDialog = false;
    try {
      await this.userService.updateUser(this.selectedUser).toPromise();
      this.toastr.success('Utilisateur modifié avec succès');
      this.loadInitialData();
    } catch (error) {
      this.handleError(error, 'Erreur lors de la modification');
    }
  }

  confirmDelete(user: User): void {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  async deleteUser(): Promise<void> {
    if (!this.selectedUser) return;

    try {
      await this.userService.deleteUser(this.selectedUser.userName).toPromise();
      this.toastr.success('Utilisateur supprimé avec succès');
      this.showDeleteModal = false;
      this.loadInitialData();
    } catch (error) {
      this.handleError(error, 'Erreur lors de la suppression');
    }
  }

  // Gestion des modules - Optimisée pour p-picklist
  private async loadUserModules(userId: number): Promise<void> {
    try {
      const userModules = await this.userService.getUserModules(userId).toPromise();
      console.log(userModules);
      this.userModules = userModules ?? [];
      this.selectedModules = this.userModules;
      this.updateModuleLists(userId);

      console.log("module user selected ")
      console.log(this.selectedModules)

    } catch (error) {
      this.toastr.error('Erreur lors du chargement des modules utilisateur');
      console.error('Chargement des modules échoué:', error);
    }
  }

  private updateModuleLists(userid: number): void {
    this.userService.getModulesNotUser(userid).subscribe({
      next: (data: Module[]) => {
        this.availableModules = data ?? [];
        console.log("module user not  selected ")
        console.log(this.availableModules)
      },
      error: err => {
        console.log(err);
        // this.erroMessage = err.message;
        // this.messageService.add({ severity: 'error', summary: 'ERROR LOGIN', detail: this.erroMessage });
      }
    });
    //const userModuleIds = this.userModules.map(m => m.id);

    // Séparer les modules entre disponibles et sélectionnés
    // this.selectedModules = this.userModules.filter(module =>
    // userModuleIds.includes(module.id)
    //);

    //this.availableModules = this.modules.filter(module =>
    //!userModuleIds.includes(module.id)
    //);
  }

  private resetModuleLists(): void {
    this.availableModules = [...this.modules];
    this.selectedModules = [];
    this.userModules = [];
  }

  async saveUserModules(): Promise<void> {

    if (!this.selectedUser?.id) {
      this.toastr.warning('Aucun utilisateur sélectionné');
      return;
    }




    try {


      const user = this.userService.getUserConnected();
      if (!user) {
        return;
      }
      //this.currentUser=user 
      //console.log(user.username);
      //return { username: user.username, roles: user.roles };
      //return this.userAuthenticated;
      user;
      this.userService.updateUserModules(
        this.selectedUser.id,
        user.username,

        this.selectedModules
      ).toPromise();



      this.toastr.success('Modules utilisateur sauvegardés');
      this.userModules = [...this.selectedModules];
    } catch (error) {
      this.handleError(error, 'Erreur lors de la sauvegarde des modules');
    }

  }




  // Gestion des menus
  async onModuleSelectionChange(): Promise<void> {
    if (!this.selectedModuleForMenus || !this.selectedUser?.id) return;

    try {
      const [allMenus, userMenus] = await Promise.all([
        this.userService.getMenusByModule(this.selectedModuleForMenus.id).toPromise(),
        this.userService.getUserMenus(this.selectedUser.id, this.selectedModuleForMenus.id).toPromise()
      ]);

      const userMenuIds = (userMenus || []).map(m => m.id);

      this.availableMenus = (allMenus || []).filter(menu =>
        !userMenuIds.includes(menu.id)
      );

      this.selectedMenus = userMenus || [];
    } catch (error) {
      this.handleError(error, 'Erreur lors du chargement des menus');
    }
  }

  async saveUserMenus(): Promise<void> {
    if (!this.selectedUser?.id || !this.selectedModuleForMenus) {
      this.toastr.warning('Sélection incomplète');
      return;
    }
    const username = this.userService.getUserConnected();
    try {
      await this.userService.updateUserMenus(
        this.selectedUser.id,
        username.username,
        this.selectedModuleForMenus.id,
        this.selectedMenus
      ).toPromise();

      this.toastr.success('Menus utilisateur sauvegardés');
    } catch (error) {
      this.handleError(error, 'Erreur lors de la sauvegarde des menus');
    }
  }

  // Utilitaires
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private handleError(error: unknown, defaultMessage: string): void {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        this.toastr.error("Le serveur est injoignable. Vérifiez qu'il est bien lancé.");
      } else {
        this.toastr.error(defaultMessage + ": " + (error.error?.message || 'inconnue'));
      }
    } else {
      this.toastr.error("Une erreur inattendue est survenue.");
      console.error('Erreur inconnue:', error);
    }
  }

  closeModal(): void {
    this.showUserModal = false;
    this.showPasswordModal = false;
    this.showDeleteModal = false;
    this.selectedUser = null;
    this.userForm.reset();
    this.passwordForm.reset();
    this.resetModuleLists();
  }

  private safeLower(value: string | null | undefined): string {
    return value ? value.toLowerCase() : '';
  }

  onSearch(): void {
    const searchTerm = this.searchForm.get('globalFilter')?.value?.toLowerCase() || '';
    console.log("search", searchTerm);

    this.filteredUsers = !searchTerm ? [...this.users] : this.users.filter(user =>
      this.safeLower(user.userName).includes(searchTerm) ||
      this.safeLower(user.firstName).includes(searchTerm) ||
      this.safeLower(user.lastname).includes(searchTerm)
    );

    this.totalRecords = this.filteredUsers.length;
  }

  refresh(): void {
    this.selectedUser = null;
    this.userForm.reset();
    this.searchForm.reset();
    this.resetModuleLists();
    this.loadInitialData();
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
  }

  trackByFn(index: number, item: User): string {
    return item.userName;
  }

  // Getter pour les validations de formulaire
  get isFormInvalid(): boolean {
    return this.userForm.invalid;
  }

  get passwordMismatch(): boolean {
    return this.userForm.hasError('passwordMismatchNew');
  }

  // Getters pour l'accès aux contrôles de formulaire
  get userName() { return this.userForm.get('userName'); }
  get nom() { return this.userForm.get('nom'); }
  get email() { return this.userForm.get('email'); }
  get role() { return this.userForm.get('role'); }
  get profilid() { return this.userForm.get('profilid'); }
  get passwordNew() { return this.userForm.get('passwordNew'); }
  get confirmPasswordNew() { return this.userForm.get('confirmPasswordNew'); }

  private getUserFromStorage(): User | null {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      // Convertir les dates stockées en chaînes en objets Date
      if (user.expiresAt) {
        user.expiresAt = new Date(user.expiresAt);
      }
      return user.usersDTO;
    }
    return null;
  }




}