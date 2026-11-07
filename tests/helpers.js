const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');

const caminho = (arquivo = 'index.html') => path.join(RAIZ, arquivo);

function ler(arquivo = 'index.html') {
  const c = caminho(arquivo);
  if (!fs.existsSync(c)) {
    throw new Error(`Arquivo não encontrado: ${arquivo}`);
  }
  return fs.readFileSync(c, 'utf8');
}

async function abrir(page, largura = 1280) {
  const c = caminho('index.html');
  if (!fs.existsSync(c)) {
    throw new Error('Arquivo não encontrado: index.html');
  }
  await page.setViewportSize({ width: largura, height: 800 });
  await page.goto('file://' + c);
}

// Lê estilos calculados (o que o navegador realmente aplicou) de um elemento
async function estilo(page, seletor, props, i = 0) {
  return page.evaluate(([s, ps, i]) => {
    const e = document.querySelectorAll(s)[i];
    if (!e) return null;
    const cs = getComputedStyle(e);
    return Object.fromEntries(ps.map((p) => [p, cs[p]]));
  }, [seletor, props, i]);
}

// Posição e tamanho de um elemento na página
async function caixa(page, seletor, i = 0) {
  return page.evaluate(([s, i]) => {
    const e = document.querySelectorAll(s)[i];
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { x: r.left, y: r.top + scrollY, t: r.top, w: r.width, h: r.height };
  }, [seletor, i]);
}

// Retângulos (coordenadas da página) de TODOS os elementos que casam com o seletor
async function rects(page, seletor) {
  return page.evaluate((s) => [...document.querySelectorAll(s)].map((e) => {
    const r = e.getBoundingClientRect();
    return { l: r.left + scrollX, t: r.top + scrollY, r: r.right + scrollX, b: r.bottom + scrollY, w: r.width, h: r.height };
  }), seletor);
}

// Quanto a página "sobra" na horizontal (> 0 = rolagem horizontal indesejada)
const overflowX = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

// Nomes (tag.classe) dos elementos que passam da borda direita da tela — ajuda a achar quem estoura
async function quemEstoura(page) {
  return page.evaluate(() => {
    const largura = document.documentElement.clientWidth;
    return [...document.querySelectorAll('body *')]
      .filter((e) => e.getBoundingClientRect().right > largura + 1)
      .slice(0, 3)
      .map((e) => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : ''));
  });
}

const perto = (a, b, tol = 2) => Math.abs(a - b) <= tol;
const semComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

const px = (v) => parseFloat(v) || 0;
const transparente = (c) => c === 'transparent' || c === 'rgba(0, 0, 0, 0)';
const branco = (c) => c === 'rgb(255, 255, 255)';

module.exports = { fs, ler, abrir, caminho, estilo, caixa, rects, overflowX, quemEstoura, perto, semComentarios, px, transparente, branco };
