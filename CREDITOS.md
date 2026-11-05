# Créditos e licenças

> Os Termos de Uso dizem que os modelos do site "foram criados para o projeto ou têm licença livre". Esta lista é a prova disso. Peça nova de terceiros entra aqui antes de entrar no site.

## Feito para o projeto

Licença do código: MIT (`LICENSE`). Modelos e textos: CC BY 4.0 (`LICENSE-CONTEUDO.md`). O nome e o logo "Projeto Comunidade" não entram na licença CC BY.

- Ícone e favicon (fundo grafite e três círculos brancos): `public/favicon.svg`. Os PNGs do app e a imagem de prévia (`public/og.png`) são gerados dele por `scripts/gerar-icones.mjs`.
- Modelos de card, paletas de cores, textos de exemplo e modelos de ata e convocação: `src/ferramentas/`.
- Textos das páginas: `src/paginas/textos/`.

## De terceiros (vão no site)

| Peça | Onde | Licença | Texto da licença |
|---|---|---|---|
| Fonte Atkinson Hyperlegible (Braille Institute of America), recortada para o português | `src/comum/fontes/*.woff2`, gerada por `scripts/fontes.mjs` | SIL Open Font License 1.1 | `public/licencas.txt` |
| uqr (gera o QR code) | dependência `uqr` | MIT | `public/licencas.txt` |

`public/licencas.txt` é publicado junto com o site, em `licencas.txt`, para a licença acompanhar a fonte e o código distribuídos.

## Só no desenvolvimento (não vão no site)

Vite, Vitest, TypeScript, subset-font e as dependências deles: licenças MIT, Apache-2.0, BSD, ISC, MPL-2.0 e Python-2.0, conferidas na revisão de segurança de 05/11/2026 (`docs/auditoria/2026-11-05/seguranca.md`, B5).
