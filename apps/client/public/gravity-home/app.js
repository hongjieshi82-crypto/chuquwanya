const iconGroups = {
  city: [
    '01-长城烽火台', '02-西湖石桥', '03-张家界峰林', '04-桂林竹筏', '05-故宫角楼', '06-九寨沟瀑布',
    '07-青岛海岸', '08-重庆轻轨', '09-上海天际线', '10-西安钟楼', '11-哈尔滨冰堡', '12-大理洱海',
  ],
  play: [
    '01-森林温泉', '02-雪山木屋', '03-沙漠营地', '04-茶园梯田', '05-金色稻田', '06-缤纷夜市',
    '07-当代美术馆', '08-海底隧道', '09-草原越野', '10-海边冲浪', '11-湖畔骑行', '12-灯笼古街',
  ],
  nature: [
    '01-薰衣草风车', '02-峡谷玻璃桥', '03-湖面皮划艇', '04-热带珊瑚岛', '05-发光溶洞', '06-樱花山地火车',
    '07-向日葵农场', '08-山顶天文台', '09-原始森林', '10-火山湖', '11-海岸悬崖', '12-高山木屋',
  ],
};

const allIcons = Object.entries(iconGroups).flatMap(([category, names]) =>
  names.map((name) => ({ category, name, src: `./assets/icons/${category}/${name}.avif` })),
);

function setupSectionObserver() {
  const sections = [...document.querySelectorAll('[data-section]')];
  const chapterNumber = document.querySelector('.chapter-number');
  const progress = document.querySelector('.chapter-line i');
  const setActive = (section) => {
    const key = section.dataset.section;
    const index = Number(section.dataset.index);
    document.querySelectorAll('[data-section-link], [data-dot]').forEach((link) => {
      link.classList.toggle('is-active', link.dataset.sectionLink === key || link.dataset.dot === key);
    });
    chapterNumber.textContent = String(index).padStart(2, '0');
    progress.style.height = `${(index / sections.length) * 100}%`;
  };
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActive(visible.target);
  }, { root: document.querySelector('.snap-stage'), threshold: [0.55, 0.72] });
  sections.forEach((section) => observer.observe(section));
  setActive(sections[0]);
}

function setupGravityField() {
  const field = document.querySelector('#gravity-field');
  const label = document.querySelector('#selected-label');
  if (!field || !window.Matter) {
    label.textContent = '物理引擎未加载，请检查网络后刷新';
    return;
  }

  const { Body, Bodies, Composite, Engine, Events } = Matter;
  const engine = Engine.create({ enableSleeping: true });
  // A noticeably weightier setup than Matter's default: quick fall, restrained bounce,
  // and very little "underwater" air resistance.
  engine.gravity.y = 2.7;
  engine.gravity.scale = 0.0015;
  const entries = [];
  let walls = [];
  let dragging = null;
  let activeEntry = null;
  let pointer = { x: -9999, y: -9999, active: false, lastX: 0, lastY: 0, lastTime: 0, vx: 0, vy: 0 };
  let frameId = 0;

  const sizeFor = (index) => {
    const width = field.clientWidth;
    const displayScale = 0.92;
    if (width < 640) return Math.round((64 + ((index * 17) % 30)) * displayScale);
    if (width < 980) return Math.round((80 + ((index * 19) % 36)) * displayScale);

    // Wide displays get genuinely substantial objects, not a thin row of tiny dots.
    const base = width >= 1800
      ? Math.min(180, Math.max(166, width * 0.06))
      : Math.min(160, Math.max(110, width * 0.085));
    return Math.round((base + ((index * 23) % Math.round(base * 0.34))) * displayScale);
  };

  allIcons.forEach((icon, index) => {
    const size = sizeFor(index);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gravity-ball';
    button.dataset.category = icon.category;
    button.style.setProperty('--size', `${size}px`);
    button.setAttribute('aria-label', icon.name.replace(/^\d+-/, ''));
    const image = document.createElement('img');
    image.src = icon.src;
    image.alt = '';
    image.draggable = false;
    button.append(image);
    field.append(button);

    const body = Bodies.circle(
      Math.random() * Math.max(field.clientWidth - 120, 160) + 60,
      48 + Math.random() * Math.max(field.clientHeight * 0.28, 130) - (index % 5) * 18,
      size / 2,
      { restitution: 0.32, friction: 0.16, frictionAir: 0.002, density: 0.0022, sleepThreshold: 42 },
    );
    Composite.add(engine.world, body);
    const entry = { body, element: button, icon, size };
    entries.push(entry);

    const activate = () => {
      if (activeEntry && activeEntry !== entry) activeEntry.element.classList.remove('is-active');
      activeEntry = entry;
      button.classList.add('is-active');
      label.textContent = icon.name.replace(/^\d+-/, '');
    };

    const deactivate = () => {
      if (dragging === entry) return;
      button.classList.remove('is-active');
      if (activeEntry === entry) activeEntry = null;
      label.textContent = '移动鼠标，发现一个旅行灵感';
    };

    button.addEventListener('pointerenter', activate);
    button.addEventListener('pointerleave', deactivate);
    button.addEventListener('focus', activate);
    button.addEventListener('blur', deactivate);

    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      activate();
      dragging = entry;
      pointer.active = true;
      pointer.lastX = event.clientX;
      pointer.lastY = event.clientY;
      pointer.lastTime = performance.now();
      Body.setStatic(body, true);
      Body.setPosition(body, pointerPosition(event));
      button.setPointerCapture?.(event.pointerId);
      label.textContent = icon.name.replace(/^\d+-/, '');
    });
  });

  function rebuildWalls() {
    Composite.remove(engine.world, walls);
    const width = field.clientWidth;
    const height = field.clientHeight;
    walls = [
      Bodies.rectangle(width / 2, height + 35, width + 160, 70, { isStatic: true }),
      Bodies.rectangle(-35, height / 2, 70, height * 2, { isStatic: true }),
      Bodies.rectangle(width + 35, height / 2, 70, height * 2, { isStatic: true }),
      Bodies.rectangle(width / 2, -150, width + 160, 40, { isStatic: true }),
    ];
    Composite.add(engine.world, walls);
  }

  function pointerPosition(event) {
    const rect = field.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  field.addEventListener('pointermove', (event) => {
    const next = pointerPosition(event);
    const now = performance.now();
    const elapsed = Math.max(now - pointer.lastTime, 16);
    pointer.vx = (event.clientX - pointer.lastX) / elapsed * 16;
    pointer.vy = (event.clientY - pointer.lastY) / elapsed * 16;
    pointer.x = next.x;
    pointer.y = next.y;
    pointer.lastX = event.clientX;
    pointer.lastY = event.clientY;
    pointer.lastTime = now;
    if (dragging) Body.setPosition(dragging.body, next);
  });
  field.addEventListener('pointerenter', () => { pointer.active = true; });
  field.addEventListener('pointerleave', () => { if (!dragging) pointer.active = false; });

  const release = () => {
    if (!dragging) return;
    const releasedEntry = dragging;
    Body.setStatic(dragging.body, false);
    Body.setVelocity(dragging.body, { x: pointer.vx * 0.72, y: pointer.vy * 0.72 });
    dragging = null;
    releasedEntry.element.classList.remove('is-active');
    if (activeEntry === releasedEntry) activeEntry = null;
    label.textContent = '移动鼠标，发现一个旅行灵感';
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);

  Events.on(engine, 'beforeUpdate', () => {
    if (!pointer.active || dragging) return;
    const influenceRadius = Math.min(250, Math.max(165, field.clientWidth * 0.075));
    entries.forEach(({ body }) => {
      const dx = body.position.x - pointer.x;
      const dy = body.position.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 4 && distance < influenceRadius) {
        const strength = (1 - distance / influenceRadius) * 0.00012 * body.mass;
        Body.applyForce(body, body.position, { x: dx / distance * strength, y: dy / distance * strength });
      }
    });
  });

  function render() {
    Engine.update(engine, 1000 / 60);
    entries.forEach(({ body, element, size }) => {
      element.style.transform = `translate3d(${body.position.x - size / 2}px, ${body.position.y - size / 2}px, 0) rotate(${body.angle}rad)`;
    });
    frameId = requestAnimationFrame(render);
  }

  function reshuffle() {
    entries.forEach(({ body }, index) => {
      Body.setStatic(body, false);
      Body.setPosition(body, {
        x: 55 + Math.random() * Math.max(field.clientWidth - 110, 100),
        y: 32 + Math.random() * Math.max(field.clientHeight * 0.2, 100) - (index % 6) * 24,
      });
      Body.setVelocity(body, { x: (Math.random() - .5) * 10, y: 2 + Math.random() * 4 });
      Body.setAngularVelocity(body, (Math.random() - .5) * .14);
    });
    label.textContent = '36 个旅行灵感重新落下';
  }

  document.querySelector('#shuffle-button').addEventListener('click', reshuffle);
  window.addEventListener('resize', rebuildWalls);
  rebuildWalls();
  render();
  window.addEventListener('pagehide', () => cancelAnimationFrame(frameId), { once: true });
}

setupSectionObserver();
setupGravityField();
