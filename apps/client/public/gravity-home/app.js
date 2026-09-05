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
    if (event.defaultPrevented) return;
    const anchor = event.target.closest('a[target="_top"]');
    if (!anchor || anchor.origin !== window.location.origin) return;
    event.preventDefault();
    window.parent.postMessage({
      type: 'gravity-home:navigate',
      href: `${anchor.pathname}${anchor.search}${anchor.hash}`,
    }, window.location.origin);
  });
}

function setupPrimaryAuthAction() {
  const button = document.querySelector('#nav-primary-action');
  if (!button) return;
  const isRegistered = new URLSearchParams(window.location.search).get('auth') === 'registered';
  const href = isRegistered ? '/box/config' : '/pc-login';
  button.textContent = isRegistered ? '立即抽取' : '立即登录';
  button.setAttribute('aria-label', button.textContent);
  button.addEventListener('click', () => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'gravity-home:navigate', href }, window.location.origin);
    } else {
      window.location.href = href;
    }
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

  const visibleIcons = window.innerWidth <= 760 ? allIcons.filter((_, index) => index % 4 !== 3) : allIcons;
  visibleIcons.forEach((icon, index) => {
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
      // Touch keeps native page scrolling. The whole pool receives swipe inertia below.
      if (event.pointerType === 'touch') return;
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

  const scrollStage = document.querySelector('.snap-stage');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let swipe = null;
  let lastStageScroll = scrollStage?.scrollTop ?? 0;
  let lastStageTime = performance.now();
  const clampImpulse = (value) => Math.max(-10, Math.min(10, value));
  const movePool = (vx, vy) => {
    if (window.innerWidth > 760 || reducedMotion.matches || !scrollStage || scrollStage.scrollTop >= field.closest('.hero-screen').offsetHeight) return;
    entries.forEach(({ body }, index) => {
      if (body.isStatic) return;
      Sleeping.set(body, false);
      const weight = .65 + (index % 5) * .08;
      Body.setVelocity(body, {
        x: clampImpulse(body.velocity.x + vx * weight),
        y: clampImpulse(body.velocity.y + vy * weight),
      });
      Body.setAngularVelocity(body, clampImpulse(vx) * .012);
    });
  };
  const onTouchStart = (event) => {
    const touch = event.touches.length === 1 ? event.touches[0] : null;
    swipe = touch ? { x: touch.clientX, y: touch.clientY, time: performance.now() } : null;
  };
  const onTouchMove = (event) => {
    if (!swipe || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const now = performance.now();
    const dt = Math.max(now - swipe.time, 16);
    movePool(clampImpulse((touch.clientX - swipe.x) / dt * 16) * .35,
      clampImpulse((touch.clientY - swipe.y) / dt * 16) * .55);
    swipe = { x: touch.clientX, y: touch.clientY, time: now };
  };
  const onTouchEnd = () => { swipe = null; };
  const onPoolScroll = () => {
    const now = performance.now();
    const next = scrollStage.scrollTop;
    if (!swipe) movePool(0, clampImpulse((lastStageScroll - next) / Math.max(now - lastStageTime, 16) * 16) * .4);
    lastStageScroll = next;
    lastStageTime = now;
  };
  scrollStage?.addEventListener('touchstart', onTouchStart, { passive: true });
  scrollStage?.addEventListener('touchmove', onTouchMove, { passive: true });
  scrollStage?.addEventListener('touchend', onTouchEnd, { passive: true });
  scrollStage?.addEventListener('touchcancel', onTouchEnd, { passive: true });
  scrollStage?.addEventListener('scroll', onPoolScroll, { passive: true });
  window.addEventListener('pagehide', () => {
    scrollStage?.removeEventListener('touchstart', onTouchStart);
    scrollStage?.removeEventListener('touchmove', onTouchMove);
    scrollStage?.removeEventListener('touchend', onTouchEnd);
    scrollStage?.removeEventListener('touchcancel', onTouchEnd);
    scrollStage?.removeEventListener('scroll', onPoolScroll);
  }, { once: true });

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
  const fieldObserver = new ResizeObserver(rebuildWalls);
  fieldObserver.observe(field);
  rebuildWalls();
  render();
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frameId); fieldObserver.disconnect(); }, { once: true });
}

function setupMobileHeroLayout() {
  const copy = document.querySelector('.hero-copy');
  const hero = document.querySelector('.hero-screen');
  if (!copy || !hero) return;
  const update = () => {
    if (window.innerWidth > 760) return;
    hero.style.setProperty('--mobile-ball-top', `${copy.offsetTop + copy.offsetHeight + 18}px`);
  };
  const observer = new ResizeObserver(update);
  observer.observe(copy);
  window.addEventListener('resize', update);
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  update();
}

function setupScrollStory() {
  const stage = document.querySelector('.snap-stage');
  const stylesSection = document.querySelector('.styles-screen');
  const lanes = [...document.querySelectorAll('[data-motion-lane]')];
  const cards = [...document.querySelectorAll('.place-card')];
  const placesSection = document.querySelector('.places-screen');
  const placesSticky = document.querySelector('.places-sticky');
  const placesHeading = document.querySelector('.places-heading');
  const placeGrid = document.querySelector('.place-grid');
  if (!stage || !stylesSection) return;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const sectionProgress = (section) => {
    const distance = Math.max(section.offsetHeight - stage.clientHeight, 1);
    return clamp((stage.scrollTop - section.offsetTop) / distance);
  };
  let frame = 0;
  let previewIndex = null;
  let previousScrollTop = stage.scrollTop;

  const update = () => {
    frame = 0;
    if (stage.clientWidth <= 760) {
      placesSection?.style.removeProperty('height');
      placesSection?.style.removeProperty('min-height');
      placesSection?.style.removeProperty('margin-bottom');
      cards.forEach((card) => card.classList.add('is-active'));
      return;
    }
    const galleryProgress = clamp(sectionProgress(stylesSection) / .78);
    const galleryTravel = Math.min(stage.clientWidth * .09, 150);
    lanes.forEach((lane, index) => {
      if (stylesSection.classList.contains('is-static-grid')) {
        lane.style.removeProperty('transform');
        return;
      }
      const direction = Number(lane.dataset.direction) || 1;
      const horizontalOffset = (galleryProgress - .5) * galleryTravel * direction * (1 + index * .08);
      lane.style.transform = `translate3d(${horizontalOffset}px, 0, 0)`;
    });

    if (placesSection && placeGrid && cards.length) {
      const rawStackProgress = sectionProgress(placesSection);
      const stackProgress = clamp((rawStackProgress - .04) / .7);
      const placesScrollDistance = Math.max(placesSection.offsetHeight - stage.clientHeight, 1);
      const detailScrollStart = placesSection.offsetTop + placesScrollDistance * .89;
      const detailScrollPixels = Math.max(0, stage.scrollTop - detailScrollStart);
      const placesEnd = placesSection.offsetTop + placesScrollDistance;
      stage.classList.toggle(
        'is-natural-card-detail',
        rawStackProgress >= .72 && stage.scrollTop < placesEnd - 2,
      );
      const total = stackProgress * (cards.length - 1);
      const gridHeight = placeGrid.getBoundingClientRect().height;
      const measuredHeaderHeight = Math.max(...cards.map((card) => {
        const cardRect = card.getBoundingClientRect();
        const stackStopRect = card.querySelector('.place-card-stack-stop')?.getBoundingClientRect();
        if (stackStopRect) return stackStopRect.bottom - cardRect.top;
        const numberRect = card.querySelector('.place-card-top').getBoundingClientRect();
        const copyRect = card.querySelector('.place-card-copy').getBoundingClientRect();
        return Math.max(numberRect.bottom, copyRect.bottom) - cardRect.top;
      }));
      const peek = Math.ceil(measuredHeaderHeight);
      const bottomGap = stage.clientWidth <= 640 ? 18 : 36;
      const stickyPaddingTop = placesSticky ? parseFloat(getComputedStyle(placesSticky).paddingTop) || 0 : 0;
      const gridWidth = placeGrid.getBoundingClientRect().width;
      const adaptiveCardHeight = stage.clientWidth <= 640
        ? clamp(stage.clientHeight * .72, 480, 620)
        : clamp(gridWidth * .41, 560, 820);
      const cardHeight = Math.min(
        adaptiveCardHeight,
        (placesSticky?.clientHeight ?? stage.clientHeight) - stickyPaddingTop - bottomGap,
      );
      const displayCardHeight = cardHeight;
      placeGrid.style.setProperty('--weekend-card-height', `${displayCardHeight}px`);
      const activeIndex = previewIndex ?? Math.min(cards.length - 1, Math.floor(total + .5));
      cards.forEach((card, index) => {
        const initialY = index === 0 ? 0 : displayCardHeight + (index - 1) * peek;
        const linearArrival = previewIndex === null
          ? (index === 0 ? 1 : clamp(total - (index - 1)))
          : (index <= previewIndex ? 1 : 0);
        const arrival = linearArrival * linearArrival * (3 - 2 * linearArrival);
        const targetY = index * peek;
        const y = initialY - arrival * (initialY - targetY);
        card.style.removeProperty('height');
        card.style.zIndex = String(index + 1);
        const hoverScale = previewIndex === index ? 1.01 : 1;
        card.style.transform = `translate3d(0, ${y}px, 0) scale(${hoverScale})`;
        card.classList.toggle('is-active', index === activeIndex);
      });
      const revealedIndex = previewIndex ?? cards.length - 1;
      const headingLift = Math.max(0, placeGrid.offsetTop - stickyPaddingTop);
      const requiredGridOffset = headingLift + revealedIndex * peek;
      const finalGridOffset = headingLift + (cards.length - 1) * peek;
      const trailingSpace = 60;
      const requiredScrollDistance = (finalGridOffset + trailingSpace) / .11;
      const requiredSectionHeight = Math.ceil(stage.clientHeight + requiredScrollDistance);
      if (Math.abs(placesSection.offsetHeight - requiredSectionHeight) > 1) {
        placesSection.style.height = `${requiredSectionHeight}px`;
        placesSection.style.minHeight = `${requiredSectionHeight}px`;
      }
      const finalCardBottom = stickyPaddingTop + displayCardHeight;
      const emptySpaceBelowFinalCard = Math.max(0, (placesSticky?.clientHeight ?? stage.clientHeight) - finalCardBottom);
      const nextSectionOverlap = Math.max(0, emptySpaceBelowFinalCard - trailingSpace);
      placesSection.style.marginBottom = `${-nextSectionOverlap}px`;
      const gridOffset = previewIndex === null
        ? Math.min(requiredGridOffset, detailScrollPixels)
        : requiredGridOffset;
      const revealProgress = previewIndex === null
        ? clamp(detailScrollPixels / Math.max(requiredGridOffset, 1))
        : 1;
      placeGrid.style.transform = `translate3d(0, ${-gridOffset}px, 0)`;
      if (placesHeading) {
        placesHeading.style.opacity = String(1 - revealProgress);
        placesHeading.style.transform = `translate3d(0, ${-revealProgress * (placesHeading.offsetHeight + 24)}px, 0)`;
        placesHeading.style.pointerEvents = revealProgress > .2 ? 'none' : 'auto';
      }
      placesSticky?.classList.toggle('is-previewing-card', previewIndex !== null);
    }
  };

  const requestUpdate = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  stage.addEventListener('scroll', () => {
    if (Math.abs(stage.scrollTop - previousScrollTop) > 2) previewIndex = null;
    previousScrollTop = stage.scrollTop;
    requestUpdate();
  }, { passive: true });
  window.addEventListener('resize', requestUpdate);
  cards.forEach((card, index) => {
    card.addEventListener('click', (event) => {
      if (event.target.closest('.place-add-trip,.place-open-detail')) return;
      previewIndex = index;
      requestUpdate();
    });
  });
  update();
}

function upgradeWeekendGuideCards() {
  const cards = [...document.querySelectorAll('.place-card')];
  const metricPresets = [
    ['3.8', 'KM', '3.5', 'H', '¥80', '/ 人'],
    ['4.2', 'KM', '3', 'H', '¥120', '/ 人'],
    ['6.6', 'KM', '4', 'H', '¥150', '/ 人'],
    ['2.9', 'KM', '3', 'H', '¥90', '/ 人'],
  ];
  const tags = [
    ['少走路', '不早起', '适合独处', '拍照好看'],
    ['城市漫游', '轻松拍照', '适合两人', '不赶时间'],
    ['湖畔骑行', '日落计划', '轻户外', '视野开阔'],
    ['茶馆闲坐', '慢节奏', '城市观察', '雨天可去'],
  ];
  const subtitles = [
    '一条不用赶路的半日散步线',
    '用相机收集街区里的颜色和细节',
    '把终点交给当天最好看的那束光',
    '喝盖碗茶、看人下棋，把时间慢下来',
  ];

  cards.forEach((card, index) => {
    const order = card.dataset.order || String(index + 1).padStart(2, '0');
    const category = card.querySelector('.place-card-copy small')?.textContent?.trim() || '城市漫游';
    const facts = card.querySelector('.place-card-facts')?.textContent?.trim() || '';
    const title = card.querySelector('.place-card-copy h3')?.textContent?.trim() || '';
    const steps = [...card.querySelectorAll('.guide-checklist li span')].map((node) => node.textContent?.trim() || '');
    const images = [...card.querySelectorAll('.place-media img')].map((image) => ({ src: image.getAttribute('src') || '', alt: image.getAttribute('alt') || '' }));
    const city = facts.split('·')[0]?.trim() || '北京';
    const metric = metricPresets[index] || metricPresets[0];
    const cardTags = tags[index] || tags[0];
    card.innerHTML = `
      <div class="card-visual">
        <img src="${images[0]?.src || ''}" alt="${images[0]?.alt || title}" />
        <div class="image-shade"></div>
        <div class="visual-top"><span>ROUTE <b>${order}</b></span><span>${city.toUpperCase()} · CITY ROUTE</span></div>
        <div class="visual-index">${order}</div>
        <div class="visual-copy">
          <div class="cover-kicker"><span>${category}</span><em>CITY ESCAPE</em></div>
          <h2>${title}</h2>
          <div class="cover-caption"><span class="status"><i></i> 本周六正合适</span><p>${subtitles[index] || subtitles[0]}</p></div>
        </div>
        <span class="photo-note">氛围示意图</span>
      </div>
      <div class="card-content">
        <div class="plan-meta place-card-stack-stop"><span><b>${metric[0]}</b> ${metric[1]}</span><span><b>${metric[2]}</b> ${metric[3]}</span><span><b>${metric[4]}</b> ${metric[5]}</span></div>
        <div class="tags">${cardTags.map((tag) => `<span>${tag}</span>`).join('')}</div>
        <div class="mini-route"><div class="route-line"></div>${steps.map((step, stepIndex) => `<div class="mini-stop${stepIndex === 1 ? ' hot' : ''}"><time>${['14:30', '15:20', '16:40'][stepIndex]}</time><i></i><div><b>${step}</b><small>${['先慢下来，给城市留在身后', '今日高光 · 按喜欢的节奏往前走', '留下一张照片，什么也不用赶'][stepIndex]}</small></div></div>`).join('')}</div>
        <div class="why"><span>为什么推荐</span><p>路线节奏松弛，树荫多、坡度低，第一次去也不用担心绕远。</p></div>
        <div class="card-actions"><span class="secondary place-open-detail" role="button" tabindex="0">看看完整路线</span><span class="primary place-add-trip" role="button" tabindex="0">加入我的行程</span></div>
        <div class="place-card-copy"><div class="place-card-label-row"><small>${category}</small><span class="place-card-facts">${facts}</span></div><h3>${title}</h3><p>${subtitles[index] || subtitles[0]}</p></div>
        <div class="guide-body"><ol class="guide-checklist">${steps.map((step) => `<li><span>${step}</span></li>`).join('')}</ol></div>
        <div class="place-media">${images.map((image) => `<img src="${image.src}" alt="${image.alt}" />`).join('')}</div>
      </div>`;
  });
}

function setupCityRecommendations() {
  const forms = [...document.querySelectorAll('.city-switcher')];
  const inputs = [...document.querySelectorAll('[data-city-input]')];
  const cityLabel = document.querySelector('[data-current-city]');
  const cards = [...document.querySelectorAll('.place-card')];
  const categoryButtons = [...document.querySelectorAll('[data-play-category]')];
  const refreshButton = document.querySelector('#places-refresh');
  const stage = document.querySelector('.snap-stage');
  const placesSection = document.querySelector('.places-screen');
  const categoryModal = document.querySelector('#category-draw-modal');
  const categoryModalTitle = document.querySelector('#category-draw-title');
  const categoryCity = document.querySelector('[data-category-city]');
  const partyField = document.querySelector('[data-party-field]');
  const fixedParty = document.querySelector('[data-fixed-party]');
  const categorySubmit = document.querySelector('#category-draw-submit');
  if (cards.length !== 4) return;

  const image = (name) => `/media/travel/${name}.jpg`;
  const catalog = {
    '北京': [
      ['公园漫游', '在奥森盲走一段林间路', '1 天 · 2 人', ['beijing-olympic-forest', 'beijing-wudaoying-hutong', 'beijing-798-art-district']],
      ['胡同漫游', '在五道营胡同随机转三次弯', '1 天 · 1–3 人', ['beijing-wudaoying-hutong', 'beijing-zhuanta-hutong', 'beijing']],
      ['艺术搜集', '去 798 只看一种颜色的作品', '1 天 · 1–4 人', ['beijing-798-art-district', 'beijing-olympic-forest', 'beijing-zhuanta-hutong']],
      ['城市人文', '用两天收集北京的新与旧', '2 天 · 2 人', ['beijing-zhuanta-hutong', 'beijing-cbd', 'beijing-cbd']],
    ],
    '上海': [
      ['城市漫游', '去武康路收集五种城市颜色', '1 天 · 2 人', ['shanghai-wukang-road', 'shanghai-xuhui-riverside', 'shanghai']],
      ['滨江散步', '在徐汇滨江等一场蓝调时刻', '1 天 · 1–2 人', ['shanghai-xuhui-riverside', 'shanghai', 'shanghai-wukang-road']],
      ['建筑探索', '沿梧桐区只找圆形的建筑细节', '1 天 · 2 人', ['shanghai-wukang-road', 'tianjin-five-avenues', 'shanghai-xuhui-riverside']],
      ['城市切片', '用两天从老街走到江边夜景', '2 天 · 2 人', ['shanghai', 'shanghai-wukang-road', 'shanghai-xuhui-riverside']],
    ],
    '杭州': [
      ['湖畔骑行', '骑到西湖边等一场日落', '1 天 · 2 人', ['hangzhou', 'wuhan-east-lake-greenway', 'xiamen-huandao-road']],
      ['湖边慢走', '沿西湖只走没走过的小路', '1 天 · 1–2 人', ['hangzhou', 'kunming-cuihu-park', 'wuhan-east-lake-greenway']],
      ['早起计划', '赶在人群之前看一次西湖晨光', '1 天 · 2 人', ['hangzhou', 'jinan-qushuiting-daming-lake', 'wuhan-east-lake-greenway']],
      ['山水周末', '用两天在湖景与老街之间切换', '2 天 · 2 人', ['hangzhou', 'nanjing-lingyuan-road', 'kunming-cuihu-park']],
    ],
    '成都': [
      ['茶馆闲坐', '在人民公园消磨一个下午', '1 天 · 2 人', ['chengdu-people-park', 'chengdu', 'chongqing-shancheng-alley']],
      ['城市观察', '坐在茶馆里记下五种成都声音', '1 天 · 1–2 人', ['chengdu-people-park', 'jinan-qushuiting-daming-lake', 'chengdu']],
      ['街巷寻味', '只点没吃过的三样小吃', '1 天 · 2–4 人', ['chengdu', 'guangzhou-yongqingfang', 'chengdu-people-park']],
      ['松弛周末', '用两天把时间调成成都速度', '2 天 · 2 人', ['chengdu', 'chengdu-people-park', 'chongqing-shancheng-alley']],
    ],
    '广州': [
      ['西关夜游', '在永庆坊吃一场西关夜游', '1 天 · 2 人', ['guangzhou-yongqingfang', 'guangzhou', 'shenzhen']],
      ['骑楼漫游', '只沿着骑楼的阴影往前走', '1 天 · 1–2 人', ['guangzhou-yongqingfang', 'guangzhou', 'shanghai-wukang-road']],
      ['寻味任务', '每人只选一样没吃过的广式小吃', '1 天 · 2–4 人', ['guangzhou-yongqingfang', 'chengdu-people-park', 'guangzhou']],
      ['岭南周末', '用两天从老城烟火走到珠江夜色', '2 天 · 2 人', ['guangzhou', 'guangzhou-yongqingfang', 'shenzhen']],
    ],
    '深圳': [
      ['城市风景', '登上莲花山看城市亮灯', '1 天 · 2 人', ['shenzhen-lianhuashan', 'shenzhen', 'hefei-swan-lake']],
      ['滨海漫游', '在海风里走到天色变蓝', '1 天 · 1–2 人', ['shenzhen', 'xiamen-huandao-road', 'shenzhen-lianhuashan']],
      ['公园任务', '去城市中心找一条没走过的绿道', '1 天 · 2 人', ['shenzhen-lianhuashan', 'wuhan-east-lake-greenway', 'shenzhen']],
      ['山海周末', '用两天从城市山顶走到海边', '2 天 · 2 人', ['shenzhen', 'shenzhen-lianhuashan', 'xiamen']],
    ],
  };
  const cityProfiles = {
    '北京': [
      ['奥森林间', '五道营胡同', '798 艺术区', '砖塔胡同', '故宫角楼', '景山中轴线', '什刹海', '国贸 CBD', '首钢园'],
      ['beijing-olympic-forest', 'beijing-wudaoying-hutong', 'beijing-798-art-district', 'beijing-zhuanta-hutong', 'beijing', 'beijing-jingshan', 'beijing-shichahai', 'beijing-cbd', 'beijing-shougang'],
    ],
    '上海': [['武康路', '徐汇滨江', '外滩夜景'], ['shanghai-wukang-road', 'shanghai-xuhui-riverside', 'shanghai']],
    '杭州': [['西湖北山街', '湖畔绿道', '老街茶馆'], ['hangzhou', 'wuhan-east-lake-greenway', 'jinan-qushuiting-daming-lake']],
    '深圳': [['莲花山', '滨海步道', '福田夜景'], ['shenzhen-lianhuashan', 'shenzhen', 'hefei-swan-lake']],
    '天津': [['五大道', '海河沿岸', '民园广场'], ['tianjin-five-avenues', 'tianjin', 'tianjin-five-avenues']],
    '烟台': [['海边灯塔', '老城街巷', '滨海日落'], ['yantai', 'tianjin-five-avenues', 'xiamen-huandao-road']],
    '青岛': [['八大关', '海边栈道', '老城红瓦'], ['qingdao-badaguan', 'qingdao', 'shanghai-wukang-road']],
    '南京': [['陵园路', '民国建筑群', '梧桐树影'], ['nanjing-lingyuan-road', 'nanjing', 'nanjing-lingyuan-road']],
    '武汉': [['东湖绿道', '汉口老建筑', '江滩日落'], ['wuhan-east-lake-greenway', 'wuhan', 'hefei-swan-lake']],
    '成都': [['人民公园', '老茶馆', '城市与雪山'], ['chengdu-people-park', 'chengdu-people-park', 'chengdu']],
    '西安': [['明城墙', '钟楼夜色', '老城巷子'], ['xian-city-wall', 'xian', 'beijing-zhuanta-hutong']],
    '长沙': [['橘子洲', '岳麓山脚', '湘江夜色'], ['changsha-orange-isle', 'changsha', 'chongqing']],
    '广州': [['永庆坊', '西关骑楼', '珠江夜色'], ['guangzhou-yongqingfang', 'guangzhou-yongqingfang', 'guangzhou']],
    '合肥': [['天鹅湖', '城市绿道', '湖畔夜景'], ['hefei-swan-lake', 'hefei', 'hefei-swan-lake']],
    '重庆': [['山城巷', '两江夜景', '立体街道'], ['chongqing-shancheng-alley', 'chongqing', 'chongqing-shancheng-alley']],
    '厦门': [['环岛路', '海边日落', '老城骑楼'], ['xiamen-huandao-road', 'xiamen', 'guangzhou-yongqingfang']],
    '济南': [['曲水亭街', '大明湖', '泉水人家'], ['jinan-qushuiting-daming-lake', 'jinan', 'jinan-qushuiting-daming-lake']],
    '昆明': [['翠湖公园', '老城花市', '湖畔日落'], ['kunming-cuihu-park', 'kunming', 'kunming-cuihu-park']],
  };
  const activityCategories = ['慢游', '拍照任务', '日落计划'];
  const activityTemplates = [
    (place) => `去${place}不设终点地慢走`,
    (place) => `在${place}收集三种当地颜色`,
    (place) => `把${place}留到日落以后`,
  ];
  const categoryTemplates = {
    '浪漫约会': (place) => `和喜欢的人去${place}交换一张照片`,
    '休闲躺平': (place) => `在${place}把一个下午慢慢过完`,
    '娱乐玩乐': (place) => `去${place}解锁一场即兴挑战`,
    '探险猎奇': (place) => `到${place}寻找一条冷门路线`,
    '美食吃喝': (place) => `沿着${place}尝三种当地味道`,
    '城市散步': (place) => `从${place}开始随意转三个弯`,
  };
  const categoryChannels = {
    '浪漫约会': '约会', '休闲躺平': '治愈', '娱乐玩乐': '娱乐玩乐',
    '探险猎奇': '探索', '美食吃喝': '美食', '城市散步': 'City Walk',
  };
  const guideStepTemplates = {
    '浪漫约会': ['提前确认集合点和日落时间', '一起完成一件有纪念感的小事', '选一张照片留作今天的纪念'],
    '休闲躺平': ['慢慢抵达，不给行程设置打卡压力', '找舒服的位置停留至少四十分钟', '在附近散步或吃点喜欢的东西'],
    '娱乐玩乐': ['提前确认预约与开放时间', '完成今天的核心游戏或体验项目', '用一张合照结束这次挑战'],
    '探险猎奇': ['准备轻便装备并确认安全路线', '沿推荐线索探索一处冷门角落', '天黑前完成返程与探索记录'],
    '美食吃喝': ['从第一家代表性小店开始', '沿路线尝试两到三种当地味道', '选出今天最值得再吃的一家'],
    '城市散步': ['从推荐街区的起点慢慢出发', '按路线转三次弯并观察城市细节', '在终点附近休息并整理照片'],
  };
  let activeCategory = null;
  let currentCity = '北京';
  let recommendationOffset = 0;
  let pendingAddButton = null;
  let selectedCategory = null;
  const categorySelections = { partySize: '2 人', travelDuration: '当天', budget: '划算出行' };
  const cityIds = Object.fromEntries(Object.keys(cityProfiles).map((city, index) => [city, index + 1]));
  const partySizeValues = { '1 人': 1, '2 人': 2, '多人': 4 };
  const travelDurationValues = { '当天': 'same-day', '周末游': '2-3days', '小长假': '4-5days' };
  const budgetRanges = {
    '当天': { '划算出行': [0, 200], '舒服躺玩': [200, 400], '品质享受': [400, null] },
    '周末游': { '划算出行': [200, 700], '舒服躺玩': [700, 1300], '品质享受': [1300, null] },
    '小长假': { '划算出行': [500, 1100], '舒服躺玩': [1100, 2000], '品质享受': [2000, null] },
  };

  const closeCategoryModal = () => {
    if (!categoryModal) return;
    categoryModal.hidden = true;
  };

  const openCategoryModal = (category) => {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'gravity-home:open-quick-draw',
        cityId: cityIds[currentCity] || 1,
        cityName: currentCity,
        categoryLabel: category,
      }, window.location.origin);
      return;
    }
    selectedCategory = category;
    if (categoryModal) categoryModal.hidden = false;
  };

  const navigateToSlot = () => {
    const href = '/box/slot-preview';
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'gravity-home:navigate', href }, window.location.origin);
    } else {
      window.location.href = href;
    }
  };

  document.querySelectorAll('[data-category-options]').forEach((group) => {
    group.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-value]');
      if (!button) return;
      const key = group.dataset.categoryOptions;
      categorySelections[key] = button.dataset.value;
      group.querySelectorAll('button').forEach((item) => item.classList.toggle('is-selected', item === button));
    });
  });

  document.querySelectorAll('[data-category-modal-close]').forEach((button) => button.addEventListener('click', closeCategoryModal));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && categoryModal && !categoryModal.hidden) closeCategoryModal();
  });
  const buildCityActivities = (city) => {
    const [places, images] = cityProfiles[city];
    if (places.length >= 9) {
      return places.slice(0, 9).map((place, index) => ({
        category: activityCategories[index % activityCategories.length],
        title: activityTemplates[index % activityTemplates.length](place),
        image: images[index],
      }));
    }
    return places.flatMap((place) => activityTemplates.map((template, index) => ({
      category: activityCategories[index], title: template(place), image: images[index],
    })));
  };
  Object.keys(cityProfiles).forEach((city) => {
    if (catalog[city]) return;
    const activities = buildCityActivities(city);
    catalog[city] = activities.slice(0, 4).map((activity, index) => [
      activity.category,
      activity.title,
      index === 3 ? '2 天 · 2 人' : '1 天 · 1–2 人',
      [activity.image, cityProfiles[city][1][(index + 1) % 3], cityProfiles[city][1][(index + 2) % 3]],
    ]);
  });

  const categoryPool = (city, category) => {
    const [places, images] = cityProfiles[city];
    const categories = Object.keys(categoryTemplates);
    return Array.from({ length: Math.max(8, places.length) }, (_, index) => {
      const place = places[index % places.length];
      const itemCategory = category || categories[index % categories.length];
      const template = categoryTemplates[itemCategory];
      return [
        itemCategory,
        template(place),
        index % 3 === 0 ? '半天 · 1–2 人' : index % 3 === 1 ? '2–3 小时 · 2 人' : '当天 · 1–4 人',
        [images[index % images.length], images[(index + 1) % images.length], images[(index + 2) % images.length]],
      ];
    });
  };

  const renderRecommendations = (city) => {
    const pool = categoryPool(city, activeCategory);
    cards.forEach((card, index) => {
      const [category, title, meta, images] = pool[(recommendationOffset + index) % pool.length];
      card.classList.toggle('is-contrast-card', index === 3);
      card.querySelector('.place-card-facts').textContent = `${city} · ${meta}`;
      card.querySelector('.place-card-copy small').textContent = category;
      card.querySelector('.place-card-copy h3').textContent = title;
      const routeMastCity = card.querySelector('.visual-top span:last-child');
      if (routeMastCity) routeMastCity.textContent = `${city.toUpperCase()} · CITY ROUTE`;
      const routeTitle = card.querySelector('.visual-copy h2');
      if (routeTitle) routeTitle.textContent = title;
      const routeCategory = card.querySelector('.cover-kicker span');
      if (routeCategory) routeCategory.textContent = category;
      const steps = guideStepTemplates[category] || ['确认路线与开放时间', '完成攻略的核心体验', '记录今天最喜欢的一个瞬间'];
      card.querySelectorAll('.guide-checklist li span').forEach((node, stepIndex) => {
        node.textContent = steps[stepIndex] || steps[steps.length - 1];
      });
      const media = card.querySelector('.place-media');
      media.dataset.leftLabel = '玩法场景';
      media.dataset.rightLabel = '城市灵感';
      media.querySelectorAll('img').forEach((node, imageIndex) => {
        node.src = image(images[imageIndex]);
        node.alt = `${city}${category}玩法场景`;
      });
      card.href = `/destinations?cityName=${encodeURIComponent(city)}`;
    });
  };

  const requestRealGuides = () => {
    if (window.parent === window) return;
    window.parent.postMessage({
      type: 'gravity-home:request-guides',
      cityId: cityIds[currentCity] || 1,
      offset: recommendationOffset,
    }, window.location.origin);
  };

  const guideCategory = (item) => {
    const tags = item.moodTags || [];
    if (tags.includes('美食吃喝')) return '美食吃喝';
    if (tags.includes('休闲躺平')) return '休闲躺平';
    if (tags.includes('娱乐玩乐')) return '娱乐玩乐';
    if (tags.includes('探险猎奇')) return '探险猎奇';
    if (tags.includes('约会') || item.category === '约会') return '浪漫约会';
    return tags.includes('城市散步') ? '城市散步' : item.category;
  };

  const guideDuration = (item) => {
    const tag = (item.moodTags || []).find((value) => ['当天', '周末游', '小长假'].includes(value));
    if (tag) return tag;
    if (item.durationMinutes <= 480) return '当天';
    if (item.durationMinutes <= 1440) return '周末游';
    return '小长假';
  };

  const realGuideSteps = (item) => {
    const steps = (item.steps || []).flatMap((entry) =>
      String(entry).split(/[；;]/).flatMap((block) => block.replace(/^D\d+\s*/i, '').split('—')),
    ).map((step) => step.trim()).filter(Boolean);
    return steps.length ? steps.slice(0, 3) : ['确认路线与开放时间', '完成攻略的核心体验', '记录今天最喜欢的瞬间'];
  };
  const cityCoordinates = {
    '北京': [39.9042, 116.4074], '上海': [31.2304, 121.4737], '杭州': [30.2741, 120.1551], '深圳': [22.5431, 114.0579],
    '天津': [39.0842, 117.2009], '烟台': [37.4638, 121.4479], '青岛': [36.0671, 120.3826], '南京': [32.0603, 118.7969],
    '武汉': [30.5928, 114.3055], '成都': [30.5728, 104.0668], '西安': [34.3416, 108.9398], '长沙': [28.2282, 112.9388],
    '广州': [23.1291, 113.2644], '合肥': [31.8206, 117.2272], '重庆': [29.4316, 106.9123], '厦门': [24.4798, 118.0894],
    '济南': [36.6512, 117.1201], '昆明': [25.0389, 102.7183],
  };
  const normalizeCity = (value) => value.trim().replace(/[市区]$/, '');

  const applyCity = (requestedCity, persist = true, source = 'manual') => {
    const normalized = normalizeCity(requestedCity);
    const city = Object.keys(catalog).find((name) => normalizeCity(name) === normalized) || '北京';
    currentCity = city;
    recommendationOffset = 0;
    inputs.forEach((input) => { input.value = city; });
    if (cityLabel) cityLabel.textContent = city;
    const galleryActivities = buildCityActivities(city);
    document.querySelectorAll('.motion-lane a').forEach((item, index) => {
      const activity = galleryActivities[index];
      item.querySelector('img').src = image(activity.image);
      item.querySelector('img').alt = `${city}${activity.title}`;
      item.querySelector('span').textContent = activity.title;
      item.href = `/theme?preset=theme&cityName=${encodeURIComponent(city)}`;
    });
    renderRecommendations(city);
    requestRealGuides();
    if (persist) {
      localStorage.setItem('@weekend-oracle/home-city', city);
      localStorage.setItem('@weekend-oracle/pc-located-city', JSON.stringify({
        name: city, latitude: null, longitude: null, accuracyMeters: null, source, savedAt: Date.now(),
      }));
    }
  };

  forms.forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    applyCity(form.elements.city.value);
  }));
  inputs.forEach((input) => input.addEventListener('change', () => applyCity(input.value)));
  categoryButtons.forEach((button) => button.addEventListener('click', () => {
    openCategoryModal(button.dataset.playCategory);
  }));
  categorySubmit?.addEventListener('click', () => {
    if (!selectedCategory) return;
    const partySize = selectedCategory === '浪漫约会' ? 2 : (partySizeValues[categorySelections.partySize] || 1);
    const [budgetMin, budgetMax] = budgetRanges[categorySelections.travelDuration][categorySelections.budget];
    const normalizedCategory = selectedCategory === '浪漫约会' ? '约会' : selectedCategory;
    const preferences = {
      partySize,
      durationMinutes: null,
      budgetMin,
      budgetMax,
      mood: normalizedCategory,
      randomLevel: 70,
      category: normalizedCategory,
      environment: 'either',
      radiusKm: null,
      originName: currentCity,
      originLatitude: null,
      originLongitude: null,
      originAccuracyMeters: null,
      originSource: 'manual',
      destinationScope: 'nearby',
      travelDuration: travelDurationValues[categorySelections.travelDuration],
      clientSource: 'pc',
      destinationScopeLabel: `${currentCity}本地`,
      travelDurationLabel: categorySelections.travelDuration,
      budgetLabel: categorySelections.budget,
      surpriseLevelLabel: `${selectedCategory}分类盲盒`,
    };
    sessionStorage.setItem('lazyde:pc-box:pending-draw', JSON.stringify({
      cityId: cityIds[currentCity] || 1,
      preferences,
      summary: `${currentCity} · ${selectedCategory} · ${partySize} 人 · ${categorySelections.travelDuration} · ${categorySelections.budget}`,
      createdAt: Date.now(),
    }));
    closeCategoryModal();
    navigateToSlot();
  });
  refreshButton?.addEventListener('click', () => {
    recommendationOffset += 4;
    renderRecommendations(currentCity);
    requestRealGuides();
    refreshButton.classList.remove('is-spinning');
    void refreshButton.offsetWidth;
    refreshButton.classList.add('is-spinning');
  });

  const showHomeToast = (message, tone = 'success') => {
    let toast = document.querySelector('#gravity-home-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'gravity-home-toast';
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.dataset.tone = tone;
    toast.classList.remove('is-visible');
    void toast.offsetWidth;
    toast.classList.add('is-visible');
    window.clearTimeout(showHomeToast.timer);
    showHomeToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
  };

  cards.forEach((card, index) => {
    const addButton = card.querySelector('.place-add-trip');
    const detailButton = card.querySelector('.place-open-detail');
    const guidePayload = (type) => {
      const category = card.querySelector('.place-card-copy small')?.textContent?.trim() || '城市散步';
      return {
        type,
        activityId: Number(card.dataset.activityId) || undefined,
        cityId: cityIds[currentCity] || 1,
        channel: categoryChannels[category] || category,
        offset: recommendationOffset + index,
      };
    };
    const addTrip = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (pendingAddButton) return;
      pendingAddButton = addButton;
      addButton.textContent = '正在加入…';
      window.parent.postMessage(guidePayload('gravity-home:add-trip'), window.location.origin);
    };
    addButton?.addEventListener('click', addTrip);
    addButton?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') addTrip(event);
    });
    const openGuide = (event) => {
      event.preventDefault();
      event.stopPropagation();
      window.parent.postMessage(guidePayload('gravity-home:open-guide'), window.location.origin);
    };
    detailButton?.addEventListener('click', openGuide);
    detailButton?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') openGuide(event);
    });
    card.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });

  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === 'gravity-home:guides') {
      const items = Array.isArray(event.data.items) ? event.data.items : [];
      items.slice(0, 4).forEach((item, index) => {
        const card = cards[index];
        if (!card) return;
        const category = guideCategory(item);
        const party = item.minPartySize === item.maxPartySize ? `${item.minPartySize} 人` : `${item.minPartySize}–${item.maxPartySize} 人`;
        card.dataset.activityId = String(item.id);
        card.querySelector('.place-card-copy small').textContent = category;
        card.querySelector('.place-card-copy h3').textContent = item.title;
        card.querySelector('.place-card-facts').textContent = `${item.cityName} · ${guideDuration(item)} · ${party}`;
        const routeMastCity = card.querySelector('.visual-top span:last-child');
        if (routeMastCity) routeMastCity.textContent = `${item.cityName.toUpperCase()} · CITY ROUTE`;
        const routeTitle = card.querySelector('.visual-copy h2');
        if (routeTitle) routeTitle.textContent = item.title;
        const routeCategory = card.querySelector('.cover-kicker span');
        if (routeCategory) routeCategory.textContent = category;
        const metrics = card.querySelectorAll('.plan-meta span');
        if (metrics[0] && Number.isFinite(item.distanceKm)) metrics[0].innerHTML = `<b>${item.distanceKm.toFixed(1)}</b> KM`;
        if (metrics[1] && Number.isFinite(item.durationMinutes)) metrics[1].innerHTML = `<b>${Math.max(1, item.durationMinutes / 60).toFixed(1)}</b> H`;
        if (metrics[2] && Number.isFinite(item.budgetYuan)) metrics[2].innerHTML = `<b>¥${Math.round(item.budgetYuan)}</b> / 人`;
        const steps = realGuideSteps(item);
        card.querySelectorAll('.guide-checklist li span').forEach((node, stepIndex) => {
          node.textContent = steps[stepIndex] || steps[steps.length - 1];
        });
      });
      return;
    }
    if (event.data?.type === 'gravity-home:guides-error') {
      showHomeToast(event.data.message || '攻略加载失败，请稍后再试', 'error');
      return;
    }
    if (event.data?.type !== 'gravity-home:add-trip-status') return;
    if (event.data.status === 'loading') return;
    if (pendingAddButton) pendingAddButton.textContent = '加入我的行程';
    if (event.data.status === 'success') {
      showHomeToast(event.data.alreadyExists ? '这条攻略已经在你的行程里了' : `已加入：${event.data.title}`);
    } else if (event.data.status === 'error') {
      showHomeToast(event.data.message || '加入行程失败，请稍后再试', 'error');
    }
    pendingAddButton = null;
  });

  applyCity('北京', false, 'default');

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      let nearestCity = '北京';
      let nearestDistance = Infinity;
      Object.entries(cityCoordinates).forEach(([city, [latitude, longitude]]) => {
        const distance = Math.hypot(coords.latitude - latitude, (coords.longitude - longitude) * Math.cos(coords.latitude * Math.PI / 180));
        if (distance < nearestDistance) {
          nearestCity = city;
          nearestDistance = distance;
        }
      });
      applyCity(nearestDistance < 2.5 ? nearestCity : '北京', true, nearestDistance < 2.5 ? 'device' : 'default');
    }, () => applyCity('北京', true, 'default'), { maximumAge: 86_400_000, timeout: 8_000 });
  } else {
    applyCity('北京', true, 'default');
  }
}

setupSectionObserver();
setupMobileHeroLayout();
setupGravityField();
setupAppNavigationBridge();
setupPrimaryAuthAction();
document.querySelector('.styles-screen')?.classList.add('is-static-grid');
upgradeWeekendGuideCards();
setupScrollStory();
setupCityRecommendations();
