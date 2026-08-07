import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TypeClient } from '../../model/typeclient';
import { TypeClientService } from '../../service/TypeClient.service';

declare var $: any;

@Component({
  selector: 'app-type-client',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './type-client.component.html',
  styleUrls: ['./type-client.component.css']
})
export class TypeClientComponent implements OnInit {
  typesClient: TypeClient[] = [];
  selectedTypeClient: TypeClient = { code: '', libelle: '', categorieClient: '' };
  isEditMode = false;
  searchTerm = '';

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  constructor(private typeClientService: TypeClientService) {}

  ngOnInit(): void {
    this.loadTypesClient();
  }

  loadTypesClient(): void {
    this.typeClientService.getAll(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response) => {
          this.typesClient = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des types de client', error);
          this.showToast('Erreur de chargement', 'error');
        }
      });
  }

  openModal(typeClient?: TypeClient): void {
    if (typeClient) {
      this.isEditMode = true;
      this.selectedTypeClient = { ...typeClient };
    } else {
      this.isEditMode = false;
      this.selectedTypeClient = { code: '', libelle: '', categorieClient: '' };
    }
    $('#typeClientModal').modal('show');
  }

  saveTypeClient(): void {
    if (this.isEditMode && this.selectedTypeClient.id) {
      this.typeClientService.update(this.selectedTypeClient.id, this.selectedTypeClient)
        .subscribe({
          next: () => {
            this.loadTypesClient();
            $('#typeClientModal').modal('hide');
            this.showToast('Type de client modifié avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la modification', error);
            this.showToast('Erreur de modification', 'error');
          }
        });
    } else {
      this.typeClientService.create(this.selectedTypeClient)
        .subscribe({
          next: () => {
            this.loadTypesClient();
            $('#typeClientModal').modal('hide');
            this.showToast('Type de client créé avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la création', error);
            this.showToast('Erreur de création', 'error');
          }
        });
    }
  }

  deleteTypeClient(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce type de client ?')) {
      this.typeClientService.delete(id)
        .subscribe({
          next: () => {
            this.loadTypesClient();
            this.showToast('Type de client supprimé avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la suppression', error);
            this.showToast('Erreur de suppression', 'error');
          }
        });
    }
  }

  search(): void {
    this.currentPage = 0;
    this.loadTypesClient();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadTypesClient();
  }

  getPagesArray(): number[] {
    return Array(this.totalPages).fill(0).map((x, i) => i);
  }

  showToast(message: string, type: string): void {
    $(document).Toasts('create', {
      title: type === 'success' ? 'Succès' : 'Erreur',
      body: message,
      class: type === 'success' ? 'bg-success' : 'bg-danger',
      autohide: true,
      delay: 3000
    });
  }
}
