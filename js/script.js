
(() => {
  "use strict";

  const SERVER_IP = "Mantenimiento";
  const SERVER_PORT = "Mantenimiento";
  const SERVER_ADDRESS = `${SERVER_IP}:${SERVER_PORT}`;
  const DISCORD_INVITE = "pgbjbspux6";
  const VIRUSTOTAL_URL = "https://www.virustotal.com/";
  const DISCORD_STATS_URL =
    `https://discord.com/api/v9/invites/${DISCORD_INVITE}?with_counts=true`;
  const DISCORD_REFRESH_MS = 60000;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  function smoothBehavior() {
    return document.documentElement.classList.contains("no-anim")
      ? "auto"
      : "smooth";
  }

  function fetchWithTimeout(url, ms = 8000) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), ms);

    return fetch(url, {
      signal: controller.signal
    }).finally(() => window.clearTimeout(timer));
  }

  const yearElement = $("#year");

  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }

  const vtLink = $("#vt-link");

  if (vtLink) {
    vtLink.href = VIRUSTOTAL_URL;
  }

  $$(".vt-inline").forEach(link => {
    link.href = VIRUSTOTAL_URL;
  });

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textarea = document.createElement("textarea");

    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";

    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand("copy");
    textarea.remove();

    if (!copied) {
      throw new Error("El navegador no permitió copiar el texto.");
    }
  }

  $$("[data-copy], .ip-copy-btn").forEach(button => {
    if (button.dataset.copyBound === "true") return;

    button.dataset.copyBound = "true";

    button.addEventListener("click", async () => {
      const value = button.dataset.copy || SERVER_ADDRESS;
      const label = $(".ip-copy-label", button);
      const originalLabel = label
        ? label.textContent
        : button.textContent.trim();
      const originalHtml = button.innerHTML;

      try {
        await copyText(value);

        if (label) {
          label.textContent = "¡Copiado!";
        } else {
          button.textContent = "¡Copiado!";
        }

        button.classList.add("is-copied");
        button.setAttribute("aria-live", "polite");
      } catch (_) {
        if (label) {
          label.textContent = "No se pudo copiar";
        } else {
          button.textContent = "No se pudo copiar";
        }
      }

      window.setTimeout(() => {
        if (!button.isConnected) return;

        if (label) {
          label.textContent = originalLabel;
        } else {
          button.innerHTML = originalHtml;
        }

        button.classList.remove("is-copied");
      }, 2200);
    });
  });

  const dcMembers = $("#dc-members");
  const dcOnline = $("#dc-online");

  async function fetchDiscordStats() {
    if (!dcMembers && !dcOnline) return;

    try {
      const response = await fetchWithTimeout(DISCORD_STATS_URL);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const total = Number(data.approximate_member_count);
      const online = Number(data.approximate_presence_count);

      if (dcMembers && Number.isFinite(total) && total >= 0) {
        dcMembers.textContent = total.toLocaleString("es-AR");
      }

      if (dcOnline && Number.isFinite(online) && online >= 0) {
        dcOnline.textContent = online.toLocaleString("es-AR");
      }
    } catch (_) {
    }
  }

  fetchDiscordStats();

  let discordRefreshTimer = window.setInterval(() => {
    if (!document.hidden) {
      fetchDiscordStats();
    }
  }, DISCORD_REFRESH_MS);

  document.addEventListener("visibilitychange", () => {
    document.documentElement.classList.toggle(
      "tab-hidden",
      document.hidden
    );

    if (document.hidden) {
      window.clearInterval(discordRefreshTimer);
      discordRefreshTimer = null;
    } else {
      fetchDiscordStats();

      if (!discordRefreshTimer) {
        discordRefreshTimer = window.setInterval(
          fetchDiscordStats,
          DISCORD_REFRESH_MS
        );
      }
    }
  });

  const hscImg = $(".hsc-avatar img");

  if (hscImg) {
    const removeBrokenImage = () => hscImg.remove();

    hscImg.addEventListener("error", removeBrokenImage, {
      once: true
    });

    if (hscImg.complete && hscImg.naturalWidth === 0) {
      removeBrokenImage();
    }
  }

  const ruleFilters = $$(".rule-filter");
  const ruleCards = $$(".rule-card");

  ruleFilters.forEach(button => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter || "all";

      ruleFilters.forEach(item => {
        const active = item === button;

        item.classList.toggle("active", active);
        item.setAttribute(
          "aria-pressed",
          active ? "true" : "false"
        );
      });

      ruleCards.forEach(card => {
        card.classList.toggle(
          "hidden",
          filter !== "all" && card.dataset.cat !== filter
        );
      });
    });
  });

  $$(".pol-toc a").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();

      const targetId = link.dataset.pol;
      const target = targetId
        ? document.getElementById(targetId)
        : null;

      if (target) {
        target.scrollIntoView({
          behavior: smoothBehavior(),
          block: "start"
        });
      }
    });
  });

  if ("IntersectionObserver" in window) {
    const policyCards = $$(".pol-card");

    if (policyCards.length) {
      const policyObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            $$(".pol-toc a").forEach(link => {
              link.classList.toggle(
                "active",
                link.dataset.pol === entry.target.id
              );
            });
          });
        },
        {
          rootMargin: "-30% 0px -60% 0px"
        }
      );

      policyCards.forEach(card => {
        policyObserver.observe(card);
      });
    }
  }

  const sections = $$(".page-section");
  const navLinks = $$("[data-target]");
  const mobileToggleBtn = $("#mobile-toggle-btn");
  const navMenu = $("#nav-menu");

  function showSection(targetId) {
    const targetSection = document.getElementById(targetId);

    if (!targetSection) return;

    sections.forEach(section => {
      section.classList.toggle("active", section === targetSection);
    });

    $$(".nav-link").forEach(link => {
      link.classList.toggle(
        "active",
        link.dataset.target === targetId
      );
    });

    if (navMenu) {
      navMenu.classList.remove("active");
    }

    if (mobileToggleBtn) {
      mobileToggleBtn.setAttribute("aria-expanded", "false");
    }

    window.scrollTo({
      top: 0,
      behavior: smoothBehavior()
    });
  }

  navLinks.forEach(link => {
    link.addEventListener("click", event => {
      const target = link.dataset.target;

      if (!target) return;

      event.preventDefault();
      showSection(target);
    });
  });

  if (mobileToggleBtn && navMenu) {
    mobileToggleBtn.setAttribute(
      "aria-expanded",
      navMenu.classList.contains("active") ? "true" : "false"
    );

    mobileToggleBtn.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("active");

      mobileToggleBtn.setAttribute(
        "aria-expanded",
        isOpen ? "true" : "false"
      );
    });
  }

  const THEMES = [
    ["red", "Rojo Carmesí", "#ff2d55"],
    ["rose", "Rubí", "#e11d48"],
    ["coral", "Coral", "#ff6b4a"],
    ["orange", "Naranja", "#fb923c"],
    ["amber", "Ámbar Dorado", "#f59e0b"],
    ["gold", "Amarillo", "#facc15"],
    ["pink", "Rosa Neón", "#ff4fa3"],
    ["fuchsia", "Fucsia", "#d946ef"],
    ["purple", "Púrpura", "#a855f7"],
    ["violet", "Violeta", "#8b5cf6"],
    ["indigo", "Índigo", "#6366f1"],
    ["royal", "Azul Rey", "#3b6cff"],
    ["blue", "Azul Neón", "#00d2ff"],
    ["sky", "Celeste", "#7dd3fc"],
    ["silver", "Plata", "#cbd5e1"],
    ["lilac", "Lavanda", "#c4b5fd"]
  ];

  const themeDropdown = $("#theme-dropdown");
  const themeToggleBtn = $("#theme-toggle-btn");
  const themeNameEl = $("#theme-name");

  function setTheme(themeKey) {
    const found = THEMES.find(theme => theme[0] === themeKey) || THEMES[0];
    const [key, label] = found;

    document.documentElement.setAttribute("data-theme", key);

    if (themeNameEl) {
      themeNameEl.textContent = label;
    }

    $$(".theme-swatch").forEach(button => {
      const active = button.dataset.theme === key;

      button.classList.toggle("active", active);
      button.setAttribute(
        "aria-pressed",
        active ? "true" : "false"
      );
    });

    try {
      window.localStorage.setItem("nanovas_theme", key);
    } catch (_) {
    }
  }

  function buildThemePicker() {
    if (!themeDropdown || themeDropdown.dataset.built === "true") {
      return;
    }

    themeDropdown.dataset.built = "true";

    const fragment = document.createDocumentFragment();
    const title = document.createElement("p");

    title.className = "theme-title";
    title.textContent = "Color del tema";
    fragment.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "theme-grid";

    THEMES.forEach(([key, label, hex]) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "theme-swatch";
      button.dataset.theme = key;
      button.title = label;
      button.setAttribute("aria-label", `Usar tema ${label}`);
      button.setAttribute("aria-pressed", "false");
      button.style.setProperty("--c", hex);
      button.innerHTML = '<i aria-hidden="true"></i><span></span>';

      $("span", button).textContent = label;

      button.addEventListener("click", () => {
        setTheme(key);
        themeDropdown.classList.remove("show");

        if (themeToggleBtn) {
          themeToggleBtn.setAttribute("aria-expanded", "false");
        }
      });

      grid.appendChild(button);
    });

    fragment.appendChild(grid);
    themeDropdown.appendChild(fragment);
  }

  buildThemePicker();

  let savedTheme = "red";

  try {
    savedTheme = window.localStorage.getItem("nanovas_theme") || "red";
  } catch (_) {}

  setTheme(savedTheme);

  if (themeToggleBtn && themeDropdown) {
    themeToggleBtn.setAttribute("aria-expanded", "false");

    themeToggleBtn.addEventListener("click", event => {
      event.stopPropagation();

      const isOpen = themeDropdown.classList.toggle("show");

      themeToggleBtn.setAttribute(
        "aria-expanded",
        isOpen ? "true" : "false"
      );
    });

    document.addEventListener("click", event => {
      if (
        !themeDropdown.contains(event.target) &&
        !themeToggleBtn.contains(event.target)
      ) {
        themeDropdown.classList.remove("show");
        themeToggleBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  const animBtn = $("#anim-toggle-btn");

  function applyAnim(enabled) {
    document.documentElement.classList.toggle("no-anim", !enabled);

    if (animBtn) {
      animBtn.setAttribute(
        "aria-pressed",
        enabled ? "true" : "false"
      );

      animBtn.title = enabled
        ? "Animaciones activadas (clic para desactivar)"
        : "Animaciones desactivadas (clic para activar)";
    }
  }

  let savedAnim = "on";

  try {
    savedAnim = window.localStorage.getItem("nanovas_anim") || "on";
  } catch (_) {}

  applyAnim(savedAnim !== "off");

  if (animBtn) {
    animBtn.addEventListener("click", () => {
      const enabled = document.documentElement.classList.contains("no-anim");

      applyAnim(enabled);

      try {
        window.localStorage.setItem(
          "nanovas_anim",
          enabled ? "on" : "off"
        );
      } catch (_) {}
    });
  }
})();
