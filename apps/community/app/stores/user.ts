import { defineStore } from "pinia";

export const useUserStore = defineStore("user", () => {
  const profile = ref<any>(null);
  const loading = ref(false);
  const client = useSupabaseClient();
  const session = useSupabaseSession();

  const fetchProfile = async () => {
    if (!session.value) {
      profile.value = null;
      return;
    }

    loading.value = true;
    try {
      const { data, error } = await client.functions.invoke("profiles", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.value.access_token}`,
        },
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

  watch(session, (newSession) => {
    if (!newSession) {
      clearProfile();
    }
  });

  return {
    profile,
    loading,
    fetchProfile,
    clearProfile,
  };
});
