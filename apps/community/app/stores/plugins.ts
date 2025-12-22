import { defineStore } from "pinia";

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  liked: number;
  isLiked?: boolean;
  isSubscribed?: boolean;
  status: string;
  schema: any;
  code: string;
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
        }
      );
      if (error) throw error;

      // Optimistic update
      const plugin = plugins.value.find((p) => p.id === id);
      if (plugin) {
        plugin.isSubscribed = true;
      }
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
        }
      );
      if (error) throw error;

      // Optimistic update
      const plugin = plugins.value.find((p) => p.id === id);
      if (plugin) {
        plugin.isSubscribed = false;
      }
      return true;
    } catch (err) {
      console.error("Unsubscribe plugin error:", err);
      return false;
    }
  };

  const createPlugin = async (pluginData: {
    name: string;
    description: string;
    version: string;
    schema: any;
    code: string;
  }) => {
    loading.value = true;
    try {
      const { data, error } = await client.functions.invoke("plugins", {
        method: "POST",
        body: pluginData,
      });

      if (error) {
        console.error("Create plugin error:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data?.data?.plugin };
    } catch (err: any) {
      console.error("Create plugin unexpected error:", err);
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const likePlugin = async (id: string) => {
    try {
      const { error } = await client.functions.invoke(`plugins/${id}/like`, {
        method: "POST",
      });
      if (error) throw error;

      // Optimitic update
      const plugin = plugins.value.find((p) => p.id === id);
      if (plugin) {
        plugin.isLiked = true;
        plugin.liked++;
      }
      return true;
    } catch (err) {
      console.error("Like plugin error:", err);
      return false;
    }
  };

  const unlikePlugin = async (id: string) => {
    try {
      const { error } = await client.functions.invoke(`plugins/${id}/like`, {
        method: "DELETE",
      });
      if (error) throw error;

      // Optimitic update
      const plugin = plugins.value.find((p) => p.id === id);
      if (plugin) {
        plugin.isLiked = false;
        plugin.liked--;
      }
      return true;
    } catch (err) {
      console.error("Unlike plugin error:", err);
      return false;
    }
  };

  const updatePlugin = async (
    id: string,
    pluginData: {
      name: string;
      description: string;
      version: string;
      schema: any;
      code: string;
    }
  ) => {
    loading.value = true;
    try {
      const { data, error } = await client.functions.invoke(`plugins/${id}`, {
        method: "PUT",
        body: pluginData,
      });

      if (error) {
        console.error("Update plugin error:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data?.data?.plugin };
    } catch (err: any) {
      console.error("Update plugin unexpected error:", err);
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const deletePlugin = async (id: string) => {
    loading.value = true;
    try {
      const { error } = await client.functions.invoke(`plugins/${id}`, {
        method: "DELETE",
      });

      if (error) {
        console.error("Delete plugin error:", error);
        return { success: false, error: error.message };
      }

      // Local update
      plugins.value = plugins.value.filter((p) => p.id !== id);

      return { success: true };
    } catch (err: any) {
      console.error("Delete plugin unexpected error:", err);
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
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
    createPlugin,
    updatePlugin,
    deletePlugin,
    likePlugin,
    unlikePlugin,
    subscribeToChanges,
    unsubscribeFromChanges,
  };
});
