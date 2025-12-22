import { defineStore } from "pinia";

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  liked: number;
  status: string;
  author: {
    id: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const usePluginsStore = defineStore("plugins", () => {
  const plugins = ref<Plugin[]>([]);
  const loading = ref(false);
  const client = useSupabaseClient();

  const fetchPlugins = async (params?: {
    status?: string;
    authorId?: string;
  }) => {
    loading.value = true;
    try {
      // Create query string from params
      const qs = params
        ? "?" + new URLSearchParams(params as any).toString()
        : "";

      const { data, error } = await client.functions.invoke(`plugins${qs}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${useSupabaseSession().value?.access_token}`,
        },
      });

      if (error) {
        console.error("Fetch plugins error:", error);
        return;
      }

      plugins.value = data?.data?.plugins || [];
    } catch (err) {
      console.error("Fetch plugins unexpected error:", err);
    } finally {
      loading.value = false;
    }
  };

  const getPluginById = async (id: string) => {
    try {
      const { data, error } = await client.functions.invoke(`plugins/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${useSupabaseSession().value?.access_token}`,
        },
      });

      if (error) {
        console.error("Fetch plugin detail error:", error);
        return null;
      }

      return data?.data?.plugin || null;
    } catch (err) {
      console.error("Fetch plugin detail unexpected error:", err);
      return null;
    }
  };

  const subscribePlugin = async (id: string) => {
    try {
      const { error } = await client.functions.invoke(
        `plugins/${id}/subscribe`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${useSupabaseSession().value?.access_token}`,
          },
        }
      );
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Subscribe plugin error:", err);
      return false;
    }
  };

  const unsubscribePlugin = async (id: string) => {
    try {
      const { error } = await client.functions.invoke(
        `plugins/${id}/subscribe`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${useSupabaseSession().value?.access_token}`,
          },
        }
      );
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Unsubscribe plugin error:", err);
      return false;
    }
  };

  let pluginsSubscription: any = null;
  const subscribeToChanges = () => {
    if (pluginsSubscription) return;

    pluginsSubscription = client
      .channel("public:plugins")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plugins" },
        () => {
          fetchPlugins();
        }
      )
      .subscribe();
  };

  const unsubscribeFromChanges = () => {
    if (pluginsSubscription) {
      client.removeChannel(pluginsSubscription);
      pluginsSubscription = null;
    }
  };

  return {
    plugins,
    loading,
    fetchPlugins,
    getPluginById,
    subscribePlugin,
    unsubscribePlugin,
    subscribeToChanges,
    unsubscribeFromChanges,
  };
});
