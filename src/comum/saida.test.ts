import { describe, expect, it } from 'vitest';
import { dominioDoLink, ehLinkExterno, htmlDaFolha } from './saida';

const SITE = 'walterkaue.github.io';

describe('aviso de saída', () => {
  it('site de outro domínio é externo', () => {
    expect(ehLinkExterno('https://apoia.se/projeto', SITE)).toBe(true);
    expect(ehLinkExterno('http://exemplo.org/', SITE)).toBe(true);
  });
  it('o próprio site, e-mail, telefone, âncora e link quebrado não são', () => {
    expect(ehLinkExterno('https://walterkaue.github.io/projeto-comunidade/#/cards', SITE)).toBe(false);
    expect(ehLinkExterno('mailto:contato@exemplo.org', SITE)).toBe(false);
    expect(ehLinkExterno('tel:+5511999999999', SITE)).toBe(false);
    expect(ehLinkExterno('#termos', SITE)).toBe(false);
    expect(ehLinkExterno('javascript:alert(1)', SITE)).toBe(false);
  });
  it('mostra o domínio sem www', () => {
    expect(dominioDoLink('https://www.exemplo.org/a/b?c=1')).toBe('exemplo.org');
    expect(dominioDoLink('nada')).toBe('');
  });
});

describe('htmlDaFolha', () => {
  it('traz o texto, o domínio em negrito e os dois botões', () => {
    const h = htmlDaFolha('https://www.exemplo.org/x');
    expect(h).toContain('Você vai sair do Projeto Comunidade e abrir <strong>exemplo.<wbr>org</strong>.');
    expect(h).toContain('target="_blank" rel="noopener noreferrer"');
    expect(h).toContain('Ir para o site');
    expect(h).toContain('Ficar aqui');
    expect(h).toContain('data-sem-aviso');
  });
  it('escapa o endereço', () => {
    const h = htmlDaFolha('https://exemplo.org/"><script>alert(1)</script>');
    expect(h).not.toContain('<script>');
  });
});

describe('htmlDaFolha com destino', () => {
  it('diz o que vai abrir e o domínio entre parênteses', () => {
    expect(htmlDaFolha('https://www.google.com/maps?q=x', 'o mapa')).toContain(
      'abrir o mapa (<strong>google.<wbr>com</strong>)',
    );
    expect(htmlDaFolha('https://calendar.google.com/x', 'o Google Agenda')).toContain(
      'abrir o Google Agenda (<strong>calendar.<wbr>google.<wbr>com</strong>)',
    );
  });
  it('o domínio só quebra nos pontos', () => {
    const h = htmlDaFolha('https://calendar.google.com/x');
    expect(h).toContain('calendar.<wbr>google.<wbr>com');
  });
  it('destino com < ou longo demais é ignorado', () => {
    expect(htmlDaFolha('https://exemplo.org/', '<b>mapa</b>')).toContain('abrir <strong>exemplo.<wbr>org</strong>.');
    expect(htmlDaFolha('https://exemplo.org/', 'a'.repeat(41))).toContain('abrir <strong>exemplo.<wbr>org</strong>.');
    expect(htmlDaFolha('https://exemplo.org/', '<b>mapa</b>')).not.toContain('<b>');
  });
});
