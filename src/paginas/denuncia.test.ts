import { describe, expect, it } from 'vitest';
import { EMAIL_CONTATO } from '../comum/marca';
import { urlSegura } from '../comum/html';
import {
  corpoDaDenuncia,
  gmailDeDenuncia,
  MAILTO_SEGURO,
  mailtoDeDenuncia,
  mailtoPodeCortar,
  textoParaCopiar,
  validarDenuncia,
  type Denuncia,
} from './denuncia';

const link = 'https://walterkaue.github.io/projeto-comunidade/#/evento/abc123';
const comLink: Denuncia = { link, onde: '', tipo: 'golpe', descricao: 'Pede a senha do banco para dar a cesta.' };
const semLink: Denuncia = { link: '', onde: 'Um card que recebi no grupo do bairro', tipo: 'ofensa', descricao: 'Xinga uma vizinha pelo nome.' };

describe('validação da denúncia', () => {
  it('aceita denúncia completa', () => {
    expect(validarDenuncia(comLink)).toEqual({});
    expect(validarDenuncia(semLink)).toEqual({});
  });

  it('pede tipo e descrição; sem link, pede onde', () => {
    const e = validarDenuncia({ link: '', onde: ' ', tipo: '', descricao: 'curto' });
    expect(Object.keys(e).sort()).toEqual(['descricao', 'onde', 'tipo']);
    expect(validarDenuncia({ ...comLink, tipo: 'inventado' }).tipo).toBeDefined();
    expect(validarDenuncia({ ...comLink, descricao: 'x'.repeat(1001) }).descricao).toContain('1000');
  });
});

describe('e-mail da denúncia', () => {
  it('corpo traz o link, o tipo e o que há de errado, como na revisão', () => {
    const c = corpoDaDenuncia(comLink);
    expect(c).toContain(link);
    expect(c).toContain('Golpe, ou pedido de dinheiro ou de dados');
    expect(c).toContain('Pede a senha do banco');
    expect(corpoDaDenuncia(semLink)).toContain('Onde está o conteúdo:\nUm card que recebi');
  });

  it('mailto com assunto e corpo codificados, e passa por urlSegura', () => {
    const m = mailtoDeDenuncia(comLink);
    expect(m.startsWith(`mailto:${EMAIL_CONTATO}?subject=`)).toBe(true);
    const q = new URLSearchParams(m.split('?')[1]);
    expect(q.get('subject')).toBe('Denúncia de conteúdo');
    expect(q.get('body')).toBe(corpoDaDenuncia(comLink));
    expect(m).not.toMatch(/[\s<>"]/);
    expect(urlSegura(m)).toBe(m);
  });

  it('texto digitado com HTML ou aspas não quebra o link', () => {
    const m = mailtoDeDenuncia({ ...semLink, descricao: '"><script>alert(1)</script> & mais' });
    expect(m).not.toMatch(/[<>"]/);
    expect(new URLSearchParams(m.split('?')[1]).get('body')).toContain('<script>');
  });

  it('Gmail no navegador com destinatário, assunto e corpo', () => {
    const u = new URL(gmailDeDenuncia(comLink));
    expect(u.origin + u.pathname).toBe('https://mail.google.com/mail/');
    expect(u.searchParams.get('view')).toBe('cm');
    expect(u.searchParams.get('to')).toBe(EMAIL_CONTATO);
    expect(u.searchParams.get('su')).toBe('Denúncia de conteúdo');
    expect(u.searchParams.get('body')).toBe(corpoDaDenuncia(comLink));
  });

  it('texto para copiar traz para quem, assunto e o corpo', () => {
    const t = textoParaCopiar(comLink);
    expect(t).toContain(`Para: ${EMAIL_CONTATO}`);
    expect(t).toContain('Assunto: Denúncia de conteúdo');
    expect(t).toContain(corpoDaDenuncia(comLink));
  });
});

describe('link resumido na tela', () => {
  it('mostra só o começo de link comprido', async () => {
    const { linkResumido } = await import('./formularioDenuncia');
    expect(linkResumido('https://x.exemplo/#/evento/abc')).toBe('https://x.exemplo/#/evento/abc');
    expect(linkResumido('a'.repeat(100))).toBe(`${'a'.repeat(60)}…`);
  });
});

describe('texto com metade de emoji', () => {
  it('não quebra o link do e-mail', () => {
    const d = { ...semLink, descricao: 'Texto com emoji partido \uD83D no meio, mais texto.' };
    expect(() => mailtoDeDenuncia(d)).not.toThrow();
    expect(() => gmailDeDenuncia(d)).not.toThrow();
  });
});

// Auditoria de segurança, 05/11/2026, B8: alguns aplicativos de e-mail cortam "mailto:" perto de 2.000 caracteres.
describe('link comprido demais para o aplicativo de e-mail', () => {
  const site = 'https://walterkaue.github.io/projeto-comunidade/#/evento/1r';
  const denuncia = (n: number): Denuncia => ({ link: site + 'A'.repeat(n), onde: '', tipo: 'golpe', descricao: 'Pede PIX.' });

  it('link curto: o aplicativo de e-mail serve', () => {
    expect(mailtoPodeCortar(denuncia(200))).toBe(false);
  });

  it('link acima de cerca de 1.800 caracteres: recomenda Gmail ou copiar', () => {
    expect(mailtoPodeCortar(denuncia(MAILTO_SEGURO))).toBe(true);
    expect(mailtoPodeCortar(denuncia(3900))).toBe(true);
  });

  it('conta o e-mail inteiro, não só o link', () => {
    const d = denuncia(1500);
    expect(d.link.length).toBeLessThan(MAILTO_SEGURO);
    expect(mailtoPodeCortar({ ...d, descricao: 'ç'.repeat(100) })).toBe(true);
  });
});
