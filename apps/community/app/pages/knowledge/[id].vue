<script setup lang="ts">
const route = useRoute();
const knowledgeStore = useKnowledgeStore();
const kbId = route.params.id as string;

const kb = ref<any>(null);
const files = ref<any[]>([]);
const loading = ref(true);
const isUploadModalOpen = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);

const isDeleteModalOpen = ref(false);
const deleting = ref(false);

const router = useRouter();
const userStore = useUserStore();

const handleDelete = async () => {
  deleting.value = true;
  const success = await knowledgeStore.deleteKnowledgeBase(kbId);
  if (success) {
    router.push("/knowledge");
  } else {
    deleting.value = false;
    isDeleteModalOpen.value = false;
  }
};

const searchQuery = ref("");
const searching = ref(false);
const searchResults = ref<any[]>([]);

const fetchDetails = async () => {
  loading.value = true;
  const [kbData, filesData] = await Promise.all([
    knowledgeStore.getKnowledgeBaseById(kbId),
    knowledgeStore.fetchKnowledgeFiles(kbId),
  ]);
  kb.value = kbData;
  files.value = filesData;
  loading.value = false;
};

onMounted(() => {
  fetchDetails();
  knowledgeStore.subscribeToFileChanges(kbId, () => {
    // Only refresh the files list to avoid full detail reload
    knowledgeStore.fetchKnowledgeFiles(kbId).then((data) => {
      files.value = data;
    });
  });
});

onUnmounted(() => {
  knowledgeStore.unsubscribeFromFileChanges();
});

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
  }
};

const handleUpload = async () => {
  if (!selectedFile.value) return;
  const result = await knowledgeStore.uploadDocument(kbId, selectedFile.value);
  if (result) {
    isUploadModalOpen.value = false;
    selectedFile.value = null;
    fetchDetails(); // Refresh list
  }
};

const handleSearch = async () => {
  if (!searchQuery.value) return;
  searching.value = true;
  try {
    searchResults.value = await knowledgeStore.searchKnowledge(
      searchQuery.value,
      [kbId]
    );
  } finally {
    searching.value = false;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "success";
    case "processing":
      return "info";
    case "failed":
      return "error";
    default:
      return "neutral";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "已就绪";
    case "processing":
      return "处理中";
    case "failed":
      return "失败";
    default:
      return status;
  }
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
</script>

<template>
  <div>
    <div v-if="loading && !kb" class="space-y-6">
      <USkeleton class="h-10 w-1/4" />
      <USkeleton class="h-4 w-1/2" />
      <div class="grid grid-cols-1 gap-4 mt-10">
        <USkeleton v-for="i in 3" :key="i" class="h-20 w-full rounded-xl" />
      </div>
    </div>

    <div v-else-if="kb">
      <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10"
      >
        <div>
          <div class="flex items-center gap-2 mb-2">
            <UButton
              icon="i-heroicons-arrow-left"
              color="neutral"
              variant="ghost"
              @click="$router.push('/knowledge')"
            />
            <h1 class="text-3xl font-bold">{{ kb.name }}</h1>
          </div>
          <p class="text-dim ml-10">{{ kb.description || "暂无描述" }}</p>
        </div>
        <div class="flex items-center gap-3 w-full md:w-auto ml-10 md:ml-0">
          <UButton
            v-if="userStore.profile?.id === kb.author?.id"
            icon="i-heroicons-trash"
            color="error"
            variant="soft"
            @click="isDeleteModalOpen = true"
          />
          <UButton
            color="primary"
            class="bg-gradient-to-r from-green-500 to-teal-500 border-none shrink-0"
            icon="i-heroicons-cloud-arrow-up"
            @click="isUploadModalOpen = true"
          >
            上传文档
          </UButton>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <UModal v-model:open="isDeleteModalOpen">
        <template #content>
          <UCard>
            <template #header>
              <h3 class="text-base font-semibold">确认删除</h3>
            </template>
            <p class="text-dim">
              确定要删除知识库
              <span class="text-main font-bold">"{{ kb.name }}"</span>
              吗？此操作不可撤销，且会删除该知识库下的所有文档。
            </p>
            <div class="flex justify-end gap-3 mt-6">
              <UButton
                variant="ghost"
                color="neutral"
                @click="isDeleteModalOpen = false"
                >取消</UButton
              >
              <UButton color="error" :loading="deleting" @click="handleDelete">
                确认删除
              </UButton>
            </div>
          </UCard>
        </template>
      </UModal>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: Document List -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-card border border-border rounded-2xl overflow-hidden">
            <div
              class="p-6 border-b border-border flex justify-between items-center"
            >
              <h2 class="text-xl font-semibold">文档列表</h2>
              <span class="text-sm text-dim">{{ files.length }} 个文档</span>
            </div>

            <div v-if="files.length === 0" class="p-20 text-center">
              <UIcon
                name="i-heroicons-document-text"
                class="w-16 h-16 text-dim mb-4 mx-auto"
              />
              <p class="text-dim">此知识库下暂无文档</p>
            </div>

            <div v-else class="divide-y divide-border">
              <div
                v-for="file in files"
                :key="file.id"
                class="p-4 hover:bg-surface transition-colors flex items-center gap-4"
              >
                <div
                  class="w-10 h-10 bg-surface rounded flex items-center justify-center text-xl"
                >
                  {{
                    file.fileType.includes("pdf")
                      ? "📕"
                      : file.fileType.includes("word")
                      ? "📘"
                      : "📄"
                  }}
                </div>
                <div class="flex-grow min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium truncate">{{
                      file.fileName
                    }}</span>
                    <UBadge
                      :color="getStatusColor(file.status)"
                      variant="soft"
                      size="xs"
                    >
                      {{ getStatusLabel(file.status) }}
                    </UBadge>
                  </div>
                  <div class="flex items-center gap-3 text-xs text-dim mt-1">
                    <span>{{ formatSize(file.fileSize) }}</span>
                    <span>•</span>
                    <span>{{ file.chunkCount || 0 }} 个切片</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <UButton
                    v-if="file.status === 'failed'"
                    icon="i-heroicons-exclamation-circle"
                    color="error"
                    variant="ghost"
                    :help="file.errorMessage"
                  />
                  <UButton
                    icon="i-heroicons-trash"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Semantic Search -->
        <div class="space-y-6">
          <div class="bg-card border border-border rounded-2xl p-6">
            <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
              <UIcon
                name="i-heroicons-magnifying-glass-circle"
                class="w-6 h-6 text-green-500"
              />
              语义检索
            </h2>
            <div class="space-y-4">
              <UInput
                v-model="searchQuery"
                placeholder="在此知识库中搜索问题..."
                @keyup.enter="handleSearch"
              >
                <template #trailing>
                  <UKbd>Enter</UKbd>
                </template>
              </UInput>
              <UButton
                block
                color="primary"
                class="bg-gradient-to-r from-green-500 to-teal-500 border-none"
                :loading="searching"
                @click="handleSearch"
              >
                搜索
              </UButton>
            </div>

            <!-- Search Results -->
            <div v-if="searchResults.length > 0" class="mt-6 space-y-4">
              <div
                v-for="(res, idx) in searchResults"
                :key="idx"
                class="bg-surface border border-border rounded-lg p-3 text-sm"
              >
                <div class="flex justify-between text-xs text-dim mb-2">
                  <span>匹配度: {{ (res.similarity * 100).toFixed(1) }}%</span>
                  <span class="truncate max-w-[100px]">{{
                    res.metadata.fileName
                  }}</span>
                </div>
                <p class="text-dim line-clamp-3 italic">"{{ res.content }}"</p>
              </div>
            </div>

            <div
              v-else-if="!searching && searchQuery"
              class="mt-6 text-center py-4"
            >
              <p class="text-xs text-dim">未找到相关匹配片段</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <UModal v-model:open="isUploadModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between w-full">
              <h3 class="text-base font-semibold">上传新文档</h3>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                class="-my-1"
                @click="isUploadModalOpen = false"
              />
            </div>
          </template>

          <div class="space-y-4">
            <div
              class="border-2 border-dashed border-white/10 rounded-xl p-10 text-center hover:border-green-500/50 transition-colors cursor-pointer"
              @click="fileInput?.click()"
            >
              <input
                ref="fileInput"
                type="file"
                class="hidden"
                @change="onFileChange"
                accept=".pdf,.docx,.txt,.md,.csv,.json"
              />
              <div v-if="!selectedFile">
                <UIcon
                  name="i-heroicons-document-plus"
                  class="w-12 h-12 text-gray-500 mb-2 mx-auto"
                />
                <p class="text-sm text-gray-400">点击或拖拽文件到此处</p>
                <p class="text-xs text-gray-500 mt-1">
                  支持 PDF, Word, TXT, MD, CSV, JSON
                </p>
              </div>
              <div v-else class="flex items-center justify-center gap-2">
                <UIcon
                  name="i-heroicons-document-check"
                  class="w-8 h-8 text-green-500"
                />
                <span class="font-medium text-green-400">{{
                  selectedFile.name
                }}</span>
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-x-mark"
                  size="xs"
                  @click.stop="selectedFile = null"
                />
              </div>
            </div>

            <div class="flex justify-end gap-3 mt-6">
              <UButton
                variant="ghost"
                color="neutral"
                @click="isUploadModalOpen = false"
                >取消</UButton
              >
              <UButton
                color="primary"
                class="bg-gradient-to-r from-green-500 to-teal-500"
                :disabled="!selectedFile"
                @click="handleUpload"
              >
                开始上传并处理
              </UButton>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
