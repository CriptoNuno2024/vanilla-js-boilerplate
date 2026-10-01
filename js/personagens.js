// ---------------------------------------------------------------------
// CARAS DAS PERSONAGENS — a cara de quem fala no balão (ver
// mostrarFalaAtual() em js/main.js) e a reserva do botão do Perfil (ver
// fotoTelegramNoBotao() em js/perfil.js). As imagens são pequenas (128x128).
// Nome sem cara aqui = o círculo dourado de sempre.
// ---------------------------------------------------------------------
const PERSONAGENS_CARAS = {
  'YoshiCat': 'assets/personagens/yoshicat.jpg',
  'Chizo': 'assets/personagens/chizo.jpg',
  'Fygmo': 'assets/personagens/fygmo.jpg',
  'Fygmo2': 'assets/personagens/fygmo2.jpg'
};

// Caminho da cara de uma personagem, ou null se não houver.
function caraDoPersonagem(nome) {
  return Object.prototype.hasOwnProperty.call(PERSONAGENS_CARAS, nome) ? PERSONAGENS_CARAS[nome] : null;
}

// Pré-carga (são pequenas): não bloqueia nada.
Object.keys(PERSONAGENS_CARAS).forEach(function (nome) { new Image().src = PERSONAGENS_CARAS[nome]; });

// Põe a cara de "nome" no círculo do balão (#dialogue-avatar). O gradiente
// dourado do CSS fica por trás como reserva: sem cara para esse nome, ou se
// a imagem falhar, nada é acrescentado. A cada fala recalcula-se tudo, por
// isso nunca fica a cara da fala anterior.
function mostrarCaraNoBalao(nome) {
  const avatar = document.getElementById('dialogue-avatar');
  if (!avatar) return;
  const caminho = caraDoPersonagem(nome);
  if (avatar.dataset.cara === (caminho || '')) return; // já está certa (ou continua só o dourado)
  avatar.dataset.cara = caminho || '';
  while (avatar.firstChild) avatar.removeChild(avatar.firstChild);
  if (!caminho) return;
  const img = new Image();
  img.alt = '';
  img.onload = function () {
    // Resposta atrasada de uma fala anterior: ignora.
    if (avatar.dataset.cara !== caminho) return;
    while (avatar.firstChild) avatar.removeChild(avatar.firstChild);
    avatar.appendChild(img);
  };
  img.src = caminho;
  if (img.complete && img.naturalWidth > 0) img.onload(); // já em cache: sem piscar
}
