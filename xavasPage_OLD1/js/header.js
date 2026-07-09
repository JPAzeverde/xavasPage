  const menuBtn = document.getElementById('menu-header');
  const mainHeader = document.getElementById('main-header');

  menuBtn.addEventListener('click', () => {
    // Alterna a classe 'menu-open' no header
    mainHeader.classList.toggle('menu-open');
    
    if (mainHeader.classList.contains('menu-open')) {
      menuBtn.innerHTML = 'X';
    } else {
      menuBtn.innerHTML = 'menu';
    }
  });