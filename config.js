/* ═══════════════════════════════════════════════════════════════
   CONFIGURACIÓN · este archivo es tuyo

   Es el ÚNICO que no debes sustituir cuando te pase una versión nueva
   del programa. Aquí va tu identificador de Google y nada más.

   Pega entre las comillas el «ID de cliente» que te dé Google Cloud.
   Tiene esta pinta:
       123456789012-a1b2c3d4e5f6g7h8.apps.googleusercontent.com

   Mientras esté vacío, el programa funciona igual de bien: solo que
   guarda los datos en este dispositivo y no se sincroniza con Drive.
   ═══════════════════════════════════════════════════════════════ */
window.CONFIG = {
  clientId: '94523400061-8msos6tn48b0r142i3vuiqkrpdif611a.apps.googleusercontent.com',

  /* Nombre del archivo y de la carpeta que la app crea en tu Drive.
     Solo cámbialos si sabes lo que haces: si los cambias después de
     haber sincronizado, dejará de encontrar tus datos. */
  archivo: 'consola-inversion.json',
  carpeta: 'Consola de inversión',

  /* Cada cuántos minutos intenta sincronizar sola mientras la tienes
     abierta. 0 la deja en manual. */
  cadaMinutos: 10
};
