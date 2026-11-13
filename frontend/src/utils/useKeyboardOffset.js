import { useEffect } from 'react';

// En el celular, cuando aparece el teclado, mide cuánto tapa y lo guarda en la variable CSS
// --keyboard-offset. La barra del buscador la usa para subir y quedar justo encima del teclado.
// Usa visualViewport: es el área que de verdad se ve (sin el teclado).
export function useKeyboardOffset() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;

    const root = document.documentElement;
    let frame = 0;

    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const covered = window.innerHeight - viewport.height - viewport.offsetTop;
        // Menos de 80 px no es el teclado (es la barra de Safari que se esconde o aparece).
        const offset = covered > 80 ? Math.round(covered) : 0;
        root.style.setProperty('--keyboard-offset', `${offset}px`);
        root.toggleAttribute('data-keyboard-open', offset > 0);
      });
    }

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      root.style.removeProperty('--keyboard-offset');
      root.removeAttribute('data-keyboard-open');
    };
  }, []);
}
