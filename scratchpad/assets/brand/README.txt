Marca Heynow — assets
======================

Logos oficiales (fuente de verdad, blancos sobre transparente):

  heynow-iso.png       Isotipo "H" (favicon / avatar / marca chica)
  heynow-wordmark.png  Wordmark "Heynow" (nav del HTML, lockup)

Uso:
- HTML (wa-comparativa.html): el nav usa heynow-wordmark.png; el favicon usa heynow-iso.png.
- PPTX (build_deck.js): usa heynow-iso.png en el lockup de portada/cierre y en el pie;
  si no existe, cae al isotipo generado logo-iso-white.png (creado por gen_icons.js).

Paleta (estilo del sitio):
  Fondo    #0A0A0B
  Texto    #FFFFFF
  Naranja  #F15C2C  (WhatsApp Flow — heroe / CTA)
  Azul     #2A4BF5  (Bot en cascada)
  Violeta  #AF52E8  (Agente IA)
  Acento tricolor: naranja -> azul -> violeta

Tokens y componentes reutilizables: scratchpad/assets/css/heynow.css
