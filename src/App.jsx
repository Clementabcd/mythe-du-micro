import React, { useEffect, useRef, useState, useCallback } from "react";

/**
 * MythDuMicro
 * Page interactive de sensibilisation : le mythe du micro espion, le vrai
 * mécanisme du tracking publicitaire, et le danger réel (courtage de
 * données, discrimination, stalkerware).
 *
 * Aucune dépendance externe. Bascule clair/sombre intégrée (persistée dans
 * localStorage). Les polices sont chargées via @import dans le <style>
 * injecté ci-dessous — en production, préfère les déclarer dans le <head>
 * de ton index.html pour de meilleures performances de chargement :
 *   Fraunces, Space Grotesk, JetBrains Mono (Google Fonts).
 */

const TRACKERS = [
  {
    title: "Identifiant publicitaire",
    text: "Un numéro unique attaché à ton appareil (IDFA sur iOS, GAID sur Android), utilisé pour te reconnaître d'une application à l'autre sans jamais connaître ton nom.",
  },
  {
    title: "Cookies tiers & pixels",
    text: "De petits fragments de code invisibles, intégrés sur des milliers de sites, qui signalent ta visite à des régies publicitaires en temps réel.",
  },
  {
    title: "Empreinte de l'appareil",
    text: "Résolution d'écran, polices installées, fuseau horaire : la combinaison de ces détails est presque unique et permet de te suivre même sans le moindre cookie.",
  },
  {
    title: "Graphe social",
    text: "Qui tu suis, qui te suit, avec qui tu interagis — un réseau que les plateformes analysent pour déduire tes affinités bien mieux qu'une conversation captée au hasard.",
  },
  {
    title: "Connexion unique (SSO)",
    text: "Te connecter avec ton compte Google ou Apple sur une nouvelle appli relie instantanément ton identité à un historique qui existait déjà ailleurs.",
  },
  {
    title: "Retargeting",
    text: "Visite une seule fois la fiche d'un produit : un pixel s'en souvient et te le remontre pendant des jours sur des sites qui n'ont rien à voir.",
  },
];

const DANGERS = [
  {
    tag: "réel",
    name: "Le marché des courtiers en données",
    body: "Des sociétés spécialisées — appelées courtiers en données — achètent, croisent et revendent des profils construits à partir de centaines de sources : achats, navigation, localisation, historique de crédit. Une enquête de la Federal Trade Commission américaine a montré que ces profils peuvent regrouper plusieurs milliers de points de données par personne, souvent sans que celle-ci en ait connaissance ni la possibilité de les consulter.",
  },
  {
    tag: "réel",
    name: "La tarification qui s'adapte à ton profil",
    body: "Prix affichés, offres d'assurance, taux de crédit proposé : plusieurs études ont documenté des cas de tarification variable selon le profil comportemental déduit d'un visiteur, sans qu'il soit jamais informé qu'un autre prix existe pour quelqu'un d'autre.",
  },
  {
    tag: "réel — mais ciblé",
    name: "Le stalkerware, l'espionnage qui existe vraiment",
    body: "Contrairement au mythe de l'écoute publicitaire de masse, des applications d'espionnage ciblées — installées en secret par un conjoint ou un proche malveillant — activent bel et bien micro, caméra et géolocalisation. Le rapport Kaspersky sur l'état du stalkerware recense 31 031 personnes touchées dans le monde en 2023, en hausse de 5,8 % par rapport à l'année précédente, pour 195 applications différentes détectées.",
  },
  {
    tag: "à nuancer",
    name: "Le document qui a relancé la rumeur",
    body: "Fin 2023, un support commercial divulgué d'une régie publicitaire américaine (Cox Media Group) affirmait pouvoir cibler des publicités à partir de conversations captées par microphone. Google a aussitôt retiré l'entreprise de son programme partenaire et Meta a ouvert une revue interne — mais l'entreprise a ensuite démenti tout accès réel à des conversations, parlant de données tierces agrégées et anonymisées. Aucune vérification indépendante n'a confirmé que le procédé fonctionne tel que décrit dans le document.",
  },
];

const CHECKLIST = {
  ios: {
    label: "iOS",
    items: [
      { id: "ios-1", label: "Réglages → Confidentialité et sécurité → Publicité Apple : désactiver les annonces personnalisées" },
      { id: "ios-2", label: "Réglages → Confidentialité et sécurité → Suivi : refuser le suivi par défaut pour toutes les apps" },
      { id: "ios-3", label: "Vérifier une fois par mois quelles apps ont encore accès au micro et à la caméra" },
    ],
  },
  android: {
    label: "Android",
    items: [
      { id: "android-1", label: "Paramètres → Confidentialité → Annonces : supprimer ou réinitialiser l'identifiant publicitaire" },
      { id: "android-2", label: "Paramètres → Confidentialité → Gestionnaire d'autorisations : revoir micro, caméra et localisation app par app" },
      { id: "android-3", label: "Désactiver la personnalisation des annonces dans les paramètres du compte Google" },
    ],
  },
  nav: {
    label: "Navigateur",
    items: [
      { id: "nav-1", label: "Bloquer les cookies tiers dans les réglages du navigateur" },
      { id: "nav-2", label: "Installer un bloqueur de trackers reconnu (uBlock Origin, Privacy Badger…)" },
      { id: "nav-3", label: "Passer en navigation privée pour les recherches que tu ne veux voir rattachées à aucun profil" },
    ],
  },
};

const DIAGRAM_NODES = [
  { key: "recherches", cx: 180, cy: 110, r: 42, lines: ["Recherches", "web"], text: "Chaque recherche est un signal d'intention explicite que tu donnes toi-même — bien plus fiable pour un annonceur qu'une conversation captée au hasard." },
  { key: "localisation", cx: 530, cy: 90, r: 42, lines: ["Localisation"], text: "Les positions GPS et Wi-Fi dessinent tes habitudes : domicile, travail, magasins visités, trajets réguliers." },
  { key: "social", cx: 120, cy: 330, r: 42, lines: ["Réseaux", "sociaux"], text: "Likes, abonnements et temps passé sur chaque publication forment un profil d'intérêt d'une précision redoutable." },
  { key: "apps", cx: 350, cy: 400, r: 42, lines: ["Apps", "installées"], text: "La simple liste des applications installées sur ton téléphone en dit déjà long sur qui tu es et ce que tu fais." },
  { key: "achats", cx: 580, cy: 340, r: 42, lines: ["Achats &", "navigation"], text: "Cookies tiers et pixels de suivi relient ton activité d'un site à l'autre, jusqu'à l'achat final." },
];

const STORAGE_KEY = "mytheDuMicro.checklist";
const THEME_KEY = "mytheDuMicro.theme";
const MO_PER_HOUR = 30;
const TYPICAL_PLAN_GO = 7;

function fmtFr(n, decimals) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default function MythDuMicro() {
  const rootRef = useRef(null);
  const fillRef = useRef(null);
  const [signalIdx, setSignalIdx] = useState(0);
  const [hours, setHours] = useState(8);
  const [activeNode, setActiveNode] = useState(null);
  const [checked, setChecked] = useState({});
  const [theme, setTheme] = useState("dark");

  const signals = ["Recherches récentes", "Position GPS", "Réseaux sociaux", "Cookies publicitaires"];

  // theme: load preference once (saved choice, else system)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") {
        setTheme(saved);
        return;
      }
    } catch (e) {
      /* ignore */
    }
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch (e) {
        /* ignore */
      }
      return next;
    });
  }, []);

  // reveal-on-scroll
  useEffect(() => {
    const els = rootRef.current.querySelectorAll(".mtm-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("mtm-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // scroll progress rail
  useEffect(() => {
    function onScroll() {
      const h = document.documentElement;
      const scrollTop = h.scrollTop || document.body.scrollTop;
      const scrollHeight = h.scrollHeight - h.clientHeight;
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      if (fillRef.current) fillRef.current.style.height = pct + "%";
    }
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  // hero signal cycling
  useEffect(() => {
    const t = setInterval(() => setSignalIdx((i) => (i + 1) % signals.length), 1400);
    return () => clearInterval(t);
  }, []);

  // checklist: load from localStorage once
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setChecked(JSON.parse(saved));
    } catch (e) {
      /* ignore */
    }
  }, []);

  const toggleCheck = useCallback((id) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        /* ignore */
      }
      return next;
    });
  }, []);

  const allItems = Object.values(CHECKLIST).flatMap((g) => g.items);
  const doneCount = allItems.filter((it) => checked[it.id]).length;
  const totalCount = allItems.length;

  const hoursFor = (h) => {
    const moPerDay = h * MO_PER_HOUR;
    const goPerMonth = (moPerDay * 30) / 1024;
    const ratio = goPerMonth / TYPICAL_PLAN_GO;
    let compareText;
    if (ratio < 0.15) compareText = "un supplément encore repérable sur ta facture";
    else if (ratio < 0.8) compareText = `≈ ${fmtFr(ratio, 1)} forfait mobile moyen`;
    else compareText = `≈ ${fmtFr(ratio, 1)} forfaits mobiles entiers`;
    return { goPerMonth, compareText };
  };
  const { goPerMonth, compareText } = hoursFor(hours);

  const activeNodeData = DIAGRAM_NODES.find((n) => n.key === activeNode);

  return (
    <div className="mtm-root" data-theme={theme} ref={rootRef}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .mtm-root {
          --bg: #12181A;
          --bg-soft: #161E20;
          --panel: rgba(255,255,255,0.032);
          --panel-strong: rgba(255,255,255,0.055);
          --text: #ECEEE7;
          --text-mid: #A3ACA3;
          --text-dim: #6E766E;
          --accent1: #7FB69E;
          --accent2: #CBA968;
          --danger: #C97C4B;
          --danger-bg: rgba(201,124,75,0.07);
          --danger-border: rgba(201,124,75,0.25);
          --hairline: rgba(255,255,255,0.075);
          --hairline-strong: rgba(255,255,255,0.13);
          --glass-blur: 10px;
          background: var(--bg);
          color: var(--text);
          font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 17px;
          line-height: 1.6;
          overflow-x: hidden;
          position: relative;
          transition: background 0.4s ease, color 0.4s ease;
        }
        .mtm-root[data-theme="light"] {
          --bg: #F6F3EC;
          --bg-soft: #EFEAE0;
          --panel: rgba(30,26,18,0.03);
          --panel-strong: rgba(30,26,18,0.055);
          --text: #211F19;
          --text-mid: #5C594E;
          --text-dim: #8C8878;
          --accent1: #45806A;
          --accent2: #9C7B34;
          --danger: #A85A32;
          --danger-bg: rgba(168,90,50,0.06);
          --danger-border: rgba(168,90,50,0.22);
          --hairline: rgba(30,26,18,0.08);
          --hairline-strong: rgba(30,26,18,0.15);
        }

        .mtm-root * { box-sizing: border-box; }
        .mtm-root ::selection { background: var(--accent1); color: #fff; }
        .mtm-root h1, .mtm-root h2, .mtm-root h3 {
          font-family: "Fraunces", Georgia, serif;
          font-weight: 500;
          letter-spacing: -0.01em;
          margin: 0;
        }
        .mtm-mono { font-family: "JetBrains Mono", ui-monospace, monospace; }
        .mtm-root a { color: var(--accent1); }

        .mtm-rail { position: fixed; left: 0; top: 0; width: 3px; height: 100%; background: var(--hairline); z-index: 50; }
        .mtm-fill { width: 100%; height: 0%; background: linear-gradient(180deg, var(--accent1), var(--accent2)); }

        .mtm-theme-toggle {
          position: fixed;
          top: 22px;
          right: 22px;
          z-index: 51;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid var(--hairline-strong);
          background: var(--panel);
          backdrop-filter: blur(var(--glass-blur));
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-mid);
          transition: border-color 0.25s ease, color 0.25s ease, transform 0.25s ease;
        }
        .mtm-theme-toggle:hover { border-color: var(--accent1); color: var(--accent1); transform: scale(1.05); }
        .mtm-theme-toggle svg { width: 18px; height: 18px; }

        .mtm-wrap { max-width: 640px; margin: 0 auto; padding: 0 28px; }
        .mtm-wide { max-width: 860px; margin: 0 auto; padding: 0 28px; }
        .mtm-root section { position: relative; padding: 120px 0; }

        #mtm-hero { min-height: 100svh; display: flex; flex-direction: column; justify-content: center; padding: 60px 0; overflow: hidden; }
        .mtm-aurora { position: absolute; inset: 0; z-index: -1; overflow: hidden; }
        .mtm-blob { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.28; }
        .mtm-root[data-theme="light"] .mtm-blob { opacity: 0.18; }
        .mtm-blob.b1 { width: 520px; height: 520px; background: var(--accent1); top: -180px; left: -140px; animation: mtm-drift1 24s ease-in-out infinite; }
        .mtm-blob.b2 { width: 460px; height: 460px; background: var(--accent2); bottom: -200px; right: -120px; animation: mtm-drift2 28s ease-in-out infinite; }
        @keyframes mtm-drift1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(60px,40px) scale(1.08); } }
        @keyframes mtm-drift2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px,-30px) scale(1.05); } }

        .mtm-eyebrow { font-family: "JetBrains Mono", monospace; font-size: 13px; color: var(--text-dim); margin-bottom: 22px; }
        .mtm-hero-title { font-size: clamp(2.3rem, 6.6vw, 4.1rem); line-height: 1.08; }
        .mtm-hero-title .mtm-hl { color: var(--danger); font-style: italic; }
        .mtm-hero-sub { margin-top: 22px; max-width: 500px; color: var(--text-mid); font-size: 1.15rem; }
        .mtm-hero-tease { margin-top: 10px; max-width: 500px; color: var(--text-dim); font-size: 0.95rem; }

        .mtm-phone-scene { margin-top: 60px; display: flex; align-items: center; gap: 40px; flex-wrap: wrap; }
        .mtm-phone-box { width: 140px; flex-shrink: 0; }
        .mtm-signal-list { display: flex; flex-direction: column; gap: 10px; }
        .mtm-signal-item { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text-dim); opacity: 0.35; transition: opacity 0.3s ease, color 0.3s ease; }
        .mtm-signal-item .mtm-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent1); }
        .mtm-signal-item.mic .mtm-dot { background: var(--text-dim); }
        .mtm-signal-item.active { opacity: 1; color: var(--text); }

        .mtm-scroll-cue { margin-top: 66px; font-size: 13px; color: var(--text-dim); display: flex; align-items: center; gap: 10px; }
        .mtm-scroll-cue .line { width: 22px; height: 1px; background: var(--text-dim); animation: mtm-pulse 1.8s ease-in-out infinite; }
        @keyframes mtm-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }

        .mtm-reveal { opacity: 0; transform: translateY(18px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .mtm-reveal.mtm-in { opacity: 1; transform: translateY(0); }

        .mtm-chapter-label { font-family: "JetBrains Mono", monospace; font-size: 13px; color: var(--accent1); margin-bottom: 14px; }
        .mtm-chapter-label.mtm-danger-label { color: var(--danger); }
        .mtm-chapter-title { font-size: clamp(1.75rem, 4.2vw, 2.5rem); margin-bottom: 22px; }
        .mtm-lede { color: var(--text-mid); font-size: 1.08rem; max-width: 560px; }

        .mtm-evidence { margin-top: 44px; border: 1px solid var(--hairline); background: var(--panel); backdrop-filter: blur(var(--glass-blur)); border-radius: 18px; padding: 32px; }
        .mtm-evidence + .mtm-evidence { margin-top: 20px; }
        .mtm-evidence-head { display: flex; justify-content: space-between; align-items: baseline; gap: 20px; flex-wrap: wrap; border-bottom: 1px solid var(--hairline); padding-bottom: 18px; margin-bottom: 20px; }
        .mtm-evidence-name { font-family: "Fraunces", serif; font-size: 1.2rem; }
        .mtm-evidence-year { font-family: "JetBrains Mono", monospace; font-size: 13px; color: var(--text-dim); }
        .mtm-stat-row { display: flex; gap: 36px; margin-bottom: 20px; flex-wrap: wrap; }
        .mtm-stat .mtm-num { font-family: "JetBrains Mono", monospace; font-size: 2rem; font-weight: 600; background: linear-gradient(90deg, var(--accent1), var(--accent2)); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .mtm-stat .mtm-label { font-size: 13px; color: var(--text-dim); margin-top: 4px; }
        .mtm-evidence p { color: var(--text-mid); margin: 0; }
        .mtm-twist { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--hairline); color: var(--text); }
        .mtm-twist .mtm-tag { display: inline-block; font-family: "JetBrains Mono", monospace; font-size: 11px; color: var(--danger); border: 1px solid var(--danger-border); border-radius: 100px; padding: 2px 10px; margin-bottom: 10px; }

        .mtm-calc-box { margin-top: 44px; border: 1px solid var(--hairline); background: var(--panel); backdrop-filter: blur(var(--glass-blur)); border-radius: 18px; padding: 36px; }
        .mtm-calc-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
        .mtm-calc-row label { font-size: 15px; color: var(--text-mid); }
        .mtm-root input[type="range"] { width: 100%; -webkit-appearance: none; height: 3px; background: var(--hairline-strong); border-radius: 3px; outline: none; margin: 18px 0 30px; }
        .mtm-root input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--accent1); cursor: pointer; box-shadow: 0 0 0 5px rgba(127,182,158,0.18); }
        .mtm-root input[type="range"]::-moz-range-thumb { width: 16px; height: 16px; border: none; border-radius: 50%; background: var(--accent1); cursor: pointer; box-shadow: 0 0 0 5px rgba(127,182,158,0.18); }
        .mtm-calc-results { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 8px; }
        .mtm-calc-result .mtm-num { font-family: "JetBrains Mono", monospace; font-size: 1.7rem; font-weight: 600; }
        .mtm-calc-result .mtm-label { font-size: 13px; color: var(--text-dim); margin-top: 4px; }
        .mtm-calc-note { margin-top: 26px; padding-top: 20px; border-top: 1px solid var(--hairline); font-size: 14px; color: var(--text-dim); }

        .mtm-diagram-stage { margin-top: 50px; position: relative; height: 460px; border: 1px solid var(--hairline); border-radius: 18px; background: var(--panel); overflow: hidden; }
        .mtm-diagram-stage svg { width: 100%; height: 100%; }
        .mtm-node-line { stroke: var(--hairline-strong); stroke-width: 1; transition: stroke 0.3s ease; }
        .mtm-node-line.mtm-lit { stroke: var(--accent1); stroke-width: 1.5; }
        .mtm-node-dot { fill: var(--panel-strong); stroke: var(--hairline-strong); stroke-width: 1.5; cursor: pointer; transition: fill 0.25s ease, stroke 0.25s ease; }
        .mtm-node-dot.mtm-center { fill: var(--text); stroke: none; cursor: default; }
        .mtm-node-group:hover .mtm-node-dot:not(.mtm-center) { stroke: var(--accent1); fill: rgba(127,182,158,0.14); }
        .mtm-node-group.mtm-active .mtm-node-dot:not(.mtm-center) { stroke: var(--accent1); fill: rgba(127,182,158,0.2); }
        .mtm-node-text { font-family: "Space Grotesk", sans-serif; font-size: 12.5px; fill: var(--text-mid); pointer-events: none; }
        .mtm-node-group.mtm-active .mtm-node-text { fill: var(--text); }
        .mtm-diagram-caption { position: absolute; left: 24px; right: 24px; bottom: 22px; padding: 16px 20px; background: var(--bg-soft); border: 1px solid var(--hairline); border-radius: 12px; font-size: 14.5px; color: var(--text-mid); opacity: 0; transform: translateY(8px); transition: opacity 0.3s ease, transform 0.3s ease; }
        .mtm-diagram-caption.mtm-show { opacity: 1; transform: translateY(0); }
        .mtm-diagram-caption strong { color: var(--text); font-weight: 600; }
        .mtm-diagram-hint { margin-top: 16px; font-size: 13px; color: var(--text-dim); }

        .mtm-tracker-grid { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .mtm-tracker-card { border: 1px solid var(--hairline); background: var(--panel); border-radius: 16px; padding: 24px; }
        .mtm-tracker-card h3 { font-size: 1.02rem; margin-bottom: 10px; font-family: "Space Grotesk", sans-serif; font-weight: 600; }
        .mtm-tracker-card p { color: var(--text-mid); font-size: 14.5px; margin: 0; }

        .mtm-danger-card { margin-top: 20px; border: 1px solid var(--danger-border); background: var(--danger-bg); backdrop-filter: blur(var(--glass-blur)); border-radius: 18px; padding: 28px; }
        .mtm-danger-head { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; flex-wrap: wrap; }
        .mtm-danger-head .mtm-tag { font-family: "JetBrains Mono", monospace; font-size: 11px; color: var(--danger); border: 1px solid var(--danger-border); border-radius: 100px; padding: 2px 10px; white-space: nowrap; }
        .mtm-danger-head h3 { font-size: 1.1rem; font-family: "Fraunces", serif; font-weight: 500; }
        .mtm-danger-card p { color: var(--text-mid); margin: 0; font-size: 15px; }

        .mtm-platform-block { margin-top: 36px; }
        .mtm-platform-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; }
        .mtm-platform-head h3 { font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 1.05rem; }
        .mtm-platform-count { font-family: "JetBrains Mono", monospace; font-size: 12.5px; color: var(--text-dim); }
        .mtm-check-item { display: flex; align-items: flex-start; gap: 14px; padding: 14px 0; border-top: 1px solid var(--hairline); cursor: pointer; }
        .mtm-check-box { width: 20px; height: 20px; border-radius: 6px; border: 1.5px solid var(--hairline-strong); flex-shrink: 0; margin-top: 2px; position: relative; transition: background 0.2s ease, border-color 0.2s ease; }
        .mtm-check-item.mtm-done .mtm-check-box { background: var(--accent1); border-color: var(--accent1); }
        .mtm-check-box::after { content: ""; position: absolute; left: 5px; top: 1px; width: 5px; height: 9px; border-right: 2px solid var(--bg); border-bottom: 2px solid var(--bg); transform: rotate(40deg); opacity: 0; }
        .mtm-check-item.mtm-done .mtm-check-box::after { opacity: 1; }
        .mtm-check-label { font-size: 15px; color: var(--text); }
        .mtm-check-item.mtm-done .mtm-check-label { color: var(--text-dim); text-decoration: line-through; }

        .mtm-progress-summary { margin-top: 44px; display: flex; align-items: center; gap: 18px; border: 1px solid var(--hairline); background: var(--panel); border-radius: 100px; padding: 14px 22px; }
        .mtm-progress-summary .mtm-track { flex: 1; height: 6px; background: var(--hairline-strong); border-radius: 6px; overflow: hidden; }
        .mtm-progress-summary .mtm-pfill { height: 100%; background: linear-gradient(90deg, var(--accent1), var(--accent2)); transition: width 0.35s ease; }
        .mtm-progress-summary .mtm-count { font-family: "JetBrains Mono", monospace; font-size: 13px; color: var(--text-mid); white-space: nowrap; }

        #mtm-closing { padding-top: 100px; padding-bottom: 90px; }
        #mtm-closing h2 { font-size: clamp(1.65rem, 3.8vw, 2.2rem); margin-bottom: 18px; }
        #mtm-closing p { color: var(--text-mid); max-width: 520px; }
        .mtm-sources { margin-top: 48px; padding-top: 28px; border-top: 1px solid var(--hairline); }
        .mtm-sources h4 { font-family: "JetBrains Mono", monospace; font-size: 12.5px; color: var(--text-dim); font-weight: 500; margin: 0 0 14px; }
        .mtm-sources ul { list-style: none; padding: 0; margin: 0; }
        .mtm-sources li { margin-bottom: 8px; font-size: 14px; }
        .mtm-sources a { color: var(--text-mid); text-decoration: none; border-bottom: 1px solid var(--hairline-strong); }
        .mtm-sources a:hover { color: var(--accent1); border-color: var(--accent1); }

        @media (max-width: 600px) {
          .mtm-root section { padding: 90px 0; }
          .mtm-tracker-grid { grid-template-columns: 1fr; }
          .mtm-calc-results { grid-template-columns: 1fr; }
          .mtm-diagram-stage { height: 400px; }
          .mtm-theme-toggle { top: 16px; right: 16px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mtm-root * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div className="mtm-rail"><div className="mtm-fill" ref={fillRef} /></div>

      <button
        className="mtm-theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
        title={theme === "dark" ? "Mode clair" : "Mode sombre"}
      >
        {theme === "dark" ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="12" cy="12" r="4.2" />
            <line x1="12" y1="2.5" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="21.5" />
            <line x1="2.5" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="21.5" y2="12" />
            <line x1="5" y1="5" x2="6.8" y2="6.8" />
            <line x1="17.2" y1="17.2" x2="19" y2="19" />
            <line x1="5" y1="19" x2="6.8" y2="17.2" />
            <line x1="17.2" y1="6.8" x2="19" y2="5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z" />
          </svg>
        )}
      </button>

      {/* HERO */}
      <section id="mtm-hero">
        <div className="mtm-aurora"><div className="mtm-blob b1" /><div className="mtm-blob b2" /></div>
        <div className="mtm-wrap">
          <div className="mtm-eyebrow">une enquête interactive</div>
          <h1 className="mtm-hero-title">
            Ton téléphone ne t'écoute pas.<br />
            Le vrai <span className="mtm-hl">danger</span> est ailleurs.
          </h1>
          <p className="mtm-hero-sub">
            Les études sont formelles : personne n'a jamais trouvé la moindre preuve d'un micro qui espionne tes conversations pour te vendre des pubs. Mais ce n'est pas une raison de te rassurer complètement.
          </p>
          <p className="mtm-hero-tease">
            (Le vrai mécanisme est plus discret, plus précis — et pour une minorité de personnes, un vrai risque existe déjà.)
          </p>

          <div className="mtm-phone-scene">
            <div className="mtm-phone-box">
              <svg viewBox="0 0 100 190" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="92" height="182" rx="18" stroke="var(--hairline-strong)" strokeWidth="2" />
                <rect x="14" y="18" width="72" height="130" rx="4" stroke="var(--hairline)" strokeWidth="1" />
                <circle cx="50" cy="164" r="7" stroke="var(--hairline-strong)" strokeWidth="1.5" />
                <line x1="26" y1="80" x2="74" y2="80" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" />
                <text x="50" y="100" textAnchor="middle" fontSize="7" fill="var(--text-dim)" fontFamily="JetBrains Mono, monospace">micro inactif</text>
              </svg>
            </div>
            <div className="mtm-signal-list">
              <div className="mtm-signal-item mic"><span className="mtm-dot" /><span>Micro — aucune activité</span></div>
              {signals.map((s, i) => (
                <div key={s} className={"mtm-signal-item" + (i === signalIdx ? " active" : "")}>
                  <span className="mtm-dot" /><span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mtm-scroll-cue"><span className="line" /><span>Fais défiler pour voir l'enquête</span></div>
        </div>
      </section>

      {/* CHAPTER 1 */}
      <section id="mtm-ch1">
        <div className="mtm-wrap">
          <div className="mtm-chapter-label mtm-reveal">Chapitre 1</div>
          <h2 className="mtm-chapter-title mtm-reveal">L'enquête qui a testé la théorie</h2>
          <p className="mtm-lede mtm-reveal">Plutôt que de se fier à des impressions, plusieurs équipes de recherche ont directement examiné ce que font les applications sur le terrain — trafic réseau à l'appui.</p>

          <div className="mtm-evidence mtm-reveal">
            <div className="mtm-evidence-head">
              <span className="mtm-evidence-name">Northeastern University &amp; UC Santa Barbara</span>
              <span className="mtm-evidence-year mtm-mono">2018</span>
            </div>
            <div className="mtm-stat-row">
              <div className="mtm-stat"><span className="mtm-num">17 260</span><span className="mtm-label">applications Android analysées</span></div>
              <div className="mtm-stat"><span className="mtm-num">1 an</span><span className="mtm-label">de surveillance du trafic réseau</span></div>
              <div className="mtm-stat"><span className="mtm-num">0</span><span className="mtm-label">activation micro pour cibler une pub</span></div>
            </div>
            <p>Les chercheurs ont fait tourner ces applications sur des téléphones réels pendant un an, en analysant chaque octet envoyé vers l'extérieur. Aucune n'a déclenché le micro à l'insu de l'utilisateur pour alimenter un système publicitaire.</p>
            <div className="mtm-twist">
              <span className="mtm-tag">ce qu'ils ont trouvé à la place</span>
              <p>Certaines applications enregistraient secrètement l'écran et envoyaient ces captures à des sociétés d'analyse tierces — un cas concret impliquait une appli de livraison dont les captures d'écran, avec code postal inclus, atterrissaient chez un prestataire d'analytique sans que ce soit clairement annoncé aux utilisateurs.</p>
            </div>
          </div>

          <div className="mtm-evidence mtm-reveal">
            <div className="mtm-evidence-head">
              <span className="mtm-evidence-name">Wandera, cabinet de sécurité mobile</span>
              <span className="mtm-evidence-year mtm-mono">2019</span>
            </div>
            <p>Une seconde équipe a placé des téléphones dans une pièce diffusant en boucle des publicités audio pendant trente minutes, trois jours de suite, en comparant leur consommation de données à des appareils témoins placés dans le silence. Résultat identique : aucune hausse de trafic compatible avec un enregistrement audio continu.</p>
          </div>
        </div>
      </section>

      {/* CHAPTER 2 */}
      <section id="mtm-ch2">
        <div className="mtm-wrap">
          <div className="mtm-chapter-label mtm-reveal">Chapitre 2</div>
          <h2 className="mtm-chapter-title mtm-reveal">Le calcul qui achève le mythe</h2>
          <p className="mtm-lede mtm-reveal">Même en écartant les études, la simple physique du problème pose un souci. Écouter en continu, ça laisse des traces — et ça coûte cher. Fais varier le curseur.</p>

          <div className="mtm-calc-box mtm-reveal">
            <div className="mtm-calc-row">
              <label htmlFor="mtm-hours">Heures d'écoute active par jour</label>
              <span className="mtm-mono">{hours} h</span>
            </div>
            <input
              id="mtm-hours"
              type="range"
              min="1"
              max="24"
              step="1"
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value, 10))}
            />
            <div className="mtm-calc-results">
              <div className="mtm-calc-result">
                <div className="mtm-num">{fmtFr(goPerMonth, 1)} Go</div>
                <div className="mtm-label">de données supplémentaires par mois, rien que pour l'audio</div>
              </div>
              <div className="mtm-calc-result">
                <div className="mtm-num">{compareText}</div>
                <div className="mtm-label">en plus de ta consommation habituelle</div>
              </div>
            </div>
            <div className="mtm-calc-note">
              Hypothèse : un flux audio compressé en continu consomme environ 30 Mo par heure — un débit proche de celui d'un appel vocal. Ce trafic supplémentaire, constant et régulier, apparaîtrait immédiatement dans le suivi de consommation data de ton opérateur et viderait la batterie à un rythme totalement inhabituel. Aucun des deux signaux n'a jamais été observé à grande échelle.
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 3 */}
      <section id="mtm-ch3">
        <div className="mtm-wide">
          <div className="mtm-chapter-label mtm-reveal">Chapitre 3</div>
          <h2 className="mtm-chapter-title mtm-reveal">Alors, qui alimente vraiment ton profil ?</h2>
          <p className="mtm-lede mtm-reveal">Pas ton micro : tout ce que tu fais déjà, volontairement, tous les jours. Touche un point pour voir ce qu'il révèle.</p>

          <div className="mtm-diagram-stage mtm-reveal">
            <svg viewBox="0 0 700 460">
              {DIAGRAM_NODES.map((n) => (
                <line
                  key={"l-" + n.key}
                  className={"mtm-node-line" + (activeNode === n.key ? " mtm-lit" : "")}
                  x1="350" y1="230" x2={n.cx} y2={n.cy}
                />
              ))}
              <g className="mtm-node-group">
                <circle className="mtm-node-dot mtm-center" cx="350" cy="230" r="30" />
                <text className="mtm-node-text" x="350" y="234" textAnchor="middle" fontSize="13" fill="var(--bg)" fontWeight="600">Toi</text>
              </g>
              {DIAGRAM_NODES.map((n) => (
                <g
                  key={n.key}
                  className={"mtm-node-group" + (activeNode === n.key ? " mtm-active" : "")}
                  onClick={() => setActiveNode(n.key)}
                  style={{ cursor: "pointer" }}
                >
                  <circle className="mtm-node-dot" cx={n.cx} cy={n.cy} r={n.r} />
                  {n.lines.map((line, i) => (
                    <text
                      key={i}
                      className="mtm-node-text"
                      x={n.cx}
                      y={n.cy - (n.lines.length - 1) * 7 + i * 14 + 4}
                      textAnchor="middle"
                    >
                      {line}
                    </text>
                  ))}
                </g>
              ))}
            </svg>
            <div className={"mtm-diagram-caption" + (activeNodeData ? " mtm-show" : "")}>
              {activeNodeData && (
                <>
                  <strong>{activeNodeData.lines.join(" ")}.</strong> {activeNodeData.text}
                </>
              )}
            </div>
          </div>
          <div className="mtm-diagram-hint mtm-reveal">Touche chaque point du schéma.</div>
        </div>
      </section>

      {/* CHAPTER 4 */}
      <section id="mtm-ch4">
        <div className="mtm-wrap">
          <div className="mtm-chapter-label mtm-reveal">Chapitre 4</div>
          <h2 className="mtm-chapter-title mtm-reveal">Les outils qui font le vrai travail</h2>
          <p className="mtm-lede mtm-reveal">Ce sont eux, les vrais responsables des publicités qui semblent lire dans tes pensées.</p>

          <div className="mtm-tracker-grid mtm-reveal">
            {TRACKERS.map((t) => (
              <div className="mtm-tracker-card" key={t.title}>
                <h3>{t.title}</h3>
                <p>{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHAPTER 5 : LE VRAI DANGER */}
      <section id="mtm-ch5">
        <div className="mtm-wrap">
          <div className="mtm-chapter-label mtm-danger-label mtm-reveal">Chapitre 5</div>
          <h2 className="mtm-chapter-title mtm-reveal">Le vrai danger</h2>
          <p className="mtm-lede mtm-reveal">Le mythe du micro est faux. Ça ne veut pas dire que tu n'as rien à craindre — juste que le vrai risque a un autre visage, plus discret et parfois bien plus sérieux.</p>

          {DANGERS.map((d) => (
            <div className="mtm-danger-card mtm-reveal" key={d.name}>
              <div className="mtm-danger-head">
                <span className="mtm-tag">{d.tag}</span>
                <h3>{d.name}</h3>
              </div>
              <p>{d.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CHAPTER 6 : PROTECTION */}
      <section id="mtm-ch6">
        <div className="mtm-wrap">
          <div className="mtm-chapter-label mtm-reveal">Chapitre 6</div>
          <h2 className="mtm-chapter-title mtm-reveal">Reprendre la main, pour de vrai</h2>
          <p className="mtm-lede mtm-reveal">Oublie le micro : voici ce qui réduit vraiment le pistage. Coche au fur et à mesure — c'est gardé sur cet appareil.</p>

          {Object.entries(CHECKLIST).map(([key, group]) => {
            const doneInGroup = group.items.filter((it) => checked[it.id]).length;
            return (
              <div className="mtm-platform-block mtm-reveal" key={key}>
                <div className="mtm-platform-head">
                  <h3>{group.label}</h3>
                  <span className="mtm-platform-count mtm-mono">{doneInGroup} / {group.items.length}</span>
                </div>
                {group.items.map((item) => (
                  <div
                    className={"mtm-check-item" + (checked[item.id] ? " mtm-done" : "")}
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                  >
                    <div className="mtm-check-box" />
                    <div className="mtm-check-label">{item.label}</div>
                  </div>
                ))}
              </div>
            );
          })}

          <div className="mtm-progress-summary mtm-reveal">
            <div className="mtm-track"><div className="mtm-pfill" style={{ width: (totalCount ? (doneCount / totalCount) * 100 : 0) + "%" }} /></div>
            <div className="mtm-count mtm-mono">{doneCount} / {totalCount} actions faites</div>
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section id="mtm-closing">
        <div className="mtm-wrap">
          <h2 className="mtm-reveal">Le vrai problème n'a jamais été le micro.</h2>
          <p className="mtm-reveal">C'est tout le reste : ce que tu cherches, où tu vas, ce que tu achètes, qui tu fréquentes — et, pour certains, un logiciel espion bien réel installé à leur insu. Comprendre la différence, c'est déjà reprendre un peu de contrôle.</p>

          <div className="mtm-sources mtm-reveal">
            <h4>sources</h4>
            <ul>
              <li><a href="https://news.northeastern.edu/2018/07/06/is-your-smartphone-spying-on-you/" target="_blank" rel="noopener noreferrer">Northeastern University — Is your smartphone spying on you? (2018)</a></li>
              <li><a href="https://news.northeastern.edu/in-the-media/your-phone-is-not-secretly-spying-on-your-conversations-it-doesnt-need-to/" target="_blank" rel="noopener noreferrer">Northeastern University — Your phone is not secretly spying on your conversations</a></li>
              <li><a href="https://www.helpnetsecurity.com/2019/09/06/smartphone-secretly-listening/" target="_blank" rel="noopener noreferrer">Help Net Security — l'expérience de Wandera sur l'écoute des smartphones (2019)</a></li>
              <li><a href="https://www.kaspersky.com/about/press-releases/2024_global-kaspersky-report-reveals-digital-violence-has-increased" target="_blank" rel="noopener noreferrer">Kaspersky — State of Stalkerware 2023</a></li>
              <li><a href="https://www.channelnews.com.au/marketing-firm-admits-listening-in-to-phone-conversations/" target="_blank" rel="noopener noreferrer">Reportage sur le pitch deck « Active Listening » de Cox Media Group, d'après l'enquête de 404 Media (2023)</a></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}