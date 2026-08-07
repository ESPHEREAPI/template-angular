
import { data } from "jquery";
import { Address } from "./address";
import { Menu } from "./menu";
import { Module } from "./module";
import { Profil } from "./profil";
import { Role } from "./role";
import { Boutique } from "./boutique";


export interface User {
  id?: number;
  userName: string;
  firstName: string;
  lastname: string;
  password?: string;
  isActive: boolean;
  autorisationDeletes: boolean;
  profileImageUrl?:string;
  //adresse!: Address;
  email: string;
  tel: string;
  indicatifPays: string;
  roleid: number;
  profilid: number;
  modules?: Module[];
  menus?: Menu[];
  updatedAt? :Date;
  lastLogin?:Date;
  createdAt?:Date ;
  profil?:Profil;
  role?:Role;
  codepays:string;
  createdBy?:string
  boutiqueid?:number;
  boutique:Boutique;
 


}
