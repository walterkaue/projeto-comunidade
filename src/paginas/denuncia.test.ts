import { describe, expect, it } from 'vitest';
import { EMAIL_CONTATO } from '../comum/marca';
import { urlSegura } from '../comum/html';
import { gmailDeDenuncia, mailtoDeDenuncia, textoParaCopiar } from './denuncia';

describe('mailtoDeDenuncia', () => {
  const link = 'https://walterkaue.github.io/projeto-comunidade/#/evento/abc123';

  it('monta assunto e corpo com o link, tudo codificado', () => {
    const m = mailtoDeDenuncia(link);
    expect(m.startsWith(`mailto:${EMAIL_CONTATO}?subject=`)).toBe(true);
    const q = new URLSearchParams(m.split('?')[1]);
    expect(q.get('subject')).toBe('Denúncia de conteúdo');
    expect(q.get('body')).toContain(link);
    expect(q.get('body')).toContain('Motivo');
    expect(m).not.toContain(' ');
    expect(m).not.toContain('\n');
  });

  it('passa por urlSegura sem perder nada', () => {
    const m = mailtoDeDenuncia(link);
    expect(urlSegura(m)).toBe(m);
  });

  it('sem link, pede a descrição', () => {
    const q = new URLSearchParams(mailtoDeDenuncia('').split('?')[1]);
    expect(q.get('body')).toContain('Onde está o conteúdo');
  });
});

describe('outros jeitos de enviar', () => {
  const link = 'https://walterkaue.github.io/projeto-comunidade/#/evento/abc123';
  it('Gmail no navegador com destinatário, assunto e corpo', () => {
    const u = new URL(gmailDeDenuncia(link));
    expect(u.origin + u.pathname).toBe('https://mail.google.com/mail/');
    expect(u.searchParams.get('view')).toBe('cm');
    expect(u.searchParams.get('to')).toBe(EMAIL_CONTATO);
    expect(u.searchParams.get('su')).toBe('Denúncia de conteúdo');
    expect(u.searchParams.get('body')).toContain(link);
  });
  it('texto para copiar traz para quem, assunto e o link', () => {
    const t = textoParaCopiar(link);
    expect(t).toContain(`Para: ${EMAIL_CONTATO}`);
    expect(t).toContain('Assunto: Denúncia de conteúdo');
    expect(t).toContain(link);
  });
});
