import { defineStore } from "pinia";

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  author: {
    id: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  status: "processing" | "completed" | "failed";
  chunkCount?: number;
  errorMessage?: string;
  createdAt: string;
}

export const useKnowledgeStore = defineStore("knowledge", () => {
  const knowledgeBases = ref<KnowledgeBase[]>([]);
  const loading = ref(false);
  const client = useSupabaseClient();

  const fetchKnowledgeBases = async (params?: {
    public?: boolean;
    authorId?: string;
  }) => {
    loading.value = true;
    try {
      const qs = params
        ? "?" + new URLSearchParams(params as any).toString()
        : "";
      const { data, error } = await client.functions.invoke(
        `knowledge/bases${qs}`,
        {
          method: "GET",
        }
      );

      if (error) {
        console.error("Fetch knowledge bases error:", error);
        return;
      }

      knowledgeBases.value = data?.data?.knowledgeBases || [];
    } catch (err) {
      console.error("Fetch knowledge bases unexpected error:", err);
    } finally {
      loading.value = false;
    }
  };

  const getKnowledgeBaseById = async (id: string) => {
    try {
      const { data, error } = await client.functions.invoke(
        `knowledge/bases/${id}`,
        {
          method: "GET",
        }
      );
      if (error) throw error;
      return data?.data?.knowledgeBase as KnowledgeBase;
    } catch (err) {
      console.error("Fetch knowledge base detail error:", err);
      return null;
    }
  };

  const fetchKnowledgeFiles = async (kbId: string) => {
    try {
      const { data, error } = await client.functions.invoke(
        `knowledge/bases/${kbId}/files`,
        {
          method: "GET",
        }
      );
      if (error) throw error;
      return data?.data?.files as KnowledgeFile[];
    } catch (err) {
      console.error("Fetch knowledge files error:", err);
      return [];
    }
  };

  const uploadDocument = async (kbId: string, file: File, metadata?: any) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (metadata) {
        formData.append("metadata", JSON.stringify(metadata));
      }

      const { data, error } = await client.functions.invoke(
        `knowledge/bases/${kbId}/documents`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (error) throw error;
      return data?.data?.file;
    } catch (err) {
      console.error("Upload document error:", err);
      return null;
    }
  };

  const createKnowledgeBase = async (kb: {
    name: string;
    description?: string;
    isPublic: boolean;
  }) => {
    try {
      const { data, error } = await client.functions.invoke("knowledge/bases", {
        method: "POST",
        body: kb,
      });

      if (error) throw error;

      await fetchKnowledgeBases();
      return data?.data?.knowledgeBase;
    } catch (err) {
      console.error("Create knowledge base error:", err);
      return null;
    }
  };

  const updateKnowledgeBase = async (
    id: string,
    kb: { name?: string; description?: string; isPublic?: boolean }
  ) => {
    try {
      const { data, error } = await client.functions.invoke(
        `knowledge/bases/${id}`,
        {
          method: "PATCH",
          body: kb,
        }
      );

      if (error) throw error;

      await fetchKnowledgeBases();
      return data?.data?.knowledgeBase as KnowledgeBase;
    } catch (err) {
      console.error("Update knowledge base error:", err);
      return null;
    }
  };

  const searchKnowledge = async (query: string, knowledgeBaseIds: string[]) => {
    try {
      const { data, error } = await client.functions.invoke(
        "knowledge/search",
        {
          method: "POST",
          body: { query, knowledgeBaseIds },
        }
      );

      if (error) throw error;
      return data?.data?.documents || [];
    } catch (err) {
      console.error("Search knowledge error:", err);
      return [];
    }
  };

  const deleteKnowledgeBase = async (id: string) => {
    try {
      const { error } = await client.functions.invoke(`knowledge/bases/${id}`, {
        method: "DELETE",
      });

      if (error) throw error;

      await fetchKnowledgeBases();
      return true;
    } catch (err) {
      console.error("Delete knowledge base error:", err);
      return false;
    }
  };

  let kbSubscription: any = null;

  const subscribeToChanges = () => {
    if (kbSubscription) return;

    kbSubscription = client
      .channel("public:knowledge_bases")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "knowledge_bases" },
        () => {
          fetchKnowledgeBases();
        }
      )
      .subscribe();
  };

  const unsubscribeFromChanges = () => {
    if (kbSubscription) {
      client.removeChannel(kbSubscription);
      kbSubscription = null;
    }
  };

  let fileSubscription: any = null;

  const subscribeToFileChanges = (kbId: string, onUpdate: () => void) => {
    if (fileSubscription) return;

    fileSubscription = client
      .channel(`public:knowledge_files:${kbId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "knowledge_files",
          filter: `knowledge_base_id=eq.${kbId}`,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();
  };

  const unsubscribeFromFileChanges = () => {
    if (fileSubscription) {
      client.removeChannel(fileSubscription);
      fileSubscription = null;
    }
  };

  return {
    knowledgeBases,
    loading,
    fetchKnowledgeBases,
    getKnowledgeBaseById,
    fetchKnowledgeFiles,
    uploadDocument,
    createKnowledgeBase,
    updateKnowledgeBase,
    deleteKnowledgeBase,
    searchKnowledge,
    subscribeToChanges,
    unsubscribeFromChanges,
    subscribeToFileChanges,
    unsubscribeFromFileChanges,
  };
});
