// Bloquer le pinch-to-zoom sur les écrans tactiles
document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// Zoom double-tap : géré en CSS par `touch-action: manipulation` (cf. styles.css).
// L'ancien preventDefault() sur touchend annulait le clic de tout tap survenant
// moins de 300ms après le précédent → un tap sur deux était avalé en jeu.
