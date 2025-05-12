import { Role } from "./Role";

export class Users {
    //id!: number
   // genre!: string;
    type!: string;
   // nom!: string;
  //  prenom!: string;
   // dateNaissance!: Date
   // lieuNaissance!: string
   // telephone!: string;
  //  email!: string;
    login!: string;
    password!: string;
   // statut!: string;
   // supprime!: string;
   // echeck_connection: boolean = false;
   // messageEcheck!: string;
   // roles!:string;
   // status!:string;
   // registeredDate!:Date;
   id!: number;
   nom!: string;
   email!: string;
  
   status!: 'active' | 'inactive';
   registeredDate!: Date;
   messageEcheck!: string;
   echeck_connection: boolean = false;
  roles!:string
  firstName!: string
  lastName!: string

  phoneNumber!: string
  address!: string
  profileImageUrl!: string
  active!: boolean
  
  roless!: Role[]
  
 

}