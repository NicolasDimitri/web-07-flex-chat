const { test, expect } = require('@playwright/test');
const { ler, abrir, estilo, rects, overflowX, quemEstoura, perto, semComentarios, px } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await abrir(page);
});

const mediaCss = () => semComentarios(ler('style.css'));
const TRANSPARENTE = 'rgba(0, 0, 0, 0)';

test('R1 – Base do HTML: doctype, lang pt-BR, charset UTF-8, <title> e viewport', async ({ page }) => {
  expect(ler(), 'Falta <!DOCTYPE html>').toMatch(/^\s*<!doctype html>/i);
  const info = await page.evaluate(() => ({
    lang: document.documentElement.getAttribute('lang'),
    charset: document.querySelector('head meta[charset]')?.getAttribute('charset') || '',
    title: document.title.trim(),
    viewport: document.querySelector('head meta[name="viewport"]')?.getAttribute('content') || '',
  }));
  expect(info.lang, 'Falta lang="pt-BR"').toBe('pt-BR');
  expect(info.charset.toLowerCase(), 'Falta <meta charset="UTF-8">').toBe('utf-8');
  expect(info.title.length, '<title> vazio').toBeGreaterThan(2);
  expect(info.viewport, 'Falta <meta name="viewport" content="width=device-width, initial-scale=1.0">').toMatch(/width=device-width/);
});

test('R2 – CSS em arquivo externo style.css (sem style="" e sem <style>)', async ({ page }) => {
  const href = await page.evaluate(() => document.querySelector('head link[rel="stylesheet"]')?.getAttribute('href'));
  expect(href, 'Falta <link rel="stylesheet" href="style.css"> no <head>').toBe('style.css');
  expect(ler('style.css').trim().length, 'O style.css está praticamente vazio').toBeGreaterThan(600);
  expect(ler(), 'Não use style="..." no HTML').not.toMatch(/\sstyle\s*=/i);
  expect(ler(), 'Não use <style> no HTML').not.toMatch(/<style/i);
});

test('R3 – Estrutura HTML do chat (veja o esqueleto no README)', async ({ page }) => {
  const s = await page.evaluate(() => {
    const q = (x) => document.querySelector(x);
    return {
      topo: !!q('body > .chat > header.chat-topo > .avatar') && !!q('.chat-topo > .info > .nome') && !!q('.chat-topo > .info > .status') && !!q('.chat-topo > button.mais'),
      mensagens: !!q('.chat > main.mensagens'),
      divisor: !!q('.mensagens > .divisor > span'),
      recebidas: document.querySelectorAll('.mensagens > .msg.recebida').length,
      enviadas: document.querySelectorAll('.mensagens > .msg.enviada').length,
      msgsOk: [...document.querySelectorAll('.msg')].every((m) => m.querySelector('p') && m.querySelector('.hora')),
      longa: [...document.querySelectorAll('.msg p')].some((p) => p.textContent.trim().length >= 120),
      digitando: document.querySelectorAll('.mensagens > .digitando > span').length,
      form: !!q('.chat > form.entrada > input') && !!q('.entrada > button.enviar'),
    };
  });
  expect(s.topo, 'O header.chat-topo precisa de .avatar, .info (com .nome e .status) e <button class="mais">').toBe(true);
  expect(s.mensagens, 'Falta <main class="mensagens"> dentro do .chat').toBe(true);
  expect(s.divisor, 'Falta <div class="divisor"><span>Hoje</span></div> dentro do .mensagens').toBe(true);
  expect(s.recebidas, 'Precisa de 3+ mensagens <article class="msg recebida">').toBeGreaterThanOrEqual(3);
  expect(s.enviadas, 'Precisa de 3+ mensagens <article class="msg enviada">').toBeGreaterThanOrEqual(3);
  expect(s.msgsOk, 'Toda .msg precisa de um <p> e de um <span class="hora">').toBe(true);
  expect(s.longa, 'Pelo menos uma mensagem precisa ter um texto LONGO (120+ caracteres)').toBe(true);
  expect(s.digitando, 'Falta <div class="digitando"> com exatamente 3 <span> dentro do .mensagens').toBe(3);
  expect(s.form, 'Falta <form class="entrada"> com <input> e <button class="enviar">').toBe(true);
});

test('R4 – Reset: body com margin 0 e box-sizing: border-box', async ({ page }) => {
  const b = await estilo(page, 'body', ['marginTop', 'marginLeft']);
  expect(px(b.marginTop) + px(b.marginLeft), 'O body precisa de margin: 0').toBe(0);
  for (const sel of ['.chat', '.msg', '.entrada']) {
    const e = await estilo(page, sel, ['boxSizing']);
    expect(e.boxSizing, `${sel} precisa de box-sizing: border-box (dica: * { box-sizing: border-box; })`).toBe('border-box');
  }
});

test('R5 – .chat: coluna com a altura da tela, de 320 a 480px de largura e centralizado', async ({ page }) => {
  const c = await estilo(page, '.chat', ['display', 'flexDirection']);
  expect(c.display, '.chat precisa de display: flex').toBe('flex');
  expect(c.flexDirection, '.chat precisa de flex-direction: column').toBe('column');
  const [box] = await rects(page, '.chat');
  expect(box.w, 'Em 1280px o .chat deve ter no máximo 480px (max-width)').toBeLessThanOrEqual(480);
  expect(box.w, 'O .chat ficou estreito demais (mínimo 320px)').toBeGreaterThanOrEqual(320);
  expect(perto(box.h, 800, 2), `O .chat deve ter a altura da tela (800px), mas tem ${Math.round(box.h)}px. Dica: height: 100vh`).toBe(true);
  expect(perto((box.l + box.r) / 2, 640, 2), 'O .chat precisa estar centralizado na horizontal (margin: 0 auto)').toBe(true);
});

test('R6 – Topo: avatar redondo com inicial centralizada, .info ocupa o meio e o botão "⋮" vai para a direita', async ({ page }) => {
  const t = await estilo(page, '.chat-topo', ['display', 'alignItems', 'columnGap']);
  expect(t.display, '.chat-topo precisa de display: flex').toBe('flex');
  expect(t.alignItems, '.chat-topo precisa de align-items: center').toBe('center');
  expect(px(t.columnGap), 'Use gap (8px ou mais) no .chat-topo').toBeGreaterThanOrEqual(8);
  const a = await estilo(page, '.avatar', ['display', 'justifyContent', 'alignItems', 'borderTopLeftRadius']);
  const [av] = await rects(page, '.avatar');
  expect(av.w >= 40 && av.w <= 56 && Math.abs(av.w - av.h) <= 1, 'O avatar deve ser um quadrado de 40 a 56px').toBe(true);
  expect(a.borderTopLeftRadius === '50%' || px(a.borderTopLeftRadius) >= av.w / 2 - 1, 'O avatar precisa ser um círculo').toBe(true);
  expect(a.display, '.avatar precisa ser flex para centralizar a inicial').toMatch(/flex/);
  expect(a.justifyContent, 'Centralize a inicial na horizontal').toBe('center');
  expect(a.alignItems, 'Centralize a inicial na vertical').toBe('center');
  const i = await estilo(page, '.info', ['flexGrow']);
  expect(Number(i.flexGrow), 'A .info precisa crescer e ocupar o espaço do meio (flex-grow: 1)').toBeGreaterThanOrEqual(1);
  const [chat] = await rects(page, '.chat');
  const [mais] = await rects(page, '.mais');
  expect(chat.r - mais.r, 'O botão "⋮" deve ficar encostado na direita do topo (até 32px)').toBeLessThanOrEqual(32);
});

test('R7 – Nome MUITO longo não quebra o topo: vira "Maria Apare…" (reticências) e o botão continua visível', async ({ page }) => {
  await page.evaluate(() => { document.querySelector('.nome').textContent = 'Maria Aparecida de Souza e Silva '.repeat(8); });
  const n = await estilo(page, '.nome', ['textOverflow', 'whiteSpace', 'overflowX']);
  expect(n.whiteSpace, 'O .nome precisa de white-space: nowrap').toBe('nowrap');
  expect(['hidden', 'clip'], 'O .nome precisa de overflow: hidden').toContain(n.overflowX);
  expect(n.textOverflow, 'O .nome precisa de text-overflow: ellipsis (só funciona em elementos de bloco)').toBe('ellipsis');
  const [chat] = await rects(page, '.chat');
  const [mais] = await rects(page, '.mais');
  const [av] = await rects(page, '.avatar');
  const [nome] = await rects(page, '.nome');
  const topoOverflow = await page.evaluate(() => { const e = document.querySelector('.chat-topo'); return e.scrollWidth - e.clientWidth; });
  expect(topoOverflow, 'Com um nome longo o topo passou da largura do chat. Dica: itens flex têm min-width: auto; a .info precisa de min-width: 0').toBeLessThanOrEqual(1);
  expect(mais.r, 'O botão "⋮" foi empurrado para fora do chat por causa do nome longo (dica: min-width: 0 na .info)').toBeLessThanOrEqual(chat.r + 1);
  expect(av.w, 'O avatar foi espremido pelo nome longo (dica: flex-shrink: 0 no avatar)').toBeGreaterThanOrEqual(39);
  expect(nome.w, 'O nome deveria ser cortado para caber ao lado do avatar e do botão').toBeLessThan(chat.w - 100);
});

test('R8 – Área de mensagens ROLA sozinha e o campo de digitar nunca sai do fim da tela (teste com 30 mensagens extras)', async ({ page }) => {
  const m = await estilo(page, '.mensagens', ['display', 'flexDirection', 'flexGrow', 'overflowY', 'rowGap']);
  expect(m.display, '.mensagens precisa de display: flex').toBe('flex');
  expect(m.flexDirection, '.mensagens precisa de flex-direction: column').toBe('column');
  expect(Number(m.flexGrow), '.mensagens precisa crescer e ocupar o espaço livre (flex: 1)').toBeGreaterThanOrEqual(1);
  expect(px(m.rowGap), 'Use gap (8px ou mais) entre as mensagens').toBeGreaterThanOrEqual(8);
  expect(['auto', 'scroll'], '.mensagens precisa de overflow-y: auto').toContain(m.overflowY);
  await page.evaluate(() => {
    const area = document.querySelector('.mensagens');
    const base = document.querySelector('.msg.enviada');
    const ref = document.querySelector('.digitando');
    for (let i = 0; i < 30; i++) area.insertBefore(base.cloneNode(true), ref);
  });
  const [form] = await rects(page, '.entrada');
  expect(perto(form.b, 800, 1), `Com muitas mensagens o campo de digitar saiu do lugar (termina em ${Math.round(form.b)}px, deveria ser 800px). Quem rola é a .mensagens, não a página`).toBe(true);
  const rola = await page.evaluate(() => { const e = document.querySelector('.mensagens'); return e.scrollHeight - e.clientHeight; });
  expect(rola, 'A área .mensagens deveria ter rolagem interna').toBeGreaterThan(100);
  expect(await page.evaluate(() => document.documentElement.scrollHeight), 'A PÁGINA ganhou rolagem; só a .mensagens pode rolar').toBeLessThanOrEqual(801);
});

test('R9 – Bolhas: flex em coluna, cantos arredondados, padding e no máximo 80% da largura (texto longo quebra de linha)', async ({ page }) => {
  const b = await estilo(page, '.msg', ['display', 'flexDirection', 'borderTopLeftRadius', 'paddingLeft']);
  expect(b.display, '.msg precisa de display: flex').toBe('flex');
  expect(b.flexDirection, '.msg precisa de flex-direction: column').toBe('column');
  expect(px(b.borderTopLeftRadius), 'border-radius da bolha: 12px ou mais').toBeGreaterThanOrEqual(12);
  expect(px(b.paddingLeft), 'padding da bolha: 8px ou mais').toBeGreaterThanOrEqual(8);
  const area = await page.evaluate(() => document.querySelector('.mensagens').clientWidth);
  const msgs = await rects(page, '.msg');
  const idxLonga = await page.evaluate(() => [...document.querySelectorAll('.msg')].findIndex((m) => m.querySelector('p').textContent.trim().length >= 120));
  msgs.forEach((x) => expect(x.w, 'Nenhuma bolha pode passar de 80% da largura da conversa (max-width: 80%)').toBeLessThanOrEqual(area * 0.8 + 1));
  expect(msgs[idxLonga].w, 'A mensagem longa deveria ocupar boa parte da linha (50%+) e quebrar o texto').toBeGreaterThanOrEqual(area * 0.5);
  expect(Math.min(...msgs.map((x) => x.w)), 'As bolhas curtas não podem esticar até as bordas (dica: align-self)').toBeLessThanOrEqual(area * 0.6);
});

test('R10 – Recebidas coladas à ESQUERDA e enviadas coladas à DIREITA (align-self)', async ({ page }) => {
  const [chat] = await rects(page, '.chat');
  const rec = await rects(page, '.msg.recebida');
  const env = await rects(page, '.msg.enviada');
  rec.forEach((m) => expect(m.l - chat.l, 'As mensagens recebidas devem ficar à esquerda').toBeLessThanOrEqual(48));
  env.forEach((m) => expect(chat.r - m.r, 'As mensagens enviadas devem ficar à direita (dica: align-self: flex-end)').toBeLessThanOrEqual(48));
});

test('R11 – Recebidas e enviadas com cores de fundo diferentes', async ({ page }) => {
  const r = await estilo(page, '.msg.recebida', ['backgroundColor']);
  const e = await estilo(page, '.msg.enviada', ['backgroundColor']);
  expect(r.backgroundColor !== TRANSPARENTE && e.backgroundColor !== TRANSPARENTE, 'As duas bolhas precisam de background-color').toBe(true);
  expect(r.backgroundColor, 'Recebidas e enviadas devem ter cores diferentes').not.toBe(e.backgroundColor);
});

test('R12 – Horário (.hora) pequeno, no canto inferior DIREITO da bolha e encolhido ao tamanho do texto', async ({ page }) => {
  const dados = await page.evaluate(() => [...document.querySelectorAll('.msg')].map((m) => {
    const rc = (e) => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width }; };
    const cs = getComputedStyle(m);
    return {
      msg: rc(m), hora: rc(m.querySelector('.hora')), p: rc(m.querySelector('p')),
      pr: parseFloat(cs.paddingRight), pb: parseFloat(cs.paddingBottom),
      fh: parseFloat(getComputedStyle(m.querySelector('.hora')).fontSize),
      fp: parseFloat(getComputedStyle(m.querySelector('p')).fontSize),
      longa: m.querySelector('p').textContent.trim().length >= 120,
    };
  }));
  dados.forEach((d) => {
    expect(d.fh, 'A .hora deve ter fonte menor que o texto da mensagem').toBeLessThan(d.fp);
    expect(d.hora.t, 'A .hora deve ficar ABAIXO do texto').toBeGreaterThanOrEqual(d.p.b - 1);
    expect(d.msg.r - d.hora.r, 'A .hora deve ficar no canto direito da bolha (dica: align-self: flex-end)').toBeLessThanOrEqual(d.pr + 3);
    expect(d.msg.b - d.hora.b, 'A .hora deve ficar no canto inferior da bolha').toBeLessThanOrEqual(d.pb + 3);
  });
  const longa = dados.find((d) => d.longa);
  expect(longa.hora.w, 'Na mensagem longa a .hora está esticada pela largura toda; ela deve ter só o tamanho do próprio texto (align-self)').toBeLessThanOrEqual(80);
});

test('R13 – Divisor "Hoje": texto no meio com uma linha de cada lado (::before e ::after com flex-grow)', async ({ page }) => {
  const d = await page.evaluate(() => {
    const el = document.querySelector('.divisor');
    const cs = getComputedStyle(el);
    const ps = ['::before', '::after'].map((p) => {
      const c = getComputedStyle(el, p);
      return { content: c.content, grow: c.flexGrow, h: parseFloat(c.height) || 0, bg: c.backgroundColor,
        borda: Math.max(parseFloat(c.borderTopWidth) || 0, parseFloat(c.borderBottomWidth) || 0), estilo: c.borderTopStyle + '/' + c.borderBottomStyle };
    });
    const s = el.querySelector('span').getBoundingClientRect();
    const b = el.getBoundingClientRect();
    return { display: cs.display, align: cs.alignItems, gap: parseFloat(cs.columnGap) || 0, ps, sc: (s.left + s.right) / 2, bc: (b.left + b.right) / 2, sw: s.width, bw: b.width };
  });
  expect(d.display, '.divisor precisa de display: flex').toBe('flex');
  expect(d.align, '.divisor precisa de align-items: center').toBe('center');
  expect(d.gap, 'Use gap (8px ou mais) no .divisor').toBeGreaterThanOrEqual(8);
  d.ps.forEach((p, i) => {
    const nome = i === 0 ? '::before' : '::after';
    expect(['none', 'normal'], `Falta content: "" no ${nome} do .divisor`).not.toContain(p.content);
    expect(p.grow, `O ${nome} precisa de flex-grow: 1 para esticar a linha`).toBe('1');
    const visivel = (p.h >= 1 && p.h <= 4 && p.bg !== TRANSPARENTE) || (p.borda >= 1 && p.estilo !== 'none/none');
    expect(visivel, `O ${nome} precisa desenhar uma linha fina (height de 1 a 4px com background, ou uma borda)`).toBe(true);
  });
  expect(perto(d.sc, d.bc, 3), 'O texto "Hoje" deve ficar centralizado, com linhas iguais dos dois lados').toBe(true);
  expect(d.sw, 'O texto não deve ocupar a linha toda').toBeLessThan(d.bw / 2);
});

test('R14 – "Digitando…": bolha compacta à esquerda com 3 bolinhas redondas, centralizadas e com gap', async ({ page }) => {
  const d = await estilo(page, '.digitando', ['display', 'alignItems', 'columnGap', 'paddingLeft', 'borderTopLeftRadius']);
  expect(d.display, '.digitando precisa ser flex (ou inline-flex)').toMatch(/flex/);
  expect(d.alignItems, '.digitando precisa de align-items: center').toBe('center');
  expect(px(d.columnGap), 'Use gap (3px ou mais) entre as bolinhas').toBeGreaterThanOrEqual(3);
  expect(px(d.paddingLeft), '.digitando precisa de padding (6px ou mais)').toBeGreaterThanOrEqual(6);
  expect(px(d.borderTopLeftRadius), '.digitando precisa de border-radius (12px ou mais)').toBeGreaterThanOrEqual(12);
  const [chat] = await rects(page, '.chat');
  const [box] = await rects(page, '.digitando');
  expect(box.w, 'A bolha "digitando" deve ser compacta (até 120px), não esticada (dica: align-self)').toBeLessThanOrEqual(120);
  expect(box.l - chat.l, 'A bolha "digitando" deve ficar à esquerda').toBeLessThanOrEqual(48);
  const pts = await rects(page, '.digitando span');
  expect(new Set(pts.map((p) => Math.round(p.t))).size, 'As 3 bolinhas devem ficar na mesma linha').toBe(1);
  pts.forEach((p) => {
    expect(p.w >= 6 && p.w <= 14 && Math.abs(p.w - p.h) <= 1, 'Cada bolinha deve ser um quadrado de 6 a 14px (width e height)').toBe(true);
  });
  const est = await page.evaluate(() => [...document.querySelectorAll('.digitando span')].map((s) => {
    const c = getComputedStyle(s);
    return { r: c.borderTopLeftRadius, w: s.getBoundingClientRect().width, bg: c.backgroundColor };
  }));
  est.forEach((e) => {
    expect(e.r === '50%' || px(e.r) >= e.w / 2 - 1, 'Cada bolinha precisa ser redonda (border-radius: 50%)').toBe(true);
    expect(e.bg, 'Cada bolinha precisa de background-color').not.toBe(TRANSPARENTE);
  });
});

test('R15 – Animação das bolinhas: @keyframes, animation infinita e atrasos DIFERENTES (efeito de onda)', async ({ page }) => {
  expect(mediaCss(), 'Falta um @keyframes no CSS').toMatch(/@keyframes/);
  const a = await page.evaluate(() => [...document.querySelectorAll('.digitando span')].map((s) => {
    const c = getComputedStyle(s);
    return { nome: c.animationName, dur: parseFloat(c.animationDuration) || 0, delay: c.animationDelay, rep: c.animationIterationCount };
  }));
  a.forEach((x) => {
    expect(x.nome, 'Cada bolinha precisa de animation-name').not.toBe('none');
    expect(x.dur, 'A animation-duration precisa ser maior que 0s').toBeGreaterThan(0);
    expect(x.rep, 'A animação deve repetir para sempre (animation-iteration-count: infinite)').toBe('infinite');
  });
  expect(new Set(a.map((x) => x.delay)).size, 'As bolinhas precisam de animation-delay diferentes (dica: :nth-child)').toBeGreaterThanOrEqual(2);
});

test('R16 – Barra de digitar: campo CRESCE, botão fixo, tudo na mesma linha e colada no fim do chat', async ({ page }) => {
  const e = await estilo(page, '.entrada', ['display', 'columnGap']);
  expect(e.display, '.entrada precisa de display: flex').toBe('flex');
  expect(px(e.columnGap), 'Use gap (8px ou mais) na .entrada').toBeGreaterThanOrEqual(8);
  const i = await estilo(page, '.entrada input', ['flexGrow']);
  expect(Number(i.flexGrow), 'O campo precisa crescer (flex: 1)').toBeGreaterThanOrEqual(1);
  const [chat] = await rects(page, '.chat');
  const [inp] = await rects(page, '.entrada input');
  const [btn] = await rects(page, '.entrada button');
  expect(inp.h, 'O campo deve ter 36px ou mais de altura').toBeGreaterThanOrEqual(36);
  expect(inp.w, 'O campo deve ocupar o espaço livre (200px ou mais em 1280px)').toBeGreaterThanOrEqual(200);
  expect(perto((inp.t + inp.b) / 2, (btn.t + btn.b) / 2, 3), 'Campo e botão devem estar na mesma linha, alinhados').toBe(true);
  expect(btn.r, 'O botão não pode sair do chat').toBeLessThanOrEqual(chat.r + 1);
  const [form] = await rects(page, '.entrada');
  expect(perto(form.b, chat.b, 1), 'A .entrada deve ficar colada no fim do .chat').toBe(true);
});

test('R17 – Celular (375px): chat ocupa a tela toda, campo e botão na mesma linha, sem rolagem horizontal', async ({ page }) => {
  await abrir(page, 375);
  const [chat] = await rects(page, '.chat');
  expect(chat.w, 'Em 375px o .chat deve ocupar a largura toda (max-width, não width fixa)').toBeGreaterThanOrEqual(360);
  expect(perto(chat.h, 800, 2), 'Em 375px o .chat deve manter a altura da tela').toBe(true);
  const [inp] = await rects(page, '.entrada input');
  const [btn] = await rects(page, '.entrada button');
  const [form] = await rects(page, '.entrada');
  expect(inp.w, 'Em 375px o campo deve continuar com 150px ou mais').toBeGreaterThanOrEqual(150);
  expect(perto((inp.t + inp.b) / 2, (btn.t + btn.b) / 2, 3) && btn.r <= 375, 'Em 375px campo e botão devem continuar na mesma linha, dentro da tela').toBe(true);
  expect(perto(form.b, 800, 1), 'Em 375px a .entrada deve continuar colada no fim da tela').toBe(true);
  const sobra = await overflowX(page);
  const culpados = await quemEstoura(page);
  expect(sobra, `Há rolagem horizontal em 375px (${sobra}px a mais). Passam da tela: ${culpados.join(', ') || 'veja no navegador'}`).toBeLessThanOrEqual(0);
});
