import "./style.css";
import logoUrl from "../../src/assets/svg/Logo.svg";

document.querySelector("#app").innerHTML = `
  <header class="site-header">
    <a class="brand" href="/" aria-label="Power Training Coach home">
      <img src="${logoUrl}" alt="" /><span>POWERTRAINING</span>
    </a>
    <nav aria-label="Main navigation">
      <a href="#how-it-works">How it works</a>
      <a href="#built-for">Built for fighters</a>
      <a class="nav-cta" href="#get-started">Get the app</a>
    </nav>
  </header>

  <main>
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">COMBAT SPORTS PERFORMANCE</p>
        <h1>YOUR FIGHT.<br />YOUR <span>PROGRAM.</span></h1>
        <p class="hero-text">Strength and conditioning built around your fight camp, combat training, and actual life.</p>
        <div class="hero-actions" id="get-started">
          <a class="button button-light" href="mailto:hello@powertraining.app?subject=Power%20Training%20Coach%20early%20access">Get early access <span>→</span></a>
          <a class="text-link" href="#how-it-works">See how it works <span>↓</span></a>
        </div>
        <p class="availability">Coming soon for iOS and Android</p>
      </div>
      <div class="phone-wrap" aria-label="Training plan preview">
        <div class="phone">
          <div class="phone-top"><span>9:41</span><span class="camera"></span><span>●●●</span></div>
          <div class="phone-content">
            <div class="app-brand"><img src="${logoUrl}" alt="" /> POWERTRAINING</div>
            <p class="app-label">SATURDAY, 22 JUNE</p>
            <h2>Fight camp</h2>
            <div class="ring"><div><strong>32</strong><span>DAYS TO GO</span></div></div>
            <p class="phase">BUILD PHASE · WEEK 4</p>
            <div class="session-card"><p>TODAY'S TRAINING</p><strong>Lower body strength</strong><span>4 exercises · 45 min</span></div>
            <a class="phone-button">START SESSION</a>
            <div class="bottom-nav"><b>⌂</b><b class="selected">◉</b><b>☰</b><b>♙</b></div>
          </div>
        </div>
      </div>
    </section>

    <section class="proof">
      <p>THE WORK DOESN'T STOP AT THE GYM</p>
      <div><span>BOXING</span><span>MMA</span><span>MUAY THAI</span><span>JIU-JITSU</span></div>
    </section>

    <section class="features" id="how-it-works">
      <div class="section-intro"><p class="eyebrow">NOT A TEMPLATE</p><h2>BUILT AROUND<br />YOUR CAMP.</h2></div>
      <article><span class="number">01</span><h3>YOUR INPUTS</h3><p>Combat sport, experience, available equipment, training days, and fight date all shape the plan.</p></article>
      <article><span class="number">02</span><h3>YOUR SESSIONS</h3><p>Clear prescriptions for strength, power, and conditioning, right when you need them.</p></article>
      <article><span class="number">03</span><h3>YOUR ADJUSTMENTS</h3><p>Hard sparring week? Missed session? The program adapts without losing the bigger picture.</p></article>
    </section>

    <section class="statement" id="built-for">
      <p class="eyebrow">TRAIN WITH INTENT</p>
      <h2>DON'T JUST TRAIN<br />HARD. <em>TRAIN RIGHT.</em></h2>
      <p>Power Training Coach keeps the gym work working for your sport—whether you are on the mats, in the ring, or deep into fight camp.</p>
    </section>

    <section class="final-cta">
      <p class="eyebrow">POWER TRAINING COACH</p>
      <h2>Make every session count.</h2>
      <a class="button button-light" href="mailto:hello@powertraining.app?subject=Power%20Training%20Coach%20early%20access">Get early access <span>→</span></a>
    </section>
  </main>
  <footer><a class="brand" href="/"><img src="${logoUrl}" alt="" /><span>POWERTRAINING</span></a><span>© 2026 POWERTRAINING</span></footer>
`;
