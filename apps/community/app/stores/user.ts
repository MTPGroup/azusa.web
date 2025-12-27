import { defineStore } from "pinia";

import { useCharacterStore } from "@/stores/characters";
import { useKnowledgeStore } from "@/stores/knowledge";
import { usePluginsStore } from "@/stores/plugins";

export const useUserStore = defineStore("user", () => {
  const profile = ref<any>(null);
  const loading = ref(false);
  const client = useSupabaseClient();
  const session = useSupabaseSession();
  const user = useSupabaseUser();
  const config = useRuntimeConfig();
  const functionsBase = `${(config.public?.supabase?.url || "").replace(/\/$/, "")}/functions/v1`;
  const supabaseKey = config.public?.supabase?.key || "";

  const characterStore = useCharacterStore();
  const knowledgeStore = useKnowledgeStore();
  const pluginsStore = usePluginsStore();

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
        if (characterStore.characters.length > 0) {
          characterStore.fetchCharacters();
        }
        if (knowledgeStore.knowledgeBases.length > 0) {
          knowledgeStore.fetchKnowledgeBases();
        }
        if (pluginsStore.plugins.length > 0) {
          pluginsStore.fetchPlugins();
        }
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

  const uploadAvatar = async (file: File) => {
    if (!file) return { success: false, error: "请选择文件" };
    loading.value = true;
    try {
      const { data: sessionData } = await client.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${functionsBase}/profiles/avatar`, {
        method: "POST",
        headers: {
          ...(supabaseKey ? { apikey: supabaseKey } : {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        const message = json?.error?.message || "上传失败";
        return { success: false, error: message };
      }

      const avatarUrl = json.data?.avatarUrl;
      if (avatarUrl) {
        profile.value = json.data?.profile || profile.value;
        return { success: true, avatarUrl };
      }
      return { success: false, error: "未获取到头像地址" };
    } catch (err: any) {
      console.error("Upload avatar error:", err);
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
    uploadAvatar,
  };
});
