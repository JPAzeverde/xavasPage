// Seleciona os elementos necessários
  const menuBtn = document.getElementById('menu-header');
  const mainHeader = document.getElementById('main-header');

  // Adiciona o evento de clique no botão
  menuBtn.addEventListener('click', () => {
    // Alterna a classe 'menu-open' no header
    mainHeader.classList.toggle('menu-open');
    
    // (Opcional) Altera o texto do botão para indicar estado
    if (mainHeader.classList.contains('menu-open')) {
      menuBtn.innerHTML = 'X';
    } else {
      menuBtn.innerHTML = 'menu';
    }
  });