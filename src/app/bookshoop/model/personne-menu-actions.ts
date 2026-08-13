/**
 * Une ligne de la matrice Menu x Action effective pour un utilisateur precis
 * (Profil + exceptions, voir PersonnePermissionController cote backend).
 */
export interface PersonneMenuActions {
  menuId: number;
  menuCode: string;
  menuDescription: string;
  moduleId: number;
  moduleCode: string;
  moduleDescription: string;
  actionsEffectives: string[];
  actionsHeritees: string[];
  actionsExceptionAjoutees: string[];
  actionsExceptionRetirees: string[];
}
