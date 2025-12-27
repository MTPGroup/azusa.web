import { defineStore } from "pinia";

export interface Character {
  id: string;
  name: string;
  signature: string;
  persona: string;
  avatarUrl: string | null;
  isPublic: boolean;
  creatorId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    uid: string;
    name: string;
    avatar: string | null;
  };
}

export interface CharacterPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const useCharacterStore = defineStore("characters", () => {
  const characters = ref<Character[]>([]);
  const pagination = ref<CharacterPagination | null>(null);
  const loading = ref(false);
  const client = useSupabaseClient();
  let channel: any | null = null;
  const mapCharacter = (char: any): Character => ({
    id: char.id,
    name: char.name,
    signature: char.bio || char.signature || "",
    persona: char.originPrompt || char.persona || "",
    avatarUrl: char.avatar || char.avatarUrl || null,
    isPublic: char.isPublic,
    creatorId: char.creatorId || char.authorId,
    authorId: char.authorId,
    createdAt: char.createdAt,
    updatedAt: char.updatedAt,
    author: char.author
      ? {
          id: char.author.id,
          uid: char.author.uid,
          name: char.author.name,
          avatar: char.author.avatar,
        }
      : undefined,
  });

  const fetchCharacters = async (
    params: { page?: number; limit?: number; search?: string } = {}
  ) => {
    loading.value = true;
    try {
      const qs = new URLSearchParams();
      if (params.page) qs.append("page", params.page.toString());
      if (params.limit) qs.append("limit", params.limit.toString());
      if (params.search) qs.append("search", params.search);

      const { data, error } = await client.functions.invoke(
        `characters?${qs.toString()}`,
        {
          method: "GET",
        }
      );

      if (error) throw error;

      characters.value = data.data.characters.map(mapCharacter);
      pagination.value = data.data.pagination;
    } catch (err) {
      console.error("Fetch characters error:", err);
    } finally {
      loading.value = false;
    }
  };

  const getCharacter = async (id: string) => {
    try {
      const { data, error } = await client.functions.invoke(
        `characters/${id}`,
        {
          method: "GET",
        }
      );
      if (error) throw error;
      return mapCharacter(data.data);
    } catch (err) {
      console.error("Get character detail error:", err);
      return null;
    }
  };

  const createCharacter = async (char: Partial<Character>) => {
    try {
      const { data, error } = await client.functions.invoke("characters", {
        method: "POST",
        body: {
          name: char.name,
          bio: char.signature,
          avatar: char.avatarUrl,
          originPrompt: char.persona,
          isPublic: char.isPublic,
        },
      });

      if (error) throw error;
      return mapCharacter(data.data);
    } catch (err) {
      console.error("Create character error:", err);
      throw err;
    }
  };

  const updateCharacter = async (id: string, char: Partial<Character>) => {
    try {
      const { data, error } = await client.functions.invoke(
        `characters/${id}`,
        {
          method: "PUT",
          body: {
            name: char.name,
            bio: char.signature,
            avatar: char.avatarUrl,
            originPrompt: char.persona,
            isPublic: char.isPublic,
          },
        }
      );

      if (error) throw error;
      return mapCharacter(data.data);
    } catch (err) {
      console.error("Update character error:", err);
      throw err;
    }
  };

  const deleteCharacter = async (id: string) => {
    try {
      const { error } = await client.functions.invoke(`characters/${id}`, {
        method: "DELETE",
      });

      if (error) throw error;
      await fetchCharacters();
    } catch (err) {
      console.error("Delete character error:", err);
      throw err;
    }
  };

  let channelProfiles: any | null = null;

  const subscribeToChanges = () => {
    if (!channel) {
      channel = client
        .channel("public:characters")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "characters" },
          () => {
            fetchCharacters();
          }
        )
        .subscribe();
    }

    if (!channelProfiles) {
      channelProfiles = client
        .channel("public:profiles-for-characters")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "profiles" },
          () => {
            if (characters.value.length > 0) {
              fetchCharacters();
            }
          }
        )
        .subscribe();
    }
  };

  const unsubscribeFromChanges = () => {
    if (channel) {
      client.removeChannel(channel);
      channel = null;
    }
    if (channelProfiles) {
      client.removeChannel(channelProfiles);
      channelProfiles = null;
    }
  };

  return {
    characters,
    pagination,
    loading,
    fetchCharacters,
    getCharacter,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    subscribeToChanges,
    unsubscribeFromChanges,
  };
});
