(function () {
  function initMarquee(selector, pxPerSec, direction = 1) {
    const parent = document.querySelector(selector);
    if (!parent) return;

    // Garante style, caso o CSS tenha sido sobrescrito
    parent.style.display = 'flex';
    parent.style.whiteSpace = 'nowrap';
    parent.style.overflow = 'hidden';
    parent.style.willChange = 'transform';

    // Cria wrapper .track e move o conteúdo existente para dentro dele
    let track = parent.querySelector('.track');
    if (!track) {
      track = document.createElement('span');
      track.className = 'track';
      
      // Criamos um "unit" que contém todo o conteúdo original
      const unit = document.createElement('span');
      unit.className = 'marquee-unit';
      unit.style.display = 'inline-flex';
      unit.style.alignItems = 'center';
      
      const frag = document.createDocumentFragment();
      while (parent.firstChild) frag.appendChild(parent.firstChild);
      unit.appendChild(frag);
      
      track.appendChild(unit);
      parent.appendChild(track);
      track.style.display = 'inline-flex';
    }

    // Função que preenche com clones
    function fillTrack() {
      // Deixa apenas o primeiro unit (o original)
      while (track.children.length > 1) track.removeChild(track.lastChild);

      const unit = track.children[0];
      if (!unit) return;

      const buffer = 100; // px
      const parentW = parent.clientWidth || window.innerWidth;
      
      // Clona o unit inteiro até preencher 3x a largura do container
      while (track.scrollWidth < parentW * 3 + buffer) {
        const clone = unit.cloneNode(true);
        track.appendChild(clone);
      }
    }

    let offset = 0;
    let lastTs = 0;
    let rafId;
    let isPaused = false;

    parent.addEventListener('mouseenter', () => isPaused = true);
    parent.addEventListener('mouseleave', () => isPaused = false);
    parent.addEventListener('touchstart', () => isPaused = true, { passive: true });
    parent.addEventListener('touchend', () => isPaused = false, { passive: true });

    function loop(ts) {
      if (!lastTs) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      if (!isPaused) {
        offset += pxPerSec * direction * dt;
      }

      // Ponto de loop: largura de um bloco original
      // Como todos os clones são iguais, o loop acontece no scrollWidth / total_clones
      const totalBlocks = track.children.length;
      const cycle = track.scrollWidth / totalBlocks;
      
      if (cycle > 0) {
        offset = ((offset % cycle) + cycle) % cycle;
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
      }

      rafId = requestAnimationFrame(loop);
    }

    function start() {
      cancelAnimationFrame(rafId);
      track.style.transform = 'translate3d(0,0,0)';
      offset = 0;
      lastTs = 0;
      fillTrack();
      rafId = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', start, { passive: true });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(start);
    }

    start();
  }

  async function loadSponsors() {
    console.log("Iniciando carga de patrocinadores via Google Sheets...");
    // Adicionamos um timestamp para evitar que o navegador use uma versão antiga (cache) da planilha
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSMLv0aL-RA4wLT1_mZtj3d4hs1ATpsxwquh9R68dPl3obOcFF4mqtZKfWu9EclOwABJoP7-AHRJvBP/pub?gid=0&single=true&output=csv' + '&t=' + new Date().getTime();
    
    const container = document.querySelector('.sponsors-marquee');
    if (!container) {
      console.error("Erro: Container .sponsors-marquee não encontrado.");
      return;
    }

    try {
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error("Erro na resposta do servidor: " + response.status);
      
      const data = await response.text();
      console.log("Dados recebidos da planilha:", data.substring(0, 100) + "...");
      
      const rows = data.split(/\r?\n/).map(row => row.trim()).filter(row => row.length > 0);
      
      let hasLogos = false;
      const frag = document.createDocumentFragment();

      rows.forEach(row => {
        const cols = row.split(',');
        const firstCol = cols[0].replace(/^"|"$/g, '').trim();

        if (firstCol.startsWith('http')) {
          const img = document.createElement('img');
          img.src = firstCol;
          img.alt = 'Patrocinador';
          frag.appendChild(img);
          hasLogos = true;
        }
      });

      if (hasLogos) {
        console.log("Inserindo novos logos no carrossel...");
        container.innerHTML = ''; 
        container.appendChild(frag);
        // Inicializa o marquee apenas se houver logos
        initMarquee('.sponsors-marquee', 50, +1);
      } else {
        console.warn("Nenhum link de logotipo válido encontrado na planilha.");
        // Oculta a seção se não houver nada para mostrar
        const section = document.querySelector('.sponsors-section');
        if (section) section.style.display = 'none';
      }
    } catch (error) {
      console.error('Falha ao carregar patrocinadores da planilha:', error);
      // Se falhar e o HTML estiver vazio, oculta a seção
      const section = document.querySelector('.sponsors-section');
      if (section) section.style.display = 'none';
    }
  }

  window.addEventListener('load', function () {
    initMarquee('.textoinfinito', 100, +1);   // Direção normal
    initMarquee('.textoinfinito1', 100, -1);  // Direção oposta
    
    // Inicia a carga dos patrocinadores via Google Sheets
    loadSponsors();
  });

  // Modal de Atividades
  console.log("Inicializando Modal de Atividades...");
  const modal = document.getElementById('activityModal');
  const cards = document.querySelectorAll('.activity-card');
  const closeBtn = document.querySelector('.close-modal');

  if (modal && cards.length > 0) {
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        console.log("Card clicado!", card.dataset.title);
        const title = card.dataset.title;
        const img = card.dataset.img;
        const textElement = card.querySelector('.truncate-text');
        
        if (!textElement) {
          console.error("Erro: .truncate-text não encontrado no card", card);
          return;
        }

        const desc = textElement.innerText;

        document.getElementById('modalTitle').innerText = title;
        document.getElementById('modalImg').src = img;
        document.getElementById('modalDescription').innerText = desc;

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; 
      });
    });

    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    });

    window.addEventListener('click', (event) => {
      if (event.target == modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
    });
  } else {
    console.error("Modal ou cards não encontrados no DOM", { modal, cardsCount: cards.length });
  }
})();

  // Mobile Menu logic improved
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinksList = document.querySelector('.nav-links');
  const menuIcon = mobileMenuBtn ? mobileMenuBtn.querySelector('i') : null;

  if (mobileMenuBtn && navLinksList && menuIcon) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinksList.classList.toggle('active');
      const isActive = navLinksList.classList.contains('active');
      
      if (isActive) {
        menuIcon.classList.remove('fa-bars');
        menuIcon.classList.add('fa-xmark');
        document.body.style.overflow = 'hidden';
      } else {
        menuIcon.classList.remove('fa-xmark');
        menuIcon.classList.add('fa-bars');
        document.body.style.overflow = 'auto';
      }
    });

    // Fecha o menu ao clicar em um link (necessário para menus fullscreen)
    navLinksList.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinksList.classList.remove('active');
        menuIcon.classList.remove('fa-xmark');
        menuIcon.classList.add('fa-bars');
        document.body.style.overflow = 'auto';
      });
    });
  }


  // Top Navbar Transparent on Scroll
  document.addEventListener('scroll', () => {
      const headerObj = document.querySelector('header');
      if (headerObj) {
          headerObj.classList.toggle('scrolled', window.scrollY > 50);
      }
  });

