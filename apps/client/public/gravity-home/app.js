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

function setupAppNavigationBridge() {
  if (window.parent === window) return;

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[target="_top"]');
    if (!anchor || anchor.origin !== window.location.origin) return;
    event.preventDefault();
    window.parent.postMessage({
      type: 'gravity-home:navigate',
      href: `${anchor.pathname}${anchor.search}${anchor.hash}`,
    }, window.location.origin);
  });
}

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
  if (!field || !window.Matter) return;

  const { Body, Bodies, Composite, Engine, Events, Sleeping } = Matter;
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
  const supportsCursorFlick = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const pointerRadius = Math.min(82, Math.max(44, field.clientWidth * 0.028));
  const pointerBody = Bodies.circle(-9999, -9999, pointerRadius, {
    isStatic: true,
    restitution: 0.18,
    friction: 0.12,
    frictionStatic: 0.1,
    collisionFilter: { category: 0x0002, mask: 0x0001 },
  });
  Composite.add(engine.world, pointerBody);

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
      {
        restitution: 0.32,
        friction: 0.16,
        frictionAir: 0.002,
        density: 0.0022,
        sleepThreshold: 42,
        collisionFilter: { category: 0x0001, mask: 0x0003 },
      },
    );
    Composite.add(engine.world, body);
    const entry = { body, element: button, icon, size };
    entries.push(entry);

    const activate = () => {
      if (activeEntry && activeEntry !== entry) activeEntry.element.classList.remove('is-active');
      activeEntry = entry;
      button.classList.add('is-active');
      pointerBody.collisionFilter.mask = 0;
    };

    const deactivate = () => {
      if (dragging === entry) return;
      button.classList.remove('is-active');
      if (activeEntry === entry) activeEntry = null;
      if (!activeEntry) pointerBody.collisionFilter.mask = 0x0001;
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

  window.addEventListener('pointermove', (event) => {
    const fieldRect = field.getBoundingClientRect();
    const isInsideField = event.clientX >= fieldRect.left
      && event.clientX <= fieldRect.right
      && event.clientY >= fieldRect.top
      && event.clientY <= fieldRect.bottom;
    if (!isInsideField && !dragging) {
      pointer.active = false;
      Body.setPosition(pointerBody, { x: -9999, y: -9999 });
      Body.setVelocity(pointerBody, { x: 0, y: 0 });
      return;
    }

    pointer.active = true;
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
    const pointerSpeed = Math.hypot(pointer.vx, pointer.vy);
    const canFlick = supportsCursorFlick && !activeEntry && !dragging && pointerSpeed >= 1.4;
    if (canFlick) {
      pointerBody.collisionFilter.mask = 0x0001;
      Body.setPosition(pointerBody, next);
      Body.setVelocity(pointerBody, { x: pointer.vx, y: pointer.vy });
    } else {
      pointerBody.collisionFilter.mask = 0;
      Body.setPosition(pointerBody, { x: -9999, y: -9999 });
      Body.setVelocity(pointerBody, { x: 0, y: 0 });
    }
    if (dragging) Body.setPosition(dragging.body, next);
    if (!canFlick) return;

    entries.forEach((entry) => {
      if (dragging === entry || activeEntry === entry) return;
      const dx = entry.body.position.x - next.x;
      const dy = entry.body.position.y - next.y;
      const distance = Math.hypot(dx, dy);
      const contactDistance = pointerRadius + entry.size / 2;
      if (distance >= contactDistance) return;

      const fallbackLength = Math.max(pointerSpeed, 1);
      const normalX = distance > 0.01 ? dx / distance : pointer.vx / fallbackLength;
      const normalY = distance > 0.01 ? dy / distance : pointer.vy / fallbackLength;
      const overlap = contactDistance - distance;
      const contactImpulse = Math.min(14, 4.8 + pointerSpeed * 0.8);
      Sleeping.set(entry.body, false);
      Body.translate(entry.body, {
        x: normalX * overlap * 0.72,
        y: normalY * overlap * 0.72,
      });
      Body.setVelocity(entry.body, {
        x: entry.body.velocity.x * 0.68 + pointer.vx * 0.82 + normalX * contactImpulse,
        y: entry.body.velocity.y * 0.68 + pointer.vy * 0.82 + normalY * contactImpulse,
      });
    });
  });
  field.addEventListener('pointerleave', () => {
    if (!dragging) {
      pointer.active = false;
      Body.setPosition(pointerBody, { x: -9999, y: -9999 });
      Body.setVelocity(pointerBody, { x: 0, y: 0 });
    }
  });

  const release = () => {
    if (!dragging) return;
    const releasedEntry = dragging;
    Body.setStatic(dragging.body, false);
    Body.setVelocity(dragging.body, { x: pointer.vx * 0.72, y: pointer.vy * 0.72 });
    dragging = null;
    releasedEntry.element.classList.remove('is-active');
    if (activeEntry === releasedEntry) activeEntry = null;
    pointerBody.collisionFilter.mask = 0x0001;
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);

  Events.on(engine, 'beforeUpdate', () => {
    if (!supportsCursorFlick || !pointer.active || dragging || activeEntry || Math.hypot(pointer.vx, pointer.vy) < 1.1) return;
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
  }

  document.querySelector('#shuffle-button').addEventListener('click', reshuffle);
  window.addEventListener('resize', rebuildWalls);
  rebuildWalls();
  render();
  window.addEventListener('pagehide', () => cancelAnimationFrame(frameId), { once: true });
}

setupSectionObserver();
setupGravityField();
setupAppNavigationBridge();
