// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxtjs/supabase", "@pinia/nuxt", "@nuxt/ui"],
  css: ["@/assets/css/main.css"],
  supabase: {
    redirect: false,
    useSsrCookies: false,
    cookieOptions: {
      maxAge: 60 * 60 * 8, // 8 hours
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    clientOptions: {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  },
});
