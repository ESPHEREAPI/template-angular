export const environment = {

  production: true,
  //apiUrl:'http://192.168.123.175:8080', // bonamoussadi
  //apiUrl:'http://192.168.1.4:8080',// logpom
  //apiUrl:'http://localhost:8080',
  //apiUrl:'https://77.68.94.193',// zenoline-test
  //apiUrl:'http://169.58.128.44:8080',// jndtech - ancien acces direct au gateway (port expose publiquement, desormais ferme, voir Caddy)
  // Chemin relatif : resolu contre l'origine de la page (le frontend
  // proxy deja /gateway-proxy/ et /api/ vers le gateway en interne, voir
  // nginx.conf) - meme origine que la page, donc aucun CORS necessaire,
  // et compatible HTTPS (evite le "contenu mixte" d'un appel http:// en
  // dur depuis une page https://).
  apiUrl: '',
 // token_key: '3cfa76ef890d4aed2d3981a7c93bd1a13c8796dafcb4f94fa578234a0df56b321'
   appName: 'EasyCom Pro',
  version: '1.0.0'

};
