export enum TypeCommerce {
  LIBRAIRIE = 'LIBRAIRIE',
  QUINCAILLERIE = 'QUINCAILLERIE',
  MINIMARCHE = 'MINIMARCHE',
  SUPERMARCHE = 'SUPERMARCHE',
  BOUTIQUE = 'BOUTIQUE',
  AUTRE = 'AUTRE'
}

export const TYPE_COMMERCE_LABELS: Record<TypeCommerce, string> = {
  [TypeCommerce.LIBRAIRIE]: 'Librairie',
  [TypeCommerce.QUINCAILLERIE]: 'Quincaillerie',
  [TypeCommerce.MINIMARCHE]: 'Minimarché',
  [TypeCommerce.SUPERMARCHE]: 'Supermarché',
  [TypeCommerce.BOUTIQUE]: 'Boutique',
  [TypeCommerce.AUTRE]: 'Autre'
};
