import { describe, expect, it } from 'vitest';
import { EMAIL_CONTATO } from '../comum/marca';
import { urlSegura } from '../comum/html';
import { mailtoDeDenuncia } from './denuncia';

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
