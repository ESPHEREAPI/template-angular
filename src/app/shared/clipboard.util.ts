// navigator.clipboard n'existe qu'en contexte securise (HTTPS/localhost) -
// repli sur document.execCommand pour que la copie marche aussi en HTTP simple
// (ex: serveur accede par IP nue, sans certificat TLS).
export function copyToClipboard(value: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(value).then(() => true, () => false);
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let succes = false;
  try {
    succes = document.execCommand('copy');
  } catch {
    succes = false;
  } finally {
    document.body.removeChild(textarea);
  }
  return Promise.resolve(succes);
}
