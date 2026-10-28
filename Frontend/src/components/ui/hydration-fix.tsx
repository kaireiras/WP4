const EXTENSION_ATTRIBUTES = [
  'bis_skin_checked',
  'bis_register',
  'data-gr-ext-installed',
  'data-new-gr-c-s-check-loaded',
  'cz-shortcut-listen',
]

const HYDRATION_CLEANER_SCRIPT = `
(function() {
  const attrs = ${JSON.stringify(EXTENSION_ATTRIBUTES)};
  const clean = () => {
    for (let i = 0; i < attrs.length; i++) {
      const els = document.querySelectorAll('[' + attrs[i] + ']');
      for (let j = 0; j < els.length; j++) {
        els[j].removeAttribute(attrs[i]);
      }
    }
  };
  clean();
  try {
    const observer = new MutationObserver((mutations) => {
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.type === 'attributes' && attrs.includes(m.attributeName)) {
          m.target.removeAttribute(m.attributeName);
        }
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: attrs,
    });
  } catch (e) {}
})();
`.trim()

/**
 * Komponen skrip sinkron untuk membersihkan atribut yang diinjeksi oleh ekstensi browser
 * (seperti Bitdefender bis_skin_checked, Grammarly, dll.) sebelum hidrasi React dimulai,
 * sehingga mencegah terjadinya Hydration Mismatch Error pada aplikasi SSR.
 */
export function HydrationFixScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: HYDRATION_CLEANER_SCRIPT,
      }}
    />
  )
}
