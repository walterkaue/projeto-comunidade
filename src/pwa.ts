// Registro do service worker (PWA instalável). Só no site publicado: em `npm run dev` ele
// atrapalharia o recarregamento automático do Vite.

export function registrarServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  // Depois do carregamento, para não disputar a rede com o site.
  window.addEventListener('load', () => {
    // Caminho relativo: funciona em /projeto-comunidade/ e na raiz de um domínio próprio.
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Sem service worker o site funciona igual; só não fica instalável nem abre sem rede.
    });
  });
}
