import { defineStore } from "pinia";

export const useUserStore = defineStore("user", () => {
  const profile = ref<any>(null);
  const loading = ref(false);
  const client = useSupabaseClient();
  const session = useSupabaseSession();
  const user = useSupabaseUser();

  console.log(
    "[UserStore] Initializing, session:",
    !!session.value,
    "user:",
    !!user.value
  );

  const fetchProfile = async () => {
    const token = session.value?.access_token;

    if (!token) {
      console.log("[UserStore] No token found, skipping fetchProfile");
      profile.value = null;
      return;
    }

    loading.value = true;
    try {
      const { data, error } = await client.functions.invoke("profiles", {
        method: "GET",
      });

      if (error) {
        console.error("Fetch profile error:", error);
        return;
      }

      profile.value = data?.data || null;
    } catch (err) {
      console.error("Fetch profile unexpected error:", err);
    } finally {
      loading.value = false;
    }
  };

  const clearProfile = () => {
    profile.value = null;
  };

  // Watch user/session changes to automatically sync profile
  watch(
    [session, user],
    async ([newSession, newUser]) => {
      console.log(
        "[UserStore] Watch trigger - session:",
        !!newSession,
        "user:",
        !!newUser
      );
      if ((newSession || newUser) && !profile.value && !loading.value) {
        await fetchProfile();
      } else if (!newSession && !newUser) {
        clearProfile();
      }
    },
    { immediate: true }
  );

  // Sync auth state changes (login, logout, token refresh)
  client.auth.onAuthStateChange(async (event, currentSession) => {
    console.log(
      "[UserStore] Auth event:",
      event,
      "Session exists:",
      !!currentSession
    );

    if (
      event === "SIGNED_IN" ||
      event === "TOKEN_REFRESHED" ||
      event === "INITIAL_SESSION"
    ) {
      if (currentSession && !profile.value) {
        await fetchProfile();
      }
    } else if (event === "SIGNED_OUT") {
      clearProfile();
    }
  });

  const updateProfile = async (updates: {
    username?: string;
    avatar?: string;
  }) => {
    loading.value = true;
    try {
      const { data, error } = await client.functions.invoke("profiles", {
        method: "PUT",
        body: updates,
      });

      if (error) {
        console.error("Update profile error:", error);
        return { success: false, error: error.message };
      }

      if (data?.success) {
        profile.value = data.data;
        return { success: true };
      }

      return {
        success: false,
        error: data?.error?.message || "Unknown error",
      };
    } catch (err: any) {
      console.error("Update profile unexpected error:", err);
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  return {
    profile,
    loading,
    fetchProfile,
    clearProfile,
    updateProfile,
  };
});
