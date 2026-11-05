// Pede aos buscadores que não indexem a página de um evento (conteúdo de terceiros, que vem no hash). Fica
// enquanto a tela está aberta; a função devolvida tira. Recebe o `document` para ser testável sem navegador.

export interface DocumentoMinimo {
  head: { appendChild(n: never): unknown };
  createElement(tag: 'meta'): { name: string; content: string; remove(): void };
}

export function semIndexar(doc: DocumentoMinimo): () => void {
  const meta = doc.createElement('meta');
  meta.name = 'robots';
  meta.content = 'noindex';
  doc.head.appendChild(meta as never);
  return () => meta.remove();
}
