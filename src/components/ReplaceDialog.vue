<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="替换字段值"
    :style="{ width: '460px' }"
    @show="onShow"
  >
    <div v-if="field" class="rep-body">
      <div class="rep-row">
        <span class="rep-k">字段</span>
        <span class="rep-v">{{ field.name }} <em class="rep-type">{{ field.type }}</em></span>
      </div>
      <div class="rep-row">
        <span class="rep-k">位置</span>
        <span class="rep-v mono">0x{{ field.start.toString(16) }} · {{ field.length }}B</span>
      </div>
      <div class="rep-row">
        <span class="rep-k">当前值</span>
        <span class="rep-v mono">{{ curVal }}</span>
      </div>
      <div class="rep-row col">
        <span class="rep-k">新值</span>
        <Textarea
          v-model="draft"
          class="rep-input"
          :autoResize="true"
          rows="2"
          :placeholder="hint"
          spellcheck="false"
        />
        <small class="rep-hint">{{ hint }}</small>
      </div>
      <div v-if="err" class="rep-err">{{ err }}</div>
    </div>
    <template #footer>
      <Button label="取消" severity="secondary" text @click="visible = false" />
      <Button label="应用替换" icon="pi pi-check" @click="apply" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import { useAnalyzer } from '../store/useAnalyzer.js'

const { state, replaceFieldValue, displayFieldValue, editFieldValue, typeHint, closeReplace } =
  useAnalyzer()

const visible = computed({
  get: () => state.repOpen,
  set: (v) => {
    if (!v) closeReplace()
  },
})
const field = computed(() =>
  state.repIdx >= 0 && state.currentFields[state.repIdx] ? state.currentFields[state.repIdx] : null,
)
const curVal = computed(() => (field.value ? displayFieldValue(field.value) : ''))
const hint = computed(() => (field.value ? typeHint(field.value.type) : ''))
const draft = ref('')
const err = ref('')

function onShow() {
  err.value = ''
  draft.value = field.value ? editFieldValue(field.value) : ''
}
function apply() {
  const r = replaceFieldValue(state.repIdx, draft.value)
  if (r && r.error) {
    err.value = r.error
    return
  }
  closeReplace()
}
</script>

<style scoped>
.rep-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rep-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.rep-row.col {
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
}
.rep-k {
  width: 56px;
  flex: none;
  color: var(--tx2);
  font-size: 12px;
}
.rep-v {
  font-size: 13px;
  word-break: break-all;
}
.rep-type {
  font-style: normal;
  color: var(--ac);
  background: var(--acbg);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  margin-left: 6px;
}
.mono {
  font-family: var(--mono);
  font-size: 12px;
}
.rep-input {
  font-family: var(--mono);
  font-size: 12.5px;
}
.rep-hint {
  color: var(--tx3);
  font-size: 11px;
}
.rep-err {
  color: var(--errtx);
  background: var(--errbg);
  border: 1px solid var(--errbd);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
}
</style>
