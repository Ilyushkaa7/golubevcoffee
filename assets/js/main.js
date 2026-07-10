document.addEventListener('DOMContentLoaded', () => {

  // Загружаем шапку и навигацию на всех страницах
  loadHeader();
  loadNav();

  // Загрузчик хедера
  function loadHeader() {
    fetch('components/header.html')
      .then(res => res.text())
      .then(html => {
        if (!document.getElementById('siteHeader')) {
          document.body.insertAdjacentHTML('afterbegin', html);
          document.body.classList.add('has-header');
        }
        initBurger();
        initHeaderScroll();
      })
      .catch(err => console.log('Ошибка загрузки хедера:', err));
  }

  // Загрузчик навигации
  function loadNav() {
    fetch('components/nav.html')
      .then(res => res.text())
      .then(html => {
        if (!document.getElementById('navOverlay')) {
          document.body.insertAdjacentHTML('beforeend', html);
        }
        // Переинициализируем бургер, так как overlay создался в DOM
        initBurger();
        initNavPreview();
      })
      .catch(err => console.log('Ошибка загрузки навигации:', err));
  }

  // Эффект скролла хедера
  function initHeaderScroll() {
    const header = document.getElementById('siteHeader');
    if (!header) return;

    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 10);
    });
  }

  // Логика Бургер-меню
  function initBurger() {
    const burger = document.getElementById('burgerBtn');
    const overlay = document.getElementById('navOverlay');

    if (!burger || !overlay) return;

    // Очищаем старые слушатели, чтобы не было дублирования при повторном вызове
    const newBurger = burger.cloneNode(true);
    burger.parentNode.replaceChild(newBurger, burger);

    newBurger.addEventListener('click', (e) => {
      e.stopPropagation();
      newBurger.classList.toggle('open');
      overlay.classList.toggle('open');
      document.body.classList.toggle('no-scroll');
    });

    overlay.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        newBurger.classList.remove('open');
        overlay.classList.remove('open');
        document.body.classList.remove('no-scroll');
      });
    });
  }

  function initNavPreview() {
    const overlay = document.getElementById('navOverlay');
    const previewImage = document.getElementById('navPreviewImage');
    const previewLabel = document.getElementById('navPreviewLabel');
    const previewLinks = overlay ? overlay.querySelectorAll('[data-preview]') : [];
    const defaultLabel = 'Наведи курсор на пункт меню';

    previewLinks.forEach(link => {
      const previewName = link.getAttribute('data-preview');
      const labelText = link.textContent.trim();

      link.addEventListener('mouseenter', () => {
        if (previewImage) {
          previewImage.style.backgroundImage = previewName ? `url("assets/images/optimized/${previewName}")` : 'none';
        }
        if (previewLabel) {
          previewLabel.textContent = labelText;
        }
      });

      link.addEventListener('mouseleave', () => {
        if (previewImage) {
          previewImage.style.backgroundImage = 'none';
        }
        if (previewLabel) {
          previewLabel.textContent = defaultLabel;
        }
      });
    });
  }

  // Смена фона при наведении в меню навигации
  /* ==========================================================================
     ОБНОВЛЕННАЯ ФИЛЬТРАЦИЯ МЕНЮ (Десктоп + Мобильный кастомный селект)
     ========================================================================== */
  const filters = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.menu-grid .card');
  const combo = document.querySelector('.combo-section');
  
  // Элементы нового кастомного селекта
  const customTrigger = document.querySelector('.custom-select-trigger');
  const customOptionsWrapper = document.querySelector('.custom-select-options');
  const customOptions = document.querySelectorAll('.custom-option');

  function applyFilter(filterValue) {
    // Скрытие/показ комбо-предложений (показываем только если выбрано "all")
    if (combo) {
      combo.classList.toggle('hidden', filterValue !== 'all');
    }

    // Скрытие/показ карточек товаров через твой класс .hidden
    cards.forEach(card => {
      const match = filterValue === 'all' || card.dataset.category === filterValue;
      card.classList.toggle('hidden', !match);
    });

    // Синхронизируем десктопные кнопки
    filters.forEach(b => {
      if (b.dataset.filter === filterValue) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    // Синхронизируем кастомный мобильный селект (визуальный активный класс)
    customOptions.forEach(opt => {
      if (opt.getAttribute('data-value') === filterValue) {
        opt.classList.add('active');
        if (customTrigger) {
          customTrigger.querySelector('span').textContent = opt.textContent;
        }
      } else {
        opt.classList.remove('active');
      }
    });
  }

  // Логика работы кастомного выпадающего меню
  if (customTrigger && customOptionsWrapper) {
    customTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      customOptionsWrapper.classList.toggle('open');
      customTrigger.classList.toggle('active');
    });

    customOptions.forEach(option => {
      option.addEventListener('click', function() {
        const value = this.getAttribute('data-value');
        applyFilter(value);
        customOptionsWrapper.classList.remove('open');
        customTrigger.classList.remove('active');
      });
    });

    // Закрываем кастомный селект при клике в любое пустое место экрана
    document.addEventListener('click', () => {
      customOptionsWrapper.classList.remove('open');
      customTrigger.classList.remove('active');
    });
  }

  // Доступная глобальная фильтрация для кнопок и маркеров
  window.filterCategory = applyFilter;

  // Слушатель для десктопных кнопок
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      applyFilter(filter);
    });
  });

  // Инициализация карты Leaflet
  initMap();

  function initMap() {
    const el = document.getElementById('map');
    if (!el) return;

    if (typeof L === 'undefined') {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);

      const js = document.createElement('script');
      js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      js.onload = () => renderMap(el);
      document.head.appendChild(js);
    } else {
      renderMap(el);
    }
  }

  function renderMap(container) {
    const map = L.map(container, {
      center: [56.9951, 40.9815],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      {
        subdomains: 'abcd',
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }
    ).addTo(map);

    const icon = L.divIcon({
      className: 'coffee-marker',
      html: `
        <div style="
          background:#6F4E37;
          width:40px;
          height:40px;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 4px 12px rgba(0,0,0,0.3);
        ">
          <span style="
            transform:rotate(45deg);
            font-size:20px;
            line-height:1;
          ">☕</span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });

    L.marker([56.9951, 40.9815], { icon: icon })
      .addTo(map)
      .bindPopup('<b>Golubev Coffee</b><br>г. Иваново');
  }
  
});
