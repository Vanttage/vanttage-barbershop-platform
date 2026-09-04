/**
 * Prefijos usados como `id` sintético en el `User` que devuelve profile()
 * de Google cuando NO hay (todavía) una fila real en la tabla `users`.
 * Se comparten entre src/lib/auth.ts y src/middleware.ts, que no pueden
 * importarse entre sí (uno corre en el edge runtime del middleware).
 *
 * - PENDING: correo verificado por Google pero sin cuenta NAVA — signIn()
 *   lo deja pasar (crea sesión) y el middleware lo manda a
 *   /register/completar para terminar el registro sin pedir contraseña.
 * - DENIED: correo verificado por Google que SÍ tiene una cuenta, pero
 *   inactiva (usuario, tenant o barbería desactivados) — signIn() lo
 *   rechaza con /login?error=GoogleNoAccount.
 */
export const GOOGLE_PENDING_PREFIX = "google-pending:";
export const GOOGLE_DENIED_PREFIX = "google-denied:";
